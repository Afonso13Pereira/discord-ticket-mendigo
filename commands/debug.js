const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Debug: Verificar dados do approval atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    try {
      // Verificar permissão de moderador
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Sem permissão!**')],
          flags: 64
        });
      }

      const channelId = interaction.channel.id;
      
      // Buscar approval do ticket atual
      const approval = await client.db.Approval.findOne({ 
        ticketChannelId: channelId, 
        status: 'pending' 
      });

      if (!approval) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Nenhum approval encontrado para este ticket.')],
          flags: 64
        });
      }

      const debugInfo = {
        approvalId: approval.approvalId,
        ticketNumber: approval.ticketNumber,
        casino: approval.casino,
        prize: approval.prize,
        ltcAddress: approval.ltcAddress,
        discordMessageId: approval.discordMessageId || 'NÃO SALVO',
        telegramMessageId: approval.telegramMessageId || 'NÃO SALVO',
        status: approval.status,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt
      };

      return interaction.reply({
        embeds: [EmbedFactory.info(`**Debug Info - Approval ${approval.approvalId}**\n\n` + 
          Object.entries(debugInfo).map(([key, value]) => 
            `**${key}:** ${value}`
          ).join('\n'))],
        flags: 64
      });

    } catch (error) {
      console.error('Erro no debug:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao executar debug.')],
        flags: 64
      });
    }
  }
};