// events/messageCreate.js
require('dotenv').config();
const CASINOS = require('./casinos');
const { promos, refreshExpired } = require('../utils/promotions');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

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
        client.ticketStates.set(message.channel.id, ticketState);

        // Create giveaway type buttons
        const typeButtons = ComponentFactory.giveawayTypeButtons();
        const components = [typeButtons];

        // Add promo buttons
        refreshExpired();
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

    // Telegram Code + Screenshot
    if (ticketState.gwType === 'telegram' && !ticketState.casino) {
      if (message.attachments.size > 0) ticketState.telegramHasImg = true;
      
      const codeMatch = message.content.match(/[a-f0-9]{8}/i);
      if (codeMatch) ticketState.telegramCode = codeMatch[0].toLowerCase();
      
      client.ticketStates.set(message.channel.id, ticketState);

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

      const prizeMatch = codeMessage.content.match(/prenda\s*:\s*(\d+)/i);
      if (prizeMatch) ticketState.prize = prizeMatch[1];
      
      ticketState.casino = 'RioAce';
      ticketState.step = 0;
      ticketState.awaitProof = true;
      client.ticketStates.set(message.channel.id, ticketState);
      
      await message.reply({
        embeds: [EmbedFactory.success('Código validado com sucesso! Casino: **RioAce**')]
      });
      return askChecklist(message.channel, ticketState);
    }

    // Checklist Validation
    if (ticketState.casino && ticketState.awaitProof) {
      const casino = CASINOS[ticketState.casino];
      const stepIndex = ticketState.step;

      if (stepIndex < 3) {
        if (message.attachments.size === 0) {
          return message.reply({
            embeds: [EmbedFactory.error('Este passo requer o envio de uma **imagem**')]
          });
        }
        ticketState.awaitProof = false;
      } else if (stepIndex === 3) {
        if (message.attachments.size > 0) ticketState.step4HasImg = true;
        if (message.content && message.content.length >= 25) {
          ticketState.step4HasAddr = true;
          ticketState.ltcAddress = message.content;
        }
        
        client.ticketStates.set(message.channel.id, ticketState);
        
        if (!ticketState.step4HasImg || !ticketState.step4HasAddr) {
          const missing = [];
          if (!ticketState.step4HasImg) missing.push('**imagem do depósito**');
          if (!ticketState.step4HasAddr) missing.push('**endereço LTC em texto**');
          
          return message.reply({
            embeds: [EmbedFactory.error(`Ainda falta: ${missing.join(' e ')}`)]
          });
        }
        ticketState.awaitProof = false;
      }

      if (!ticketState.awaitProof) {
        client.ticketStates.set(message.channel.id, ticketState);

        if (stepIndex + 1 < casino.checklist.length) {
          return message.reply({
            embeds: [EmbedFactory.success('Prova recebida! Clique em **Próximo Passo** para continuar.')],
            components: [ComponentFactory.createButtonRow(ComponentFactory.nextStepButton())]
          });
        }
        
        return message.reply({
          embeds: [EmbedFactory.success('Checklist concluído com sucesso! Clique em **Finalizar** para completar.')],
          components: [ComponentFactory.createButtonRow(ComponentFactory.finishButton())]
        });
      }
    }
  }
};

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  const embed = EmbedFactory.checklist(
    1,
    casino.checklist.length,
    casino.checklist[0],
    casino.images?.[0]
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.createButtonRow(ComponentFactory.nextStepButton())]
  });
}