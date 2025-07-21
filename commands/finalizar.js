const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('finalizar')
    .setDescription('Finaliza o ticket e aprova o giveaway automaticamente (caso todos os passos estejam completos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    // Verifica permissão de moderador
    if (!interaction.member.roles.cache.has(ROLES.MOD)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
        flags: 64
      });
    }

    // Busca approval pendente pelo canal do ticket
    const channelId = interaction.channel.id;
    // Busca todas as approvals pendentes para este canal
    const approvals = await client.db.Approval.find({ ticketChannelId: channelId, status: 'pending' });
    if (!approvals || approvals.length === 0) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Nenhuma aprovação pendente encontrada para este ticket.')],
        flags: 64
      });
    }
    // Se houver mais de uma, pega a mais recente
    const approval = approvals.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Atualiza status para approved
    await client.db.updateApproval(approval.approvalId, 'approved');

    // Envia mensagem de aprovação no canal do ticket
    try {
      await interaction.channel.send({
        embeds: [EmbedFactory.success('Seu giveaway foi aprovado! Parabéns!')]
      });
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