const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveawaynaorecebido')
    .setDescription('Reenviar modal de pagamento para giveaway NÃO recebido (apenas MODS)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    // Verificar permissão de MOD
    if (!interaction.member.roles.cache.has(ROLES.MOD)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
        flags: 64
      });
    }

    // Buscar o ticketState do canal atual
    const ticketState = client.ticketStates.get(interaction.channel.id);
    if (!ticketState || !ticketState.prize) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Não foi possível encontrar o valor do prêmio neste ticket.')],
        flags: 64
      });
    }

    // Criar modal customizado
    const modal = new ModalBuilder()
      .setCustomId(`prize_modal_naorecebido_${interaction.channel.id}`)
      .setTitle(`Prêmio Telegram - ${ticketState.prize}€`);

    // Campo de valor do prêmio (preenchido)
    const prizeInput = new TextInputBuilder()
      .setCustomId('prize_value')
      .setLabel('Confirmar Valor Do Prêmio')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(ticketState.prize.toString());

    // Alerta extra
    const alertInput = new TextInputBuilder()
      .setCustomId('alert_naorecebido')
      .setLabel('⚠️ Giveaway NÃO recebido!')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue('Giveaway não recebido');

    // Adicionar campos ao modal
    modal.addComponents(
      new ActionRowBuilder().addComponents(prizeInput),
      new ActionRowBuilder().addComponents(alertInput)
    );

    // Mostrar modal ao usuário
    await interaction.showModal(modal);
  }
}; 