const { SlashCommandBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { promos, refreshExpired, refreshPromotions } = require('../utils/promotions');
const MESSAGES = require('../config/messages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restartgiveaway')
    .setDescription('Reiniciar o processo de giveaway após a confirmação (útil quando novos casinos foram adicionados)'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: false });
      
      // Check if there's a ticket state in this channel
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      if (!ticketState) {
        return interaction.followUp({
          embeds: [EmbedFactory.error('❌ **Nenhum ticket encontrado!**\n\nEste comando só pode ser usado em um canal de ticket de giveaway.')],
          flags: 64
        });
      }
      
      // Check if it's a giveaway ticket
      if (ticketState.category !== 'Giveaways') {
        return interaction.followUp({
          embeds: [EmbedFactory.error('❌ **Este não é um ticket de giveaway!**\n\nEste comando só pode ser usado em tickets de giveaway.')],
          flags: 64
        });
      }
      
      // Reset ticket state to after confirmation
      // Clear casino, step, and other giveaway-specific data
      // BUT preserve: ticketNumber, ownerTag, ownerId, category, isVerified
      ticketState.casino = null;
      ticketState.step = 0;
      ticketState.gwType = null;
      ticketState.awaitConfirm = false; // Already confirmed, so set to false
      ticketState.awaitProof = false;
      ticketState.awaitLtcOnly = false;
      ticketState.awaitDescription = false;
      ticketState.awaitTwitchNick = false;
      ticketState.awaitOtherGiveaway = false;
      ticketState.awaitGtbGiveaway = false;
      ticketState.awaitingSupport = false;
      ticketState.prize = null;
      ticketState.ltcAddress = null;
      ticketState.bcGameId = null;
      ticketState.bcGameProfileImage = null;
      ticketState.telegramCode = null;
      ticketState.description = null;
      ticketState.otherGiveawayDescription = null;
      ticketState.gtbData = null;
      ticketState.ltcData = null;
      ticketState.stepData = null;
      ticketState.awaitingCasinoSelection = false;
      ticketState.allowedCasinos = undefined;
      ticketState.websiteType = null;
      ticketState.twitchNick = null;
      ticketState.selectedRedeem = null;
      
      // Save the reset state (preserves ticketNumber, ownerTag, ownerId, category, isVerified)
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      // Refresh promotions to get the latest ones (including new casinos)
      await refreshExpired();
      await refreshPromotions();
      
      // Show giveaway type selection buttons again
      const typeButtons = ComponentFactory.giveawayTypeButtons();
      const components = [typeButtons];
      
      // Add promotion buttons
      const promoButtons = ComponentFactory.promoButtons(promos);
      components.push(...promoButtons);
      
      // Send the giveaway selection message
      await interaction.followUp({
        embeds: [EmbedFactory.giveaway()],
        components: components
      });
      
      // Log the action
      await client.db.logAction(
        interaction.channel.id,
        interaction.user.id,
        'giveaway_restarted',
        'Giveaway process restarted after confirmation'
      );
      
    } catch (error) {
      console.error('Error in /restartgiveaway command:', error);
      return interaction.followUp({
        embeds: [EmbedFactory.error('❌ **Erro ao executar comando!**\n\nOcorreu um erro ao reiniciar o giveaway. Tente novamente ou contate o suporte.')],
        flags: 64
      });
    }
  }
};

