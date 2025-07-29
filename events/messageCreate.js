// events/messageCreate.js
require('dotenv').config();
const CASINOS = require('./casinos');
const { promos, refreshExpired, refreshPromotions } = require('../utils/promotions');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');
const MESSAGES = require('../config/messages');
const VIPS = require('./vips');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

// VIP_CHECKLISTS removido - agora carregado dinamicamente de events/vips/

// Função para verificar se o usuário tem cargo de verificação para um casino
function isUserVerifiedForCasino(member, casino) {
  const casinoData = CASINOS[casino];
  if (!casinoData || !casinoData.cargoafiliado) return false;
  
  return member.roles.cache.has(casinoData.cargoafiliado);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      if (message.author.bot || message.channel.type !== 0) return;
      const ticketState = client.ticketStates.get(message.channel.id);
      if (!ticketState) return;

      // --- TWITCH PROFILE (GTB) ---
      if (ticketState.awaitTwitchProfile) {
        let updated = false;
        if (message.attachments.size > 0) {
          ticketState.twitchProfile = ticketState.twitchProfile || {};
          ticketState.twitchProfile.hasImage = true;
          updated = true;
        }
        if (message.content && message.content.trim().length >= 3) {
          ticketState.twitchProfile = ticketState.twitchProfile || {};
          ticketState.twitchProfile.hasText = true;
          ticketState.twitchProfile.text = message.content.trim();
          updated = true;
        }
        if (updated) await client.saveTicketState(message.channel.id, ticketState);
        if (ticketState.twitchProfile && ticketState.twitchProfile.hasImage && ticketState.twitchProfile.hasText) {
          ticketState.awaitTwitchProfile = false;
          await client.saveTicketState(message.channel.id, ticketState);
          await message.channel.send({
            embeds: [EmbedFactory.success('Perfil da Twitch recebido! Agora escolha o casino.')] });
          return askCasino(message.channel);
        } else {
          await message.reply({ embeds: [EmbedFactory.warning('Ainda falta enviar o nome e a foto do perfil da Twitch!')] });
          return;
        }
      }

      // --- 18+ CONFIRMATION ---
      if (ticketState.awaitConfirm) {
        if (CONFIRM_RX.test(message.content.trim())) {
          ticketState.awaitConfirm = false;
          await client.saveTicketState(message.channel.id, ticketState);
          await client.db.logAction(message.channel.id, message.author.id, 'age_confirmed', null);
          const typeButtons = ComponentFactory.giveawayTypeButtons();
          const components = [typeButtons];
          await refreshExpired();
          await refreshPromotions();
          const promoButtons = ComponentFactory.promoButtons(promos);
          components.push(...promoButtons);
          return message.channel.send({ embeds: [EmbedFactory.giveaway()], components });
        }
        return message.reply({ embeds: [EmbedFactory.error(MESSAGES.CONFIRMATION.INVALID_RESPONSE)] });
      }

      // --- LTC ONLY (USUÁRIO VERIFICADO) ---
      if (ticketState.awaitLtcOnly) {
        if (!ticketState.ltcData) ticketState.ltcData = {};
        if (!ticketState.stepData) ticketState.stepData = {};
        if (message.attachments.size > 0) {
          ticketState.ltcData.hasImage = true;
          if (!ticketState.stepData[0]) ticketState.stepData[0] = {};
          ticketState.stepData[0].hasImage = true;
        }
        const ltcAddress = message.content.trim();
        if (ltcAddress.length >= 25 && (ltcAddress.startsWith('L') || ltcAddress.startsWith('M') || ltcAddress.startsWith('ltc1'))) {
          ticketState.ltcData.hasAddress = true;
          ticketState.ltcAddress = ltcAddress;
          if (!ticketState.stepData[0]) ticketState.stepData[0] = {};
          ticketState.stepData[0].hasLtcAdress = true;
          ticketState.stepData[0].ltcAdressContent = ltcAddress;
        } else if (ltcAddress.length >= 10) {
          ticketState.ltcData.hasAddress = true;
          ticketState.ltcAddress = ltcAddress;
          if (!ticketState.stepData[0]) ticketState.stepData[0] = {};
          ticketState.stepData[0].hasLtcAdress = true;
          ticketState.stepData[0].ltcAdressContent = ltcAddress;
        }
        await client.saveTicketState(message.channel.id, ticketState);
        if (!ticketState.ltcData.hasImage || !ticketState.ltcData.hasAddress) {
          const missing = [];
          if (!ticketState.ltcData.hasAddress) missing.push('**endereço LTC**');
          if (!ticketState.ltcData.hasImage) missing.push('**comprovativo de depósito**');
          return message.reply({ embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.VERIFIED_USER_MISSING.replace('{missing}', missing.join(' e ')))] });
        }
        ticketState.awaitLtcOnly = false;
        delete ticketState.ltcData;
        await client.saveTicketState(message.channel.id, ticketState);
        
        // NOVO: Step extra para giveaway "outro" mesmo para usuários verificados
        if (ticketState.gwType === 'other') {
          ticketState.awaitOtherGiveaway = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          return message.reply({
            embeds: [EmbedFactory.info(
              '🎁 **Que giveaway foi ganho?**\n\n' +
              '• **Se foi um BBB coloca print da twitch**\n' +
              '• **Se foi relacionado com a Twitch**, escreve o motivo e coloca print do perfil da twitch'
            )]
          });
        }
        
        return message.reply({ embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.VERIFIED_USER_COMPLETE)], components: [ComponentFactory.finishButtons()] });
      }

      // --- TWITCH NICK/REDEEMS ---
      if (ticketState.awaitTwitchNick) {
        if (!ticketState.twitchData) ticketState.twitchData = {};
        if (message.attachments.size > 0) ticketState.twitchData.hasImage = true;
        const twitchNick = message.content.trim();
        if (twitchNick && twitchNick.length >= 3) {
          ticketState.twitchData.hasNick = true;
          ticketState.twitchNick = twitchNick;
        }
        await client.saveTicketState(message.channel.id, ticketState);
        if (ticketState.twitchData.hasNick && ticketState.twitchData.hasImage) {
          ticketState.awaitTwitchNick = false;
          delete ticketState.twitchData;
          await client.saveTicketState(message.channel.id, ticketState);
          await client.db.logAction(message.channel.id, message.author.id, 'twitch_nick_provided', ticketState.twitchNick);
          const redeems = await client.db.getUserRedeems(ticketState.twitchNick);
          if (redeems.length === 0) {
            return message.reply({ embeds: [EmbedFactory.websiteNoRedeems(ticketState.twitchNick)], components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())] });
          }
          const embed = EmbedFactory.websiteRedeemList(ticketState.twitchNick, redeems);
          const components = ComponentFactory.redeemSelectButtons(redeems);
          return message.reply({ embeds: [embed], components });
        }
        return; // Aguardar mais input
      }

      // --- STEP EXTRA PARA GIVEAWAY "OUTRO" ---
      if (ticketState.awaitOtherGiveaway) {
        if (message.content.trim().length < 10) {
          return message.reply({ embeds: [EmbedFactory.error('❌ **Descrição muito curta!**\n\nPor favor, explique melhor o giveaway que ganhou.')] });
        }
        
        ticketState.otherGiveawayDescription = message.content.trim();
        ticketState.awaitOtherGiveaway = false;
        await client.saveTicketState(message.channel.id, ticketState);
        
        await client.db.logAction(message.channel.id, message.author.id, 'other_giveaway_description', ticketState.otherGiveawayDescription.substring(0, 100));
        
        return message.reply({ 
          embeds: [EmbedFactory.success('✅ **Descrição do giveaway recebida!**\n\nAgora pode finalizar o ticket.')], 
          components: [ComponentFactory.finishButtons()] 
        });
      }

      // --- DESCRIÇÃO (DÚVIDAS, OUTROS, WEBSITE BUG) ---
      if (ticketState.awaitDescription) {
        if (message.content.trim().length < 10) {
          return message.reply({ embeds: [EmbedFactory.error(MESSAGES.QUESTIONS.DESCRIPTION_TOO_SHORT)] });
        }
        ticketState.description = message.content.trim();
        ticketState.awaitDescription = false;
        await client.saveTicketState(message.channel.id, ticketState);
        await client.db.logAction(message.channel.id, message.author.id, 'description_provided', ticketState.description.substring(0, 100));
        const ajudasChannel = await message.guild.channels.fetch(CHANNELS.AJUDAS).catch(() => null);
        if (ajudasChannel && ajudasChannel.send) {
          let notificationText = '';
          if (ticketState.category === 'Website' && ticketState.websiteType === 'bug') {
            notificationText = MESSAGES.WEBSITE.BUG_NOTIFICATION
              .replace('{number}', ticketState.ticketNumber)
              .replace('{user}', ticketState.ownerTag)
              .replace('{description}', ticketState.description)
              .replace('{channel}', message.channel);
          } else {
            notificationText = MESSAGES.QUESTIONS.NOTIFICATION
              .replace('{category}', ticketState.category)
              .replace('{number}', ticketState.ticketNumber)
              .replace('{user}', ticketState.ownerTag)
              .replace('{description}', ticketState.description)
              .replace('{channel}', message.channel);
          }
          const embed = EmbedFactory.warning(notificationText);
          const components = ComponentFactory.supportCompletionButton(`description_${message.channel.id}`);
          await ajudasChannel.send({ embeds: [embed], components });
        } else {
          console.error('❌ AJUDAS_CHANNEL_ID not found, invalid, or not a text channel');
        }
        return message.reply({ embeds: [EmbedFactory.success(MESSAGES.QUESTIONS.DESCRIPTION_RECEIVED)] });
      }

      // --- VIP CHECKLIST ---
      if (ticketState.vipType && ticketState.awaitProof) {
        const vip = VIPS[ticketState.vipType];
        if (!vip || !vip.checklist) {
          return message.reply({ embeds: [EmbedFactory.error(`VIP type '${ticketState.vipType}' não configurado corretamente`)] });
        }
        const stepIndex = ticketState.step ?? 0;
        const currentStep = vip.checklist[stepIndex];
        const stepTypes = Array.isArray(currentStep?.type) ? currentStep.type : [];
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};
        if (stepTypes.includes('image') && message.attachments.size > 0) {
          ticketState.stepData[stepIndex].hasImage = true;
          await client.saveTicketState(message.channel.id, ticketState);
        }
        if (stepTypes.includes('text') && message.content && message.content.trim().length >= 5) {
          ticketState.stepData[stepIndex].hasText = true;
          ticketState.stepData[stepIndex].textContent = message.content.trim();
          await client.saveTicketState(message.channel.id, ticketState);
        }
        const allRequirementsMet = stepTypes.every(type => {
          if (type === 'image') return ticketState.stepData[stepIndex].hasImage;
          if (type === 'text') return ticketState.stepData[stepIndex].hasText;
          return false;
        });
        if (allRequirementsMet) {
          ticketState.awaitProof = false;
          await client.saveTicketState(message.channel.id, ticketState);
          if (stepIndex + 1 < vip.checklist.length) {
            ticketState.step++;
            ticketState.awaitProof = true;
            await client.saveTicketState(message.channel.id, ticketState);
            return askVipChecklist(message.channel, ticketState);
          }
          await client.db.logAction(message.channel.id, message.author.id, 'vip_checklist_completed', `Type: ${ticketState.vipType}, Casino: ${ticketState.vipCasino}`);
          return message.reply({ embeds: [EmbedFactory.success(`Checklist do VIP ${vip.label} completado!`)], components: [ComponentFactory.finishButtons()] });
        } else {
          const missing = [];
          if (stepTypes.includes('image') && !ticketState.stepData[stepIndex].hasImage) missing.push('**imagem**');
          if (stepTypes.includes('text') && !ticketState.stepData[stepIndex].hasText) missing.push('**texto**');
          return message.reply({ embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))] });
        }
      }

      // --- TELEGRAM CODE + SCREENSHOT ---
      if (ticketState.gwType === 'telegram' && !ticketState.casino) {
        if (!ticketState.telegramData) ticketState.telegramData = {};
        if (message.attachments.size > 0) ticketState.telegramData.hasImage = true;
        const codeMatch = message.content.match(/[a-f0-9]{8}/i);
        if (codeMatch) {
          ticketState.telegramData.hasCode = true;
          ticketState.telegramCode = codeMatch[0].toLowerCase();
        }
        await client.saveTicketState(message.channel.id, ticketState);
        if (!ticketState.telegramData.hasCode || !ticketState.telegramData.hasImage) {
          const missing = [];
          if (!ticketState.telegramData.hasCode) missing.push('**código**');
          if (!ticketState.telegramData.hasImage) missing.push('**screenshot**');
          return message.reply({ embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_MISSING.replace('{missing}', missing.join(' e ')))] });
        }
        delete ticketState.telegramData;
        // ... (restante da lógica de verificação de código duplicado, etc)
      }

      // --- CHECKLIST DOS CASINOS ---
      if (!ticketState.vipType && ticketState.awaitProof) {
        const casino = CASINOS[ticketState.casino];
        if (!casino || !casino.checklist) return;
        const stepIndex = ticketState.step ?? 0;
        // CORREÇÃO: garantir inicialização
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};
        const stepTypes = Array.isArray(casino.checklist[stepIndex]?.type) ? casino.checklist[stepIndex].type : [];
        let updated = false;
        if (stepTypes.includes('image') && message.attachments.size > 0) {
          ticketState.stepData[stepIndex].hasImage = true;
          updated = true;
        }
        if (stepTypes.includes('text') && message.content && message.content.trim().length >= 5) {
          ticketState.stepData[stepIndex].hasText = true;
          ticketState.stepData[stepIndex].textContent = message.content.trim();
          updated = true;
          const textContent = message.content.trim();
          if (textContent.length >= 25 && (textContent.startsWith('L') || textContent.startsWith('M') || textContent.startsWith('ltc1'))) {
            ticketState.ltcAddress = textContent;
          } else if (textContent.length >= 10 && !ticketState.ltcAddress) {
            ticketState.ltcAddress = textContent;
          }
          if (ticketState.casino === 'BCGame' && !ticketState.bcGameId) {
            if (/^\d+$/.test(textContent) && textContent.length >= 5 && textContent.length <= 15) {
              if (textContent !== ticketState.ticketNumber?.toString()) {
                ticketState.bcGameId = textContent;
              }
            }
            const idMatch = textContent.match(/(?:bcgame\s*id|id)\s*:?\s*(\d{5,15})/i);
            if (idMatch && !ticketState.bcGameId) {
              const extractedId = idMatch[1];
              if (extractedId !== ticketState.ticketNumber?.toString()) {
                ticketState.bcGameId = extractedId;
              }
            }
          }
        }
        // Salvar estado se houve atualização
        if (updated) await client.saveTicketState(message.channel.id, ticketState);
        const allRequirementsMet = stepTypes.every(type => {
          if (type === 'image') return ticketState.stepData[stepIndex].hasImage;
          if (type === 'text') return ticketState.stepData[stepIndex].hasText;
          return false;
        });
        if (allRequirementsMet) {
          ticketState.awaitProof = false;
          await client.saveTicketState(message.channel.id, ticketState);
          await client.db.logAction(message.channel.id, message.author.id, 'step_completed', `Step ${stepIndex + 1}`);
          if (stepIndex + 1 < casino.checklist.length) {
            ticketState.step++;
            ticketState.awaitProof = true;
            await client.saveTicketState(message.channel.id, ticketState);
            return askChecklist(message.channel, ticketState);
          }
          await client.db.logAction(message.channel.id, message.author.id, 'checklist_completed', `Casino: ${ticketState.casino}`);
          // Garantir LTC
          if (!ticketState.ltcAddress && ticketState.stepData) {
            for (const [stepIdx, stepData] of Object.entries(ticketState.stepData)) {
              if (stepData.textContent) {
                const text = stepData.textContent.trim();
                if (text.length >= 25 && (text.startsWith('L') || text.startsWith('M') || text.startsWith('ltc1'))) {
                  ticketState.ltcAddress = text;
                  await client.saveTicketState(message.channel.id, ticketState);
                  break;
                }
              }
            }
            if (!ticketState.ltcAddress) {
              for (const [stepIdx, stepData] of Object.entries(ticketState.stepData)) {
                if (stepData.textContent && stepData.textContent.trim().length >= 10) {
                  ticketState.ltcAddress = stepData.textContent.trim();
                  await client.saveTicketState(message.channel.id, ticketState);
                  break;
                }
              }
            }
          }
          
          // NOVO: Step extra para giveaway "outro"
          if (ticketState.gwType === 'other') {
            ticketState.step = casino.checklist.length; // Step extra após o checklist
            ticketState.awaitOtherGiveaway = true;
            await client.saveTicketState(message.channel.id, ticketState);
            
            return message.reply({
              embeds: [EmbedFactory.info(
                '🎁 **Que giveaway foi ganho?**\n\n' +
                '• **Se foi um BBB coloca print da twitch**\n' +
                '• **Se foi relacionado com a Twitch**, escreve o motivo e coloca print do perfil da twitch'
              )]
            });
          }
          
          return message.reply({ embeds: [EmbedFactory.success(MESSAGES.CHECKLIST.COMPLETED)], components: [ComponentFactory.finishButtons()] });
        } else {
          await client.saveTicketState(message.channel.id, ticketState);
          const missing = [];
          if (stepTypes.includes('image') && !ticketState.stepData[stepIndex].hasImage) missing.push('**imagem**');
          if (stepTypes.includes('text') && !ticketState.stepData[stepIndex].hasText) missing.push('**texto**');
          return message.reply({ embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))] });
        }
      }
    } catch (error) {
      console.error('🚨 Message handler error:', error);
      if (client.errorHandler) {
        await client.errorHandler.sendErrorToSupport(error, 'Message handler error');
      }
      throw error;
    }
  }
};

// Helper Functions
function findCasinoId(name) {
  // CASO TENHA ; OU , TEM QUE SEPARAR E PERCORRER O ARRAY E VERIFICAR SE O CASINO EXISTE
  if (name.includes(';') || name.includes(',')) {
    const separator = name.includes(';') ? ';' : ',';
    const casinos = name.split(separator);
    for (const casino of casinos) {
      const id = Object.keys(CASINOS).find(id => id.toLowerCase() === casino.toLowerCase() || CASINOS[id].label.toLowerCase() === casino.toLowerCase());
      if (id) return id;
    }
  } else {
    return Object.keys(CASINOS).find(id => 
      id.toLowerCase() === name.toLowerCase() || 
      CASINOS[id].label.toLowerCase() === name.toLowerCase()
    ) || null;
  }
}

function askCasino(channel) {
  channel.send({
    embeds: [EmbedFactory.casino(
      MESSAGES.GIVEAWAYS.CASINO_SELECTION_TITLE,
      MESSAGES.GIVEAWAYS.CASINO_SELECTION_ALL
    )],
    components: [ComponentFactory.casinoSelectMenu(CASINOS)]
  });
}

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  if (!casino) {
    return channel.send({
      embeds: [EmbedFactory.error(MESSAGES.ERRORS.CASINO_NOT_CONFIGURED)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  // NOVO: Handle new checklist structure (objects with title, description, type, image)
  let stepDescription, stepImage;
  if (typeof casino.checklist[stepIndex] === 'object' && casino.checklist[stepIndex] !== null) {
    // New structure: object with title, description, type, image
    stepDescription = casino.checklist[stepIndex].description;
    stepImage = casino.checklist[stepIndex].image;
  } else {
    // Old structure: just a string
    stepDescription = casino.checklist[stepIndex];
    stepImage = casino.images?.[stepIndex];
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    casino.checklist.length,
    stepDescription,
    stepImage
  );

  // Check if current step requires any input
  const currentStep = casino.checklist[stepIndex];
  let stepTypes = [];
  if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
    stepTypes = currentStep.type;
  }

  // Show different buttons based on step requirements
  let components;
  if (stepTypes.length === 0) {
    // Step has no requirements - show next step button (for info steps)
    components = [ComponentFactory.infoStepButtons()];
  } else {
    // Step has requirements - show next step button
    components = [ComponentFactory.stepButtons()];
  }

  channel.send({
    embeds: [embed],
    components: components
  });
}

function askVipChecklist(channel, ticketState) {
  const vip = VIPS[ticketState.vipType];
  if (!vip || !vip.checklist) {
    return channel.send({
      embeds: [EmbedFactory.error(`VIP type '${ticketState.vipType}' não configurado corretamente`)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  if (stepIndex >= vip.checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success(`Checklist do VIP ${vip.label} completado!`)],
      components: [ComponentFactory.finishButtons()]
    });
  }

  const currentStep = vip.checklist[stepIndex];
  
  // Handle new checklist structure (objects with title, description, type, image)
  let stepDescription, stepImage;
  if (typeof currentStep === 'object' && currentStep !== null) {
    // New structure: object with title, description, type, image
    stepDescription = currentStep.description;
    stepImage = currentStep.image;
  } else {
    // Old structure: just a string
    stepDescription = currentStep;
    stepImage = null;
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    vip.checklist.length,
    stepDescription,
    stepImage
  );

  // Check if current step requires any input
  let stepTypes = [];
  if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
    stepTypes = currentStep.type;
  }

  // Show different buttons based on step requirements
  let components;
  if (stepTypes.length === 0) {
    // Step has no requirements - show next step button (for info steps)
    components = [ComponentFactory.infoStepButtons()];
  } else {
    // Step has requirements - show next step button
    components = [ComponentFactory.stepButtons()];
  }

  channel.send({
    embeds: [embed],
    components: components
  });
}