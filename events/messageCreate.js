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

      // Verificar se o ticket está pausado para suporte
      if (ticketState.awaitingSupport) {
        return message.reply({ 
          embeds: [EmbedFactory.error('⏳ **Ticket pausado para revisão**\n\nAguarde enquanto o suporte analisa a situação.')] 
        });
      }

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
          return askCasino(message.channel, ticketState);
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

      // --- STEP EXTRA PARA GTB ---
      if (ticketState.awaitGtbExtra) {
        const casino = CASINOS[ticketState.casino];
        const stepIndex = casino.checklist.length; // Step extra
        
        // Inicializar stepData se não existir
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};
        
        // Processar imagem se for anexada
        if (message.attachments.size > 0) {
          const attachment = message.attachments.first();
          if (attachment.contentType && attachment.contentType.startsWith('image/')) {
            ticketState.stepData[stepIndex].hasImage = true;
            ticketState.stepData[stepIndex].imageUrl = attachment.url;
            console.log(`[GTB][STEP_EXTRA] Imagem recebida: ${attachment.url}`);
          }
        }
        
        // Processar texto se for username
        if (message.content.trim().length > 0) {
          ticketState.stepData[stepIndex].textContent = message.content.trim();
          ticketState.stepData[stepIndex].hasText = true;
          console.log(`[GTB][STEP_EXTRA] Username recebido: ${message.content.trim()}`);
        }
        
        // Verificar se tem ambos (username e print)
        if (ticketState.stepData[stepIndex].hasText && ticketState.stepData[stepIndex].hasImage) {
          // Step extra completo
          ticketState.awaitGtbExtra = false;
          ticketState.awaitProof = false;
          await client.saveTicketState(message.channel.id, ticketState);
          
          return message.reply({
            embeds: [EmbedFactory.success('✅ Step extra GTB completo! Agora pode finalizar o ticket.')],
            components: [ComponentFactory.finishButtons()]
          });
        } else {
          // Ainda falta algo
          const missing = [];
          if (!ticketState.stepData[stepIndex].hasText) missing.push('**username**');
          if (!ticketState.stepData[stepIndex].hasImage) missing.push('**print**');
          
          await client.saveTicketState(message.channel.id, ticketState);
          return message.reply({
            embeds: [EmbedFactory.info(`📝 Ainda falta: ${missing.join(' e ')}`)],
            flags: 64
          });
        }
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

        // Verificar se o código já foi usado
        const existingCode = await client.db.checkTelegramCode(ticketState.telegramCode);
        if (existingCode && existingCode.ticketChannelId !== message.channel.id) {
          // Código duplicado detectado
          console.log(`🚨 Código duplicado detectado: ${ticketState.telegramCode}`);
          
          // Pausar o ticket atual
          ticketState.awaitingSupport = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Pausar o ticket original
          const originalTicketState = client.ticketStates.get(existingCode.ticketChannelId);
          if (originalTicketState) {
            originalTicketState.awaitingSupport = true;
            await client.saveTicketState(existingCode.ticketChannelId, originalTicketState);
          }

          // Notificar o ticket atual
          await message.reply({ 
            embeds: [EmbedFactory.error('O código já foi usado, aguarde o suporte')] 
          });

          // Notificar o ticket original
          const originalChannel = await client.channels.fetch(existingCode.ticketChannelId).catch(() => null);
          if (originalChannel) {
            await originalChannel.send({
              embeds: [EmbedFactory.error('🚨 **Código duplicado detectado**\n\nO seu código foi usado em outro ticket. Aguarde o suporte.')]
            });
          }

          // Enviar alerta para o canal GIVEAWAYSHELP
          const giveawaysHelpChannel = await client.channels.fetch(CHANNELS.GIVEAWAYSHELP);
          if (giveawaysHelpChannel) {
            // Debug: Log dos dados do código existente
            console.log('🔍 Dados do código existente:', {
              code: existingCode.code,
              ticketNumber: existingCode.ticketNumber,
              userTag: existingCode.userTag,
              casino: existingCode.casino,
              prize: existingCode.prize,
              usedAt: existingCode.usedAt
            });
            
            const embed = EmbedFactory.duplicateCodeAlert(
              ticketState.telegramCode,
              existingCode.ticketNumber,
              existingCode.userTag,
              existingCode.casino,
              existingCode.usedAt ? new Date(existingCode.usedAt).toLocaleString('pt-BR') : 'Data não disponível',
              ticketState.ticketNumber,
              ticketState.ownerTag,
              message.channel.id
            );
            
            const components = ComponentFactory.duplicateCodeButtons(
              existingCode.ticketChannelId,
              message.channel.id,
              ticketState.telegramCode
            );
            
            await giveawaysHelpChannel.send({
              embeds: [embed],
              components: components
            });
          }

          return;
        }
        // Buscar dados do giveaway no canal de logs
        const LOGS_CHANNEL_ID = process.env.LOGS_CHANNEL_ID;
        if (!LOGS_CHANNEL_ID) {
          return message.reply({ embeds: [EmbedFactory.error('Canal de logs não configurado.')] });
        }
        try {
          const logChannel = await client.channels.fetch(LOGS_CHANNEL_ID);
          if (!logChannel) throw new Error('Canal de logs não encontrado');
          const messages = await logChannel.messages.fetch({ limit: 100 });
          let found = false;
          for (const msg of messages.values()) {
            // Exemplo: parsing de embed
            if (msg.embeds.length > 0) {
              const embed = msg.embeds[0];
              const codeField = embed.fields?.find(f => f.value && f.value.toLowerCase().includes(ticketState.telegramCode));
              if (codeField) {
                // Extrair dados do embed
                const casino = embed.fields?.find(f => f.name.toLowerCase().includes('casino'))?.value;
                const premio = embed.fields?.find(f => f.name.toLowerCase().includes('prendas'))?.value;
                ticketState.casino = casino ? casino.trim() : null;
                ticketState.prize = premio ? premio.trim() : null;
                found = true;
                break;
              }
            } else if (msg.content && msg.content.toLowerCase().includes(ticketState.telegramCode)) {
              // Exemplo: parsing de texto puro
              const casinoMatch = msg.content.match(/Casino:\s*(.+)/i);
              const premioMatch = msg.content.match(/Prendas:\s*(\d+)/i);
              ticketState.casino = casinoMatch?.[1]?.trim() || null;
              ticketState.prize = premioMatch?.[1]?.trim() || null;
              found = true;
              break;
            }
          }
          if (!found) {
            return message.reply({ embeds: [EmbedFactory.error('Não foi possível encontrar os dados deste giveaway no canal de logs.')] });
          }
          
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Salvar o código do Telegram no banco de dados APÓS extrair os dados
          console.log('💾 Salvando código do Telegram:', {
            code: ticketState.telegramCode,
            ticketNumber: ticketState.ticketNumber,
            userTag: message.author.tag,
            casino: ticketState.casino,
            prize: ticketState.prize
          });
          
          await client.db.saveTelegramCode(
            ticketState.telegramCode,
            message.channel.id,
            ticketState.ticketNumber,
            message.author.id,
            message.author.tag,
            ticketState.casino,
            ticketState.prize
          );
          
          // Prosseguir para o fluxo normal após preencher casino/prize
          return askCasino(message.channel, ticketState);
        } catch (err) {
          console.error('Erro ao buscar dados do giveaway no canal de logs:', err);
          return message.reply({ embeds: [EmbedFactory.error('Erro ao buscar dados do giveaway no canal de logs.')] });
        }
      }

      // --- CHECKLIST DOS CASINOS ---
      if (!ticketState.vipType && ticketState.awaitProof) {
        const casino = CASINOS[ticketState.casino];
        if (!casino || !casino.checklist) return;
        const stepIndex = ticketState.step ?? 0;
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};
        const stepTypes = Array.isArray(casino.checklist[stepIndex]?.type) ? casino.checklist[stepIndex].type : [];
        if (stepTypes.includes('image') && message.attachments.size > 0) {
          ticketState.stepData[stepIndex].hasImage = true;
          if (ticketState.casino === 'BCGame' && stepIndex === 1) {
            const attachment = message.attachments.first();
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
              ticketState.bcGameProfileImage = attachment.url;
              await client.saveTicketState(message.channel.id, ticketState);
            }
          }
        }
        if (stepTypes.includes('text') && message.content && message.content.trim().length >= 5) {
          ticketState.stepData[stepIndex].hasText = true;
          ticketState.stepData[stepIndex].textContent = message.content.trim();
          const textContent = message.content.trim();
          if (textContent.length >= 25 && (textContent.startsWith('L') || textContent.startsWith('M') || textContent.startsWith('ltc1'))) {
            ticketState.ltcAddress = textContent;
            await client.saveTicketState(message.channel.id, ticketState);
          } else if (textContent.length >= 10 && !ticketState.ltcAddress) {
            ticketState.ltcAddress = textContent;
            await client.saveTicketState(message.channel.id, ticketState);
          }
          if (ticketState.casino === 'BCGame' && !ticketState.bcGameId) {
            if (/^\d+$/.test(textContent) && textContent.length >= 5 && textContent.length <= 15) {
              if (textContent !== ticketState.ticketNumber?.toString()) {
                ticketState.bcGameId = textContent;
                await client.saveTicketState(message.channel.id, ticketState);
              }
            }
            const idMatch = textContent.match(/(?:bcgame\s*id|id)\s*:?\s*(\d{5,15})/i);
            if (idMatch && !ticketState.bcGameId) {
              const extractedId = idMatch[1];
              if (extractedId !== ticketState.ticketNumber?.toString()) {
                ticketState.bcGameId = extractedId;
                await client.saveTicketState(message.channel.id, ticketState);
              }
            }
          }
        }
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
          
          // NOVO: Step extra para GTB
          if (ticketState.gwType === 'gtb') {
            ticketState.step = casino.checklist.length; // Step extra após o checklist
            ticketState.awaitGtbExtra = true;
            await client.saveTicketState(message.channel.id, ticketState);
            
            return message.reply({
              embeds: [EmbedFactory.info(
                '🎯 **Step Extra GTB**\n\n' +
                'Para finalizar o ticket GTB, forneça:\n' +
                '• **Username** em texto\n' +
                '• **Print** da stream/ganho'
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

function askCasino(channel, ticketState = null) {
  let casinosToShow = CASINOS;
  let description = MESSAGES.GIVEAWAYS.CASINO_SELECTION_ALL;

  if (ticketState && ticketState.casino && ticketState.casino.toLowerCase() !== 'todos') {
    // Suporta múltiplos casinos separados por vírgula ou ponto e vírgula
    const raw = ticketState.casino;
    const sep = raw.includes(';') ? ';' : ',';
    const casinoNames = raw.split(sep).map(c => c.trim().toLowerCase());
    casinosToShow = Object.fromEntries(
      Object.entries(CASINOS).filter(([id, c]) =>
        casinoNames.includes(id.toLowerCase()) || casinoNames.includes(c.label.toLowerCase())
      )
    );
    description = `⭐ **Podes escolher apenas entre:** ${Object.values(casinosToShow).map(c => c.label).join(', ')}`;
  }

  channel.send({
    embeds: [EmbedFactory.casino(
      MESSAGES.GIVEAWAYS.CASINO_SELECTION_TITLE,
      description
    )],
    components: [ComponentFactory.casinoSelectMenu(casinosToShow)]
  });
}

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  if (!casino || !casino.checklist) {
    return channel.send({
      embeds: [EmbedFactory.error(`Casino '${ticketState.casino}' não configurado corretamente`)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  // NOVO: Verificar se é o step extra de GTB
  if (ticketState.gwType === 'gtb' && stepIndex >= casino.checklist.length) {
    // Step extra de GTB - pedir username + print
    const embed = EmbedFactory.checklist(
      stepIndex + 1,
      casino.checklist.length + 1, // +1 para incluir o step extra
      '🎯 **Step Extra GTB**\n\nPara finalizar o ticket GTB, forneça:\n• **Username** em texto\n• **Print** da stream/ganho',
      null // Sem imagem para este step
    );
    
    return channel.send({
      embeds: [embed],
      components: [ComponentFactory.stepButtons()]
    });
  }
  
  // NOVO: Verificar se é o step extra de giveaway "outro"
  if (ticketState.gwType === 'other' && stepIndex >= casino.checklist.length) {
    // Step extra de giveaway "outro" - pedir descrição
    const embed = EmbedFactory.checklist(
      stepIndex + 1,
      casino.checklist.length + 1, // +1 para incluir o step extra
      '🎁 **Step Extra Giveaway**\n\nPara finalizar o ticket, explique qual giveaway ganhou:',
      null // Sem imagem para este step
    );
    
    return channel.send({
      embeds: [embed],
      components: [ComponentFactory.stepButtons()]
    });
  }
  
  if (stepIndex >= casino.checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success(MESSAGES.CHECKLIST.COMPLETED)],
      components: [ComponentFactory.finishButtons()]
    });
  }

  const currentStep = casino.checklist[stepIndex];
  
  // Handle new checklist structure (objects with title, description, type, image)
  let stepDescription, stepImage;
  if (typeof currentStep === 'object' && currentStep !== null) {
    stepDescription = currentStep.description;
    stepImage = casino.images?.[stepIndex];
  } else {
    // Old structure: just a string
    stepDescription = currentStep;
    stepImage = casino.images?.[stepIndex];
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    casino.checklist.length + (ticketState.gwType === 'gtb' || ticketState.gwType === 'other' ? 1 : 0), // +1 se tiver step extra
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