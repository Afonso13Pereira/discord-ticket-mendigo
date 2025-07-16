// events/messageCreate.js
require('dotenv').config();
const CASINOS = require('./casinos');
const { promos, refreshExpired, refreshPromotions } = require('../utils/promotions');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');
const MESSAGES = require('../config/messages');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const VIP_CHECKLISTS = {
  semanal: [
    "📱 Envie **print do perfil** com ID visível **e** o **ID em texto**",
    "💰 Envie **prints dos depósitos**",
    "💸 Envie **prints dos levantamentos**",
    "🏦 Envie **prints dos cofres**",
    "📥 Envie **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
  ],
  leaderboard: [
    "📱 Envie **print da conta** com ID visível **e** o **ID em texto**",
    "📥 Envie **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
  ]
};

// Função para verificar se o usuário tem cargo de verificação para um casino
function isUserVerifiedForCasino(member, casino) {
  const casinoData = CASINOS[casino];
  if (!casinoData || !casinoData.cargoafiliado) return false;
  
  return member.roles.cache.has(casinoData.cargoafiliado);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || message.channel.type !== 0) return;
    
    const ticketState = client.ticketStates.get(message.channel.id);
    if (!ticketState) return;

    // 18+ Confirmation
    if (ticketState.awaitConfirm) {
      if (CONFIRM_RX.test(message.content.trim())) {
        ticketState.awaitConfirm = false;
        await client.saveTicketState(message.channel.id, ticketState);

        // Log confirmation
        await client.db.logAction(message.channel.id, message.author.id, 'age_confirmed', null);

        // Create giveaway type buttons
        const typeButtons = ComponentFactory.giveawayTypeButtons();
        const components = [typeButtons];

        await refreshExpired();
        await refreshPromotions();
        
        const promoButtons = ComponentFactory.promoButtons(promos);
        components.push(...promoButtons);

        return message.channel.send({
          embeds: [EmbedFactory.giveaway(
            'Tipo de Giveaway',
            `${EMOJIS.STAR} **Parabéns!** Escolha o tipo de giveaway:\n\n${EMOJIS.GIFT} **Tipos Disponíveis:**\n• Telegram - Prêmios do bot\n• GTB - Giveaway tradicional\n• Promoções especiais em destaque`
          )],
          components: components
        });
      }
      
      return message.reply({
        embeds: [EmbedFactory.error(MESSAGES.CONFIRMATION.INVALID_RESPONSE)]
      });
    }

    // NOVO: LTC + Depósito para usuários verificados (OBRIGATÓRIO)
    if (ticketState.awaitLtcOnly) {
      // Aceitar imagem e texto em mensagens separadas
      if (message.attachments.size > 0) {
        ticketState.step4HasImg = true;
        await client.saveTicketState(message.channel.id, ticketState);
      }
      
      const ltcAddress = message.content.trim();
      if (ltcAddress.length >= 25) {
        ticketState.step4HasAddr = true;
        ticketState.ltcAddress = ltcAddress;
        await client.saveTicketState(message.channel.id, ticketState);
      }
      
      // Verificar se tem ambos
      if (!ticketState.step4HasImg || !ticketState.step4HasAddr) {
        const missing = [];
        if (!ticketState.step4HasImg) missing.push('**imagem do depósito com QR visível**');
        if (!ticketState.step4HasAddr) missing.push('**endereço LTC em texto**');
        
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.VERIFIED_USER_MISSING.replace('{missing}', missing.join(' e ')))]
        });
      }
      
      // Tem ambos - finalizar
      ticketState.awaitLtcOnly = false;
      ticketState.step4HasImg = false;
      ticketState.step4HasAddr = false;
      await client.saveTicketState(message.channel.id, ticketState);
      
      // Log LTC address
      await client.db.logAction(message.channel.id, message.author.id, 'ltc_deposit_provided', ltcAddress.substring(0, 10) + '...');
      
      return message.reply({
        embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.VERIFIED_USER_COMPLETE)],
        components: [ComponentFactory.finishButtons()]
      });
    }

    // Website Twitch Nick Input (pode ser em mensagens separadas)
    if (ticketState.awaitTwitchNick) {
      const hasImage = message.attachments.size > 0;
      const twitchNick = message.content.trim();
      
      // Aceitar imagem ou texto separadamente
      if (hasImage) {
        ticketState.twitchProofImage = true;
        await client.saveTicketState(message.channel.id, ticketState);
        
        if (!ticketState.twitchNick) {
          return message.reply({
            embeds: [EmbedFactory.info(MESSAGES.WEBSITE.NICK_IMAGE_RECEIVED)]
          });
        }
      }
      
      if (twitchNick && twitchNick.length >= 3) {
        ticketState.twitchNick = twitchNick;
        await client.saveTicketState(message.channel.id, ticketState);
        
        if (!ticketState.twitchProofImage) {
          return message.reply({
            embeds: [EmbedFactory.info(MESSAGES.WEBSITE.NICK_TEXT_RECEIVED)]
          });
        }
      }
      
      // Se tem ambos, processar
      if (ticketState.twitchNick && ticketState.twitchProofImage) {
        ticketState.awaitTwitchNick = false;
        await client.saveTicketState(message.channel.id, ticketState);
        
        // Log twitch nick provided
        await client.db.logAction(message.channel.id, message.author.id, 'twitch_nick_provided', ticketState.twitchNick);
        
        // Get user redeems from database
        const redeems = await client.db.getUserRedeems(ticketState.twitchNick);
        
        if (redeems.length === 0) {
          return message.reply({
            embeds: [EmbedFactory.websiteNoRedeems(ticketState.twitchNick)],
            components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())]
          });
        }
        
        // Show available redeems
        const embed = EmbedFactory.websiteRedeemList(ticketState.twitchNick, redeems);
        const components = ComponentFactory.redeemSelectButtons(redeems);
        
        return message.reply({
          embeds: [embed],
          components: [components]
        });
      }
      
      return; // Aguardar mais input
    }

    // Description for Dúvidas, Outros, and Website Bug
    if (ticketState.awaitDescription) {
      if (message.content.trim().length < 10) {
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.QUESTIONS.DESCRIPTION_TOO_SHORT)]
        });
      }

      ticketState.description = message.content.trim();
      ticketState.awaitDescription = false;
      await client.saveTicketState(message.channel.id, ticketState);

      // Log description
      await client.db.logAction(message.channel.id, message.author.id, 'description_provided', ticketState.description.substring(0, 100));

      // Notify staff
      const staffChannel = await message.guild.channels.fetch(CHANNELS.STAFF);
      
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
      
      await staffChannel.send({ 
        embeds: [embed],
        components: [components]
      });

      return message.reply({
        embeds: [EmbedFactory.success(MESSAGES.QUESTIONS.DESCRIPTION_RECEIVED)]
      });
    }

    // VIP Checklist Validation
    if (ticketState.vipType && ticketState.awaitProof) {
      const checklist = VIP_CHECKLISTS[ticketState.vipType];
      const stepIndex = ticketState.step;

      // Handle combined steps (image + text)
      if (stepIndex === 0 || (ticketState.vipType === 'semanal' && stepIndex === 4) || (ticketState.vipType === 'leaderboard' && stepIndex === 1)) {
        // These steps require both image and text
        if (message.attachments.size > 0) {
          ticketState.step4HasImg = true;
        }
        if (message.content && message.content.trim().length >= 5) {
          ticketState.step4HasAddr = true;
          if (stepIndex === 0) {
            ticketState.vipId = message.content.trim();
          } else {
            ticketState.ltcAddress = message.content.trim();
          }
        }
        
        await client.saveTicketState(message.channel.id, ticketState);
        
        if (!ticketState.step4HasImg || !ticketState.step4HasAddr) {
          const missing = [];
          if (!ticketState.step4HasImg) missing.push('**imagem**');
          if (!ticketState.step4HasAddr) missing.push(stepIndex === 0 ? '**ID em texto**' : '**endereço LTC em texto**');
          
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))]
          });
        }
        
        // Reset flags for next step
        ticketState.step4HasImg = false;
        ticketState.step4HasAddr = false;
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      } else {
        // Other steps require only images
        if (message.attachments.size === 0) {
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.IMAGE_REQUIRED)]
          });
        }
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      }

      // Log step completion
      await client.db.logAction(message.channel.id, message.author.id, 'vip_step_completed', `${ticketState.vipType} Step ${stepIndex + 1}`);

      // AUTOMÁTICO: Avançar para próximo passo
      if (stepIndex + 1 < checklist.length) {
        ticketState.step++;
        ticketState.awaitProof = true;
        await client.saveTicketState(message.channel.id, ticketState);
        
        // Mostrar próximo passo automaticamente
        return askVipChecklist(message.channel, ticketState);
      }
      
      // VIP checklist completed
      await client.db.logAction(message.channel.id, message.author.id, 'vip_checklist_completed', `Type: ${ticketState.vipType}, Casino: ${ticketState.vipCasino}`);
      
      return message.reply({
        embeds: [EmbedFactory.success(MESSAGES.VIP.COMPLETED)],
        components: [ComponentFactory.finishButtons()]
      });
    }

    // Telegram Code + Screenshot
    if (ticketState.gwType === 'telegram' && !ticketState.casino) {
      if (message.attachments.size > 0) {
        ticketState.telegramHasImg = true;
        await client.saveTicketState(message.channel.id, ticketState);
      }
      
      const codeMatch = message.content.match(/[a-f0-9]{8}/i);
      if (codeMatch) {
        ticketState.telegramCode = codeMatch[0].toLowerCase();
        await client.saveTicketState(message.channel.id, ticketState);
      }

      if (!ticketState.telegramCode || !ticketState.telegramHasImg) {
        const missing = [];
        if (!ticketState.telegramCode) missing.push('**código**');
        if (!ticketState.telegramHasImg) missing.push('**screenshot**');
        
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_MISSING.replace('{missing}', missing.join(' e ')))]
        });
      }

      // NOVO: Verificar se o código já foi usado
      const existingCode = await client.db.checkTelegramCode(ticketState.telegramCode);
      if (existingCode) {
        // Código já foi usado - marcar como tentativa duplicada
        await client.db.markCodeAsDuplicateAttempt(
          ticketState.telegramCode,
          message.channel.id,
          message.author.id,
          message.author.tag
        );

        // NOVO: Pausar AMBOS os tickets para revisão
        const originalTicketChannel = await message.guild.channels.fetch(existingCode.ticketChannelId).catch(() => null);
        
        // Pausar ticket original se ainda existir
        if (originalTicketChannel) {
          const originalTicketState = client.ticketStates.get(existingCode.ticketChannelId);
          if (originalTicketState) {
            originalTicketState.awaitingSupport = true;
            await client.saveTicketState(existingCode.ticketChannelId, originalTicketState);
            
            await originalTicketChannel.send({
              embeds: [EmbedFactory.warning([
                '⚠️ **Ticket pausado para revisão**',
                '',
                `O código \`${ticketState.telegramCode}\` foi usado novamente em outro ticket.`,
                '',
                '🛡️ **Suporte humano foi notificado**',
                'Aguarde enquanto a nossa equipa verifica a situação.'
              ].join('\n'))],
              components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())]
            });
          }
        }
        // Alertar suporte humano
        const staffChannel = await message.guild.channels.fetch(CHANNELS.STAFF);
        const embed = EmbedFactory.warning([
          `**🚨 CÓDIGO TELEGRAM DUPLICADO DETECTADO**`,
          '',
          `🔴 **Código:** \`${ticketState.telegramCode}\``,
          '',
          `📋 **Uso Original:**`,
          `• Ticket: #${existingCode.ticketNumber}`,
          `• Usuário: ${existingCode.userTag}`,
          `• Casino: ${existingCode.casino || 'N/A'}`,
          `• Data: ${new Date(existingCode.usedAt).toLocaleString('pt-PT')}`,
          '',
          `🆕 **Tentativa Atual:**`,
          `• Ticket: #${ticketState.ticketNumber}`,
          `• Usuário: ${message.author.tag}`,
          `• Canal: ${message.channel}`,
          '',
          `⚠️ **AMBOS os tickets foram pausados para revisão manual**`
        ].join('\n'), 'Código Telegram Duplicado');
        
        // NOVO: Criar botões para ir aos dois tickets
        const buttons = [];
        
        // Botão para ticket original (se ainda existir)
        if (originalTicketChannel) {
          buttons.push(
            ComponentFactory.createLinkButton(
              `https://discord.com/channels/${message.guild.id}/${existingCode.ticketChannelId}`,
              `Ticket Original #${existingCode.ticketNumber}`,
              '📋'
            )
          );
        }
        
        // Botão para ticket atual
        buttons.push(
          ComponentFactory.createLinkButton(
            `https://discord.com/channels/${message.guild.id}/${message.channel.id}`,
            `Ticket Atual #${ticketState.ticketNumber}`,
            '🆕'
          )
        );
        
        // Botão para marcar como resolvido
        buttons.push(
          ComponentFactory.createButton(`duplicate_resolved_${message.channel.id}_${existingCode.ticketChannelId}`, 'Marcar como Resolvido', 'Success', '✅')
        );
        
        const components = ComponentFactory.createButtonRow(...buttons);
        
        await staffChannel.send({ 
          embeds: [embed],
          components: [components]
        });

        // Log da tentativa duplicada
        await client.db.logAction(message.channel.id, message.author.id, 'duplicate_telegram_code', `Code: ${ticketState.telegramCode}, Original ticket: #${existingCode.ticketNumber}`);

        // NOVO: Pausar ticket atual
        ticketState.awaitingSupport = true;
        await client.saveTicketState(message.channel.id, ticketState);

        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.DUPLICATE_CODE_DESCRIPTION
            .replace('{originalTicket}', existingCode.ticketNumber)
            .replace('{originalUser}', existingCode.userTag))],
          components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())]
        });
      }

      // Validate code in logs
      const logsChannel = await message.guild.channels.fetch(CHANNELS.LOGS);
      const messages = await logsChannel.messages.fetch({ limit: 100 });
      const codeMessage = messages.find(m => m.content.toLowerCase().includes(ticketState.telegramCode));
      
      if (!codeMessage) {
        // Salvar código como usado mesmo se não encontrado nos logs (para controle)
        await client.db.saveTelegramCode(
          ticketState.telegramCode,
          message.channel.id,
          ticketState.ticketNumber,
          message.author.id,
          message.author.tag
        );
        
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_NOT_FOUND)]
        });
      }

      if (Date.now() - codeMessage.createdTimestamp > 48 * 60 * 60 * 1000) {
        // Salvar código como usado mesmo se expirado (para controle)
        await client.db.saveTelegramCode(
          ticketState.telegramCode,
          message.channel.id,
          ticketState.ticketNumber,
          message.author.id,
          message.author.tag
        );
        
        return message.reply({
          embeds: [EmbedFactory.warning(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_EXPIRED)]
        });
      }

      // Extract prize from logs
      const prizeMatch = codeMessage.content.match(/prenda\s*:\s*(\d+)/i);
      if (prizeMatch) ticketState.prize = prizeMatch[1];

      // Extract casino from logs
      const casinoMatch = codeMessage.content.match(/casino\s*:\s*([^\n\r]+)/i);
      let logsCasino = casinoMatch ? casinoMatch[1].trim() : 'RioAce'; // default fallback

      // NOVO: Salvar código como usado com sucesso
      await client.db.saveTelegramCode(
        ticketState.telegramCode,
        message.channel.id,
        ticketState.ticketNumber,
        message.author.id,
        message.author.tag,
        logsCasino,
        ticketState.prize
      );

      // Check if casino is "Todos" or specific
      if (/todos/i.test(logsCasino)) {
        // Casino is "Todos" - user can choose any casino
        await client.saveTicketState(message.channel.id, ticketState);
        
        await message.reply({
          embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_VALIDATED.replace('{casino}', logsCasino))]
        });
        return askCasino(message.channel);
      } else {
        // Casino is specific - find matching casino
        const casinoId = findCasinoId(logsCasino);
        if (!casinoId) {
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.CASINO_NOT_CONFIGURED.replace('{casino}', logsCasino))]
          });
        }

        ticketState.casino = casinoId;
        
        // NOVO: Verificar se o usuário tem cargo de verificação para este casino
        const member = await message.guild.members.fetch(message.author.id);
        const isVerified = isUserVerifiedForCasino(member, casinoId);
        
        if (isVerified && ticketState.isVerified) {
          // Usuário verificado - pular checklist mas SEMPRE pedir depósito + LTC
          ticketState.awaitProof = false;
          ticketState.awaitLtcOnly = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          await message.reply({
            embeds: [EmbedFactory.success(`${MESSAGES.GIVEAWAYS.TELEGRAM_CODE_SPECIFIC_CASINO.replace('{casino}', casinoId)}\n\n${MESSAGES.GIVEAWAYS.VERIFIED_USER_SKIP}`)],
            components: [ComponentFactory.finishButtons()]
          });
        } else {
          // Usuário não verificado - processo normal
          ticketState.step = 0;
          ticketState.awaitProof = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          await message.reply({
            embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_SPECIFIC_CASINO.replace('{casino}', casinoId))]
          });
          return askChecklist(message.channel, ticketState);
        }
      }
    }

    // Checklist Validation
    if (ticketState.casino && ticketState.awaitProof && !ticketState.vipType) {
      const casino = CASINOS[ticketState.casino];
      const stepIndex = ticketState.step;

      // NOVO: Para BCGame no primeiro passo, aceitar ID em texto
      if (ticketState.casino === 'BCGame' && stepIndex === 0) {
        if (message.attachments.size > 0) {
          ticketState.step4HasImg = true;
        }
        if (message.content && message.content.trim().length >= 5) {
          ticketState.step4HasAddr = true;
          ticketState.bcGameId = message.content.trim();
        }
        
        await client.saveTicketState(message.channel.id, ticketState);
        
        if (!ticketState.step4HasImg || !ticketState.step4HasAddr) {
          const missing = [];
          if (!ticketState.step4HasImg) missing.push(MESSAGES.CHECKLIST.BCGAME_MISSING_EMAIL);
          if (!ticketState.step4HasAddr) missing.push(MESSAGES.CHECKLIST.BCGAME_MISSING_ID);
          
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))]
          });
        }
        
        // Reset flags
        ticketState.step4HasImg = false;
        ticketState.step4HasAddr = false;
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      } else if (stepIndex < 3) {
        if (message.attachments.size === 0) {
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.IMAGE_REQUIRED)]
          });
        }
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      } else if (stepIndex === 3) {
        if (message.attachments.size > 0) {
          ticketState.step4HasImg = true;
        }
        if (message.content && message.content.length >= 25) {
          ticketState.step4HasAddr = true;
          ticketState.ltcAddress = message.content;
        }
        
        await client.saveTicketState(message.channel.id, ticketState);
        
        if (!ticketState.step4HasImg || !ticketState.step4HasAddr) {
          const missing = [];
          if (!ticketState.step4HasImg) missing.push(MESSAGES.CHECKLIST.DEPOSIT_MISSING_IMAGE);
          if (!ticketState.step4HasAddr) missing.push(MESSAGES.CHECKLIST.DEPOSIT_MISSING_ADDRESS);
          
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))]
          });
        }
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      }

      if (!ticketState.awaitProof) {
        // Log step completion
        await client.db.logAction(message.channel.id, message.author.id, 'step_completed', `Step ${stepIndex + 1}`);

        // AUTOMÁTICO: Avançar para próximo passo
        if (stepIndex + 1 < casino.checklist.length) {
          ticketState.step++;
          ticketState.awaitProof = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Mostrar próximo passo automaticamente
          return askChecklist(message.channel, ticketState);
        }
        
        // Log checklist completion
        await client.db.logAction(message.channel.id, message.author.id, 'checklist_completed', `Casino: ${ticketState.casino}`);
        
        return message.reply({
          embeds: [EmbedFactory.success(MESSAGES.CHECKLIST.COMPLETED)],
          components: [ComponentFactory.finishButtons()]
        });
      }
    }
  }
};

// Helper Functions
function findCasinoId(name) {
  return Object.keys(CASINOS).find(id => 
    id.toLowerCase() === name.toLowerCase() || 
    CASINOS[id].label.toLowerCase() === name.toLowerCase()
  ) || null;
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
  
  // NOVO: Para BCGame, modificar o primeiro passo para incluir ID
  let checklist = [...casino.checklist];
  if (ticketState.casino === 'BCGame' && stepIndex === 0) {
    checklist[0] = MESSAGES.CHECKLIST.BCGAME_STEP1;
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    checklist.length,
    checklist[stepIndex],
    casino.images?.[stepIndex]
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.stepButtons()]
  });
}

function askVipChecklist(channel, ticketState) {
  const checklist = VIP_CHECKLISTS[ticketState.vipType];
  if (!checklist) {
    return channel.send({
      embeds: [EmbedFactory.error(MESSAGES.VIP.TYPE_NOT_CONFIGURED)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  if (stepIndex >= checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success(MESSAGES.VIP.COMPLETED)],
      components: [ComponentFactory.finishButtons()]
    });
  }

  const embed = EmbedFactory.vipChecklist(
    stepIndex + 1,
    checklist.length,
    checklist[stepIndex],
    ticketState.vipType
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.stepButtons()]
  });
}