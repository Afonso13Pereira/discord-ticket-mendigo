const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');
const MESSAGES = require('../config/messages');
const db = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('approve')
    .setDescription('Aprova manualmente uma aprovação pelo ID (caso a mensagem tenha sido apagada)')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('ID da aprovação (approvalId)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    // Verifica permissão de moderador
    if (!interaction.member.roles.cache.has(ROLES.MOD)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
        flags: 64
      });
    }

    const approvalId = interaction.options.getString('id');
    const approval = await client.db.getApproval(approvalId);
    if (!approval) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Aprovação não encontrada para o ID informado.')],
        flags: 64
      });
    }
    if (approval.status !== 'pending') {
      return interaction.reply({
        embeds: [EmbedFactory.error('Esta aprovação já foi processada (status: ' + approval.status + ').')],
        flags: 64
      });
    }

    // Atualiza status para approved
    await client.db.updateApproval(approvalId, 'approved');

    // Envia mensagem de aprovação no canal do ticket
    try {
      const ticketChannel = await interaction.guild.channels.fetch(approval.ticketChannelId);
      if (ticketChannel) {
        await ticketChannel.send({
          embeds: [EmbedFactory.success('Seu giveaway foi aprovado! Parabéns!')]
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de aprovação ao ticket:', error);
    }

    // Loga a ação
    await client.db.logAction(approval.ticketChannelId, interaction.user.id, 'giveaway_approved_manual', `Ticket #${approval.ticketNumber}`);

    return interaction.reply({
      embeds: [EmbedFactory.success('Aprovação processada manualmente com sucesso!')],
      flags: 64
    });
  }
}; 