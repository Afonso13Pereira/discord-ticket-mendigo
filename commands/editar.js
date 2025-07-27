const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editar')
    .setDescription('Editar informações do ticket atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    try {
      // Verificar permissão de moderador
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
          flags: 64
        });
      }

      const channelId = interaction.channel.id;
      
      // Buscar estado do ticket
      const ticketState = await client.db.getTicketState(channelId);
      if (!ticketState) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Este canal não é um ticket válido.')],
          flags: 64
        });
      }

      // Verificar se há submission pendente
      const submissions = await client.db.Submission.find({ 
        ticketChannelId: channelId, 
        status: 'pending' 
      });

      // Verificar se há approval pendente
      const approvals = await client.db.Approval.find({ 
        ticketChannelId: channelId, 
        status: 'pending' 
      });

      // Verificar se há approval pago
      const paidApprovals = await client.db.Approval.find({ 
        ticketChannelId: channelId, 
        status: 'paid' 
      });

      if (paidApprovals.length > 0) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Este giveaway já foi pago. Entre em contacto com o suporte para dúvidas ou correções.')],
          flags: 64
        });
      }

      if (approvals.length > 0) {
        // Fase de aprovação - editar approval
        const approval = approvals[0];
        await this.editApproval(interaction, approval, client);
      } else if (submissions.length > 0) {
        // Fase de submissão - editar submission
        const submission = submissions[0];
        await this.editSubmission(interaction, submission, client);
      } else {
        // Fase de ticket - editar ticket state
        await this.editTicketState(interaction, ticketState, client);
      }

    } catch (error) {
      const Logger = require('../utils/logger');
      Logger.error(`Erro ao editar ticket: ${error.message}`, 'EDITAR');
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao editar ticket. Tente novamente.')],
        flags: 64
      });
    }
  },

  async editApproval(interaction, approval, client) {
    console.log(`🔧 [EDIT_MODAL] Creating approval edit modal for: ${approval.approvalId}`);
    const modal = new ModalBuilder()
      .setCustomId(`edit_approval_${approval.approvalId}`)
      .setTitle('✏️ Editar Giveaway Aprovado')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('casino')
            .setLabel('Casino')
            .setStyle(TextInputStyle.Short)
            .setValue(approval.casino || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prêmio')
            .setStyle(TextInputStyle.Short)
            .setValue(approval.prize || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bcgame_id')
            .setLabel('ID BCGame (opcional)')
            .setStyle(TextInputStyle.Short)
            .setValue(approval.bcGameId || '')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('ltc_address')
            .setLabel('Endereço LTC')
            .setStyle(TextInputStyle.Short)
            .setValue(approval.ltcAddress || '')
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  },

  async editSubmission(interaction, submission, client) {
    const modal = new ModalBuilder()
      .setCustomId(`edit_submission_${submission.submissionId}`)
      .setTitle('✏️ Editar Submissão')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('casino')
            .setLabel('Casino')
            .setStyle(TextInputStyle.Short)
            .setValue(submission.casino || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prêmio')
            .setStyle(TextInputStyle.Short)
            .setValue(submission.prize || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bcgame_id')
            .setLabel('ID BCGame (opcional)')
            .setStyle(TextInputStyle.Short)
            .setValue(submission.bcGameId || '')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('ltc_address')
            .setLabel('Endereço LTC')
            .setStyle(TextInputStyle.Short)
            .setValue(submission.ltcAddress || '')
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  },

  async editTicketState(interaction, ticketState, client) {
    const modal = new ModalBuilder()
      .setCustomId(`edit_ticket_${ticketState.channelId}`)
      .setTitle('✏️ Editar Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('casino')
            .setLabel('Casino')
            .setStyle(TextInputStyle.Short)
            .setValue(ticketState.casino || ticketState.vipCasino || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prêmio')
            .setStyle(TextInputStyle.Short)
            .setValue(ticketState.prize || '')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bcgame_id')
            .setLabel('ID BCGame (opcional)')
            .setStyle(TextInputStyle.Short)
            .setValue(ticketState.bcGameId || '')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('ltc_address')
            .setLabel('Endereço LTC')
            .setStyle(TextInputStyle.Short)
            .setValue(ticketState.ltcAddress || '')
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  }
}; 