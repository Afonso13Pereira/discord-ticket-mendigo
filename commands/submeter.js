const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submeter')
    .setDescription('Submete o ticket para aprovação manualmente (caso todos os passos estejam completos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    // Verifica permissão de moderador
    if (!interaction.member.roles.cache.has(ROLES.MOD)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
        flags: 64
      });
    }

    const channelId = interaction.channel.id;
    // Verifica se já existe approval pendente
    const approvals = await client.db.Approval.find({ ticketChannelId: channelId, status: 'pending' });
    if (approvals && approvals.length > 0) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Já existe uma aprovação pendente para este ticket.')],
        flags: 64
      });
    }

    // Busca o estado do ticket
    const ticketState = await client.db.getTicketState(channelId);
    if (!ticketState) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Não foi possível encontrar o estado do ticket.')],
        flags: 64
      });
    }
    // Validação básica dos campos necessários
    if (!ticketState.ticketNumber || !ticketState.ownerId || !ticketState.ownerTag || !(ticketState.casino || ticketState.vipCasino) || !ticketState.prize) {
      return interaction.reply({
        embeds: [EmbedFactory.error('O ticket não possui todas as informações necessárias para submeter à aprovação.')],
        flags: 64
      });
    }

    // Cria a approval manualmente
    const approvalId = await client.db.saveApproval(
      channelId,
      ticketState.ticketNumber,
      ticketState.ownerId,
      ticketState.ownerTag,
      ticketState.casino || ticketState.vipCasino,
      ticketState.prize,
      ticketState.ltcAddress,
      ticketState.bcGameId,
      ticketState.bcGameProfileImage,
      null // messageId
    );

    if (!approvalId) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao criar aprovação. Tente novamente.')],
        flags: 64
      });
    }

    // Mensagem de confirmação
    await interaction.channel.send({
      embeds: [EmbedFactory.success('Ticket submetido para aprovação com sucesso!')] 
    });

    return interaction.reply({
      embeds: [EmbedFactory.success('Submissão criada e enviada para aprovação.')],
      flags: 64
    });
  }
}; 