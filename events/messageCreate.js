// events/messageCreate.js
require('dotenv').config();
const CASINOS = require('./casinos');
const { promos, refreshExpired, refreshPromotions } = require('../utils/promotions');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');

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

        // CORREÇÃO: Add promo buttons - refresh promotions first
        await refreshExpired();
        await refreshPromotions(); // CORREÇÃO: Refresh promotions from database
        
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
        embeds: [EmbedFactory.error('Digite exatamente **"Sim, eu confirmo"** para prosseguir')]
      });
    }

    // Website Twitch Nick Input
    if (ticketState.awaitTwitchNick) {
      const hasImage = message.attachments.size > 0;
      const twitchNick = message.content.trim();
      
      if (!hasImage || !twitchNick || twitchNick.length < 3) {
        return message.reply({
          embeds: [EmbedFactory.error('Por favor, envie o **nickname da Twitch** e uma **captura de ecrã** como prova')]
        });
      }
      
      ticketState.twitchNick = twitchNick;
      ticketState.awaitTwitchNick = false;
      await client.saveTicketState(message.channel.id, ticketState);
      
      // Log twitch nick provided
      await client.db.logAction(message.channel.id, message.author.id, 'twitch_nick_provided', twitchNick);
      
      // Get user redeems from database
      const redeems = await client.db.getUserRedeems(twitchNick);
      
      if (redeems.length === 0) {
        return message.reply({
          embeds: [EmbedFactory.websiteNoRedeems(twitchNick)],
          components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton())]
        });
      }
      
      // Show available redeems
      const embed = EmbedFactory.websiteRedeemList(twitchNick, redeems);
      const components = ComponentFactory.redeemSelectButtons(redeems);
      
      return message.reply({
        embeds: [embed],
        components: [components]
      });
    }

    // Description for Dúvidas, Outros, and Website Bug
    if (ticketState.awaitDescription) {
      if (message.content.trim().length < 10) {
        return message.reply({
          embeds: [EmbedFactory.error('Por favor, forneça uma descrição mais detalhada (mínimo 10 caracteres)')]
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
        notificationText = `**Novo bug reportado no website**\n\n` +
          `🎫 **Ticket:** #${ticketState.ticketNumber}\n` +
          `👤 **Usuário:** ${ticketState.ownerTag}\n` +
          `🐛 **Tipo:** Bug Report\n` +
          `📝 **Descrição:** ${ticketState.description}\n\n` +
          `📍 **Canal:** ${message.channel}`;
      } else {
        notificationText = `**Novo ticket de ${ticketState.category}**\n\n` +
          `🎫 **Ticket:** #${ticketState.ticketNumber}\n` +
          `👤 **Usuário:** ${ticketState.ownerTag}\n` +
          `📂 **Categoria:** ${ticketState.category}\n` +
          `📝 **Descrição:** ${ticketState.description}\n\n` +
          `📍 **Canal:** ${message.channel}`;
      }
      
      const embed = EmbedFactory.warning(notificationText);
      await staffChannel.send({ embeds: [embed] });

      return message.reply({
        embeds: [EmbedFactory.success('Descrição recebida! A nossa equipa foi notificada e irá ajudá-lo em breve.')]
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
            embeds: [EmbedFactory.error(`Ainda falta: ${missing.join(' e ')}`)]
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
            embeds: [EmbedFactory.error('Este passo requer o envio de uma **imagem**')]
          });
        }
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      }

      // Log step completion
      await client.db.logAction(message.channel.id, message.author.id, 'vip_step_completed', `${ticketState.vipType} Step ${stepIndex + 1}`);

      if (stepIndex + 1 < checklist.length) {
        return message.reply({
          embeds: [EmbedFactory.success('Prova recebida! Clique em **Próximo Passo** para continuar.')],
          components: [ComponentFactory.stepButtons()] // CORREÇÃO: Usar stepButtons() que inclui suporte
        });
      }
      
      // VIP checklist completed
      await client.db.logAction(message.channel.id, message.author.id, 'vip_checklist_completed', `Type: ${ticketState.vipType}, Casino: ${ticketState.vipCasino}`);
      
      return message.reply({
        embeds: [EmbedFactory.success('Checklist VIP concluído com sucesso! Clique em **Finalizar** para completar.')],
        components: [ComponentFactory.finishButtons()] // CORREÇÃO: Usar finishButtons() que inclui suporte
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
          embeds: [EmbedFactory.error(`Ainda falta: ${missing.join(' e ')}`)]
        });
      }

      // Validate code in logs
      const logsChannel = await message.guild.channels.fetch(CHANNELS.LOGS);
      const messages = await logsChannel.messages.fetch({ limit: 100 });
      const codeMessage = messages.find(m => m.content.toLowerCase().includes(ticketState.telegramCode));
      
      if (!codeMessage) {
        return message.reply({
          embeds: [EmbedFactory.error('Código não encontrado nos logs do sistema')]
        });
      }

      if (Date.now() - codeMessage.createdTimestamp > 48 * 60 * 60 * 1000) {
        return message.reply({
          embeds: [EmbedFactory.warning('Código tem mais de 48 horas. Aguarde verificação manual')]
        });
      }

      // Extract prize from logs
      const prizeMatch = codeMessage.content.match(/prenda\s*:\s*(\d+)/i);
      if (prizeMatch) ticketState.prize = prizeMatch[1];

      // Extract casino from logs
      const casinoMatch = codeMessage.content.match(/casino\s*:\s*([^\n\r]+)/i);
      let logsCasino = casinoMatch ? casinoMatch[1].trim() : 'RioAce'; // default fallback

      // Check if casino is "Todos" or specific
      if (/todos/i.test(logsCasino)) {
        // Casino is "Todos" - user can choose any casino
        ticketState.step = 0;
        ticketState.awaitProof = true;
        await client.saveTicketState(message.channel.id, ticketState);
        
        await message.reply({
          embeds: [EmbedFactory.success(`Código validado! Casino nas logs: **${logsCasino}** - Você pode escolher qualquer casino.`)]
        });
        return askCasino(message.channel);
      } else {
        // Casino is specific - find matching casino
        const casinoId = findCasinoId(logsCasino);
        if (!casinoId) {
          return message.reply({
            embeds: [EmbedFactory.error(`Casino **${logsCasino}** das logs não está configurado no sistema`)]
          });
        }

        ticketState.casino = casinoId;
        ticketState.step = 0;
        ticketState.awaitProof = true;
        await client.saveTicketState(message.channel.id, ticketState);
        
        await message.reply({
          embeds: [EmbedFactory.success(`Código validado! Casino obrigatório: **${casinoId}**`)]
        });
        return askChecklist(message.channel, ticketState);
      }
    }

    // Checklist Validation
    if (ticketState.casino && ticketState.awaitProof && !ticketState.vipType) {
      const casino = CASINOS[ticketState.casino];
      const stepIndex = ticketState.step;

      if (stepIndex < 3) {
        if (message.attachments.size === 0) {
          return message.reply({
            embeds: [EmbedFactory.error('Este passo requer o envio de uma **imagem**')]
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
          if (!ticketState.step4HasImg) missing.push('**imagem do depósito**');
          if (!ticketState.step4HasAddr) missing.push('**endereço LTC em texto**');
          
          return message.reply({
            embeds: [EmbedFactory.error(`Ainda falta: ${missing.join(' e ')}`)]
          });
        }
        ticketState.awaitProof = false;
        await client.saveTicketState(message.channel.id, ticketState);
      }

      if (!ticketState.awaitProof) {
        // Log step completion
        await client.db.logAction(message.channel.id, message.author.id, 'step_completed', `Step ${stepIndex + 1}`);

        if (stepIndex + 1 < casino.checklist.length) {
          return message.reply({
            embeds: [EmbedFactory.success('Prova recebida! Clique em **Próximo Passo** para continuar.')],
            components: [ComponentFactory.stepButtons()] // CORREÇÃO: Usar stepButtons() que inclui suporte
          });
        }
        
        // Log checklist completion
        await client.db.logAction(message.channel.id, message.author.id, 'checklist_completed', `Casino: ${ticketState.casino}`);
        
        return message.reply({
          embeds: [EmbedFactory.success('Checklist concluído com sucesso! Clique em **Finalizar** para completar.')],
          components: [ComponentFactory.finishButtons()] // CORREÇÃO: Usar finishButtons() que inclui suporte
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
      'Seleção de Casino',
      `${EMOJIS.STAR} **Você pode escolher qualquer casino!**\n${EMOJIS.WARNING} Selecione o casino onde deseja jogar\n${EMOJIS.SHIELD} Sujeito a BAN se não cumprir as regras`
    )],
    components: [ComponentFactory.casinoSelectMenu(CASINOS)]
  });
}

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  if (!casino) {
    return channel.send({
      embeds: [EmbedFactory.error('Casino não configurado no sistema')]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    casino.checklist.length,
    casino.checklist[stepIndex],
    casino.images?.[stepIndex]
  );

  // CORREÇÃO: Usar stepButtons() que inclui suporte
  channel.send({
    embeds: [embed],
    components: [ComponentFactory.stepButtons()]
  });
}