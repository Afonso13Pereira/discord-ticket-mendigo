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
    // Wrap in try-catch for additional safety
    try {
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
      // Initialize LTC data if not exists
      if (!ticketState.ltcData) ticketState.ltcData = {};
      
      // Check current message for inputs
      if (message.attachments.size > 0) {
        ticketState.ltcData.hasImage = true;
        console.log('[LTC_ONLY][DEBUG] Imagem detectada');
      }
      
      const ltcAddress = message.content.trim();
      console.log('[LTC_ONLY][DEBUG] Conteúdo da mensagem:', ltcAddress);
      console.log('[LTC_ONLY][DEBUG] Tamanho do conteúdo:', ltcAddress.length);
      
      // Melhor validação de endereço LTC
      if (ltcAddress.length >= 25 && (ltcAddress.startsWith('L') || ltcAddress.startsWith('M') || ltcAddress.startsWith('ltc1'))) {
        ticketState.ltcData.hasAddress = true;
        ticketState.ltcAddress = ltcAddress;
        console.log('[LTC_ONLY][DEBUG] LTC address capturado e salvo:', ltcAddress);
      } else if (ltcAddress.length >= 10) {
        // Fallback: qualquer texto com mais de 10 caracteres pode ser um endereço
        ticketState.ltcData.hasAddress = true;
        ticketState.ltcAddress = ltcAddress;
        console.log('[LTC_ONLY][DEBUG] LTC address capturado (fallback):', ltcAddress);
      }
      
      await client.saveTicketState(message.channel.id, ticketState);
      console.log('[LTC_ONLY][DEBUG] Estado salvo, ltcAddress no estado:', ticketState.ltcAddress);
      
      // Verificar se tem ambos
      if (!ticketState.ltcData.hasImage || !ticketState.ltcData.hasAddress) {
        const missing = [];
        if (!ticketState.ltcData.hasImage) missing.push('**imagem do depósito com QR visível**');
        if (!ticketState.ltcData.hasAddress) missing.push('**endereço LTC em texto**');
        
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.VERIFIED_USER_MISSING.replace('{missing}', missing.join(' e ')))]
        });
      }
      
      // Tem ambos - finalizar
      ticketState.awaitLtcOnly = false;
      delete ticketState.ltcData;
      await client.saveTicketState(message.channel.id, ticketState);
      
      // Log LTC address
      await client.db.logAction(message.channel.id, message.author.id, 'ltc_deposit_provided', ltcAddress.substring(0, 10) + '...');
      console.log('[LTC_ONLY] Processo completo, LTC final:', ticketState.ltcAddress);
      
      return message.reply({
        embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.VERIFIED_USER_COMPLETE)],
        components: [ComponentFactory.finishButtons()]
      });
    }

    // Website Twitch Nick Input (pode ser em mensagens separadas)
    if (ticketState.awaitTwitchNick) {
      // Initialize twitch data if not exists
      if (!ticketState.twitchData) ticketState.twitchData = {};
      
      // Check current message for inputs
      if (message.attachments.size > 0) {
        ticketState.twitchData.hasImage = true;
      }
      
      const twitchNick = message.content.trim();
      if (twitchNick && twitchNick.length >= 3) {
        ticketState.twitchData.hasNick = true;
        ticketState.twitchNick = twitchNick;
      }
      
      await client.saveTicketState(message.channel.id, ticketState);
      
      // Se tem ambos, processar
      if (ticketState.twitchData.hasNick && ticketState.twitchData.hasImage) {
        ticketState.awaitTwitchNick = false;
        delete ticketState.twitchData;
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
        
        await ajudasChannel.send({ 
          embeds: [embed],
          components: [components]
        });
      } else {
        console.error('❌ AJUDAS_CHANNEL_ID not found, invalid, or not a text channel');
        console.log('[CHECKLIST][LTC] LTC salvo no estado:', ticketState.ltcAddress);
      }

      return message.reply({
        embeds: [EmbedFactory.success(MESSAGES.QUESTIONS.DESCRIPTION_RECEIVED)]
      });
    }

    // VIP Checklist Validation
    if (ticketState.vipType && ticketState.awaitProof) {
      console.log('🔍 VIP Validation - Step:', ticketState.step, 'VIP Type:', ticketState.vipType);
      
      const vip = VIPS[ticketState.vipType];
      if (!vip || !vip.checklist) {
        return message.reply({
          embeds: [EmbedFactory.error(`VIP type '${ticketState.vipType}' não configurado corretamente`)]
        });
      }

      const stepIndex = ticketState.step;
      const currentStep = vip.checklist[stepIndex];
      console.log('🔍 VIP Step:', currentStep);

      // Check if current step requires any input
      let stepTypes = [];
      if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
        stepTypes = currentStep.type;
      }
      console.log('🔍 VIP Step Types:', stepTypes);

      // If step has no requirements (empty type array), advance automatically
      if (stepTypes.length === 0) {
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      } else {
        // Initialize step data if not exists
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};

        // Check current message for inputs
        if (stepTypes.includes('image') && message.attachments.size > 0) {
          ticketState.stepData[stepIndex].hasImage = true;
        }
        if (stepTypes.includes('text') && message.content && message.content.trim().length >= 5) {
          ticketState.stepData[stepIndex].hasText = true;
          ticketState.stepData[stepIndex].textContent = message.content.trim();
        }

        // Check if all required types are provided
        const allRequirementsMet = stepTypes.every(type => {
          if (type === 'image') return ticketState.stepData[stepIndex].hasImage;
          if (type === 'text') return ticketState.stepData[stepIndex].hasText;
          return false;
        });

        if (allRequirementsMet) {
          // All requirements met, advance to next step
          ticketState.awaitProof = false;
          // Clear step data for this step
          delete ticketState.stepData[stepIndex];
          await client.saveTicketState(message.channel.id, ticketState);
        } else {
          // Still missing requirements, save state and wait for more input
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Show what's still missing
          const missing = [];
          if (stepTypes.includes('image') && !ticketState.stepData[stepIndex].hasImage) missing.push('**imagem**');
          if (stepTypes.includes('text') && !ticketState.stepData[stepIndex].hasText) missing.push('**texto**');
          
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))]
          });
        }
      }

      if (!ticketState.awaitProof) {
        console.log('✅ VIP Step completed, advancing...');
        // Log step completion
        await client.db.logAction(message.channel.id, message.author.id, 'vip_step_completed', `${ticketState.vipType} Step ${stepIndex + 1}`);

        // AUTOMÁTICO: Avançar para próximo passo
        if (stepIndex + 1 < vip.checklist.length) {
          console.log('🔄 VIP Moving to next step:', stepIndex + 1);
          ticketState.step++;
          ticketState.awaitProof = true;
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Mostrar próximo passo automaticamente
          return askVipChecklist(message.channel, ticketState);
        }
        
        // VIP checklist completed
        await client.db.logAction(message.channel.id, message.author.id, 'vip_checklist_completed', `Type: ${ticketState.vipType}, Casino: ${ticketState.vipCasino}`);
        
        return message.reply({
          embeds: [EmbedFactory.success(`Checklist do VIP ${vip.label} completado!`)],
          components: [ComponentFactory.finishButtons()]
        });
      }
    }

    // Telegram Code + Screenshot
    if (ticketState.gwType === 'telegram' && !ticketState.casino) {
      // Initialize telegram data if not exists
      if (!ticketState.telegramData) ticketState.telegramData = {};
      
      // Check current message for inputs
      if (message.attachments.size > 0) {
        ticketState.telegramData.hasImage = true;
      }
      
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
        
        return message.reply({
          embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_MISSING.replace('{missing}', missing.join(' e ')))]
        });
      }

      // Clear telegram data after validation
      delete ticketState.telegramData;

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
        const giveawaysHelpChannel = await message.guild.channels.fetch(CHANNELS.GIVEAWAYSHELP).catch(() => null);
        if (giveawaysHelpChannel && giveawaysHelpChannel.send) {
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
        
                  await giveawaysHelpChannel.send({ 
            embeds: [embed],
            components: [components]
          });
      } else {
        console.error('❌ GIVEAWAYSHELP_CHANNEL_ID not found, invalid, or not a text channel');
      }

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

      // Check if casino is "Todos" or specific || Aqui verifica se receber o nome com ";" se receber com ponto e virugula tem que verificar se o casino existe \
      if (/todos/i.test(logsCasino)) {
        // Casino is "Todos" - user can choose any casino
        await client.saveTicketState(message.channel.id, ticketState);
        
        await message.reply({
          embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.TELEGRAM_CODE_VALIDATED.replace('{casino}', logsCasino))]
        });
        return askCasino(message.channel);
      } else if (logsCasino.includes(';') || logsCasino.includes(',')) {
        // Separar e filtrar casinos válidos (suporta ; e ,)
        const separator = logsCasino.includes(';') ? ';' : ',';
        const allowedCasinoNames = logsCasino.split(separator).map(c => c.trim()).filter(Boolean);
        const allowedCasinos = {};
        for (const name of allowedCasinoNames) {
          const id = Object.keys(CASINOS).find(id => 
            id.toLowerCase() === name.toLowerCase() || 
            CASINOS[id].label.toLowerCase() === name.toLowerCase()
          );
          if (id) allowedCasinos[id] = CASINOS[id];
        }

        if (Object.keys(allowedCasinos).length === 0) {
          return message.reply({
            embeds: [EmbedFactory.error('Nenhum casino válido encontrado na lista.')]
          });
        }

        // Salvar estado aguardando seleção
        ticketState.awaitingCasinoSelection = true;
        ticketState.allowedCasinos = Object.keys(allowedCasinos);
        await client.saveTicketState(message.channel.id, ticketState);

        // Enviar select menu apenas com os casinos permitidos
        return message.reply({
          embeds: [EmbedFactory.casino(
            'Selecione o casino',
            'Escolha o casino para o qual deseja resgatar o prêmio:'
          )],
          components: [ComponentFactory.casinoSelectMenu(allowedCasinos)]
        });
      } else {
        // Casino is specific - find matching casino
        console.log(logsCasino);
        
        const casinoId = findCasinoId(logsCasino);
        console.log(casinoId);
        
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
      const currentStep = casino.checklist[stepIndex];

      // Check if current step requires any input
      let stepTypes = [];
      if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
        stepTypes = currentStep.type;
      }

      // If step has no requirements (empty type array), advance automatically
      if (stepTypes.length === 0) {
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      } else {
        // Initialize step data if not exists
        if (!ticketState.stepData) ticketState.stepData = {};
        if (!ticketState.stepData[stepIndex]) ticketState.stepData[stepIndex] = {};

        // Check current message for inputs
        if (stepTypes.includes('image') && message.attachments.size > 0) {
          ticketState.stepData[stepIndex].hasImage = true;
        }
        if (stepTypes.includes('text') && message.content && message.content.trim().length >= 5) {
          ticketState.stepData[stepIndex].hasText = true;
          ticketState.stepData[stepIndex].textContent = message.content.trim();
        }

        // Check if all required types are provided
        const allRequirementsMet = stepTypes.every(type => {
          if (type === 'image') return ticketState.stepData[stepIndex].hasImage;
          if (type === 'text') return ticketState.stepData[stepIndex].hasText;
          return false;
        });

        if (allRequirementsMet) {
          // All requirements met, advance to next step
          ticketState.awaitProof = false;
          // Clear step data for this step
          delete ticketState.stepData[stepIndex];
          await client.saveTicketState(message.channel.id, ticketState);
        } else {
          // Still missing requirements, save state and wait for more input
          await client.saveTicketState(message.channel.id, ticketState);
          
          // Show what's still missing
          const missing = [];
          if (stepTypes.includes('image') && !ticketState.stepData[stepIndex].hasImage) missing.push('**imagem**');
          if (stepTypes.includes('text') && !ticketState.stepData[stepIndex].hasText) missing.push('**texto**');
          
          return message.reply({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.MISSING_REQUIREMENTS.replace('{missing}', missing.join(' e ')))]
          });
        }
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

        // NOVO: Copiar texto do último passo para ltcAddress, se houver
        const lastStepIndex = casino.checklist.length - 1;
        const lastStep = casino.checklist[lastStepIndex];
        console.log('[CHECKLIST][LTC][DEBUG] Verificando último passo:', lastStepIndex);
        console.log('[CHECKLIST][LTC][DEBUG] stepData disponível:', ticketState.stepData);
        
        if (
          Array.isArray(lastStep.type) &&
          lastStep.type.includes('text') &&
          ticketState.stepData &&
          ticketState.stepData[lastStepIndex] &&
          ticketState.stepData[lastStepIndex].textContent
        ) {
          const ltcFromStep = ticketState.stepData[lastStepIndex].textContent.trim();
          console.log('[CHECKLIST][LTC][DEBUG] Copiando LTC do passo:', ltcFromStep);
          ticketState.ltcAddress = ltcFromStep;
          await client.saveTicketState(message.channel.id, ticketState);
          console.log('[CHECKLIST][LTC][DEBUG] LTC salvo no estado:', ticketState.ltcAddress);
        } else {
          console.log('[CHECKLIST][LTC][DEBUG] Não foi possível copiar LTC do último passo');
          console.log('[CHECKLIST][LTC][DEBUG] lastStep.type:', lastStep.type);
          console.log('[CHECKLIST][LTC][DEBUG] stepData[lastStepIndex]:', ticketState.stepData?.[lastStepIndex]);
        }
        
        // NOVO: Tentar encontrar qualquer texto que possa ser LTC em qualquer passo
        if (!ticketState.ltcAddress && ticketState.stepData) {
          console.log('[CHECKLIST][LTC][DEBUG] Procurando LTC em todos os passos...');
          for (const [stepIdx, stepData] of Object.entries(ticketState.stepData)) {
            if (stepData.textContent && stepData.textContent.trim().length >= 10) {
              const potentialLtc = stepData.textContent.trim();
              console.log('[CHECKLIST][LTC][DEBUG] Encontrado texto no passo', stepIdx, ':', potentialLtc);
              
              // Se parece com endereço LTC, usar
              if (potentialLtc.startsWith('L') || potentialLtc.startsWith('M') || potentialLtc.startsWith('ltc1') || potentialLtc.length >= 25) {
                ticketState.ltcAddress = potentialLtc;
                console.log('[CHECKLIST][LTC][DEBUG] LTC encontrado e salvo:', potentialLtc);
                await client.saveTicketState(message.channel.id, ticketState);
                break;
              }
            }
          }
        }
        return message.reply({
          embeds: [EmbedFactory.success(MESSAGES.CHECKLIST.COMPLETED)],
          components: [ComponentFactory.finishButtons()]
        });
      }
    }
    } catch (error) {
      console.error('🚨 Message handler error:', error);
      // Error will be caught by global error handler
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