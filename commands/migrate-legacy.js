// commands/migrate-legacy.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('migrate-legacy')
    .setDescription('Migrar approvals antigas para o novo sistema (apenas moderadores)')
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

      await interaction.deferReply({ ephemeral: true });

      try {
        console.log('[MIGRATE-LEGACY] Iniciando migração manual...');
        
        // Executar migração
        await client.db.migrateLegacyApprovals();
        
        console.log('[MIGRATE-LEGACY] Migração concluída com sucesso');
        
        return interaction.editReply({
          embeds: [EmbedFactory.success('✅ **Migração concluída com sucesso!**\n\nTodas as approvals antigas foram migradas para o novo sistema.')]
        });

      } catch (error) {
        console.error('[MIGRATE-LEGACY] Erro na migração:', error);
        
        return interaction.editReply({
          embeds: [EmbedFactory.error('❌ **Erro na migração!**\n\nVerifique os logs para mais detalhes.')]
        });
      }

    } catch (error) {
      console.error('Erro no comando migrate-legacy:', error);
      return interaction.editReply({
        embeds: [EmbedFactory.error('❌ **Erro interno!**\n\nTente novamente ou contate o suporte.')]
      });
    }
  }
}; 