const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close-ticket')
    .setDescription('Fechar ticket atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // Check if this is a ticket channel
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Este comando só pode ser usado em canais de ticket')],
        flags: 64
      });
    }

    const embed = EmbedFactory.ticketClose();
    const components = ComponentFactory.closeTicketButtons();

    await interaction.reply({
      embeds: [embed],
      components: [components]
    });
  }
};