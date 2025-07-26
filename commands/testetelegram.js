const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testetelegram')
    .setDescription('Testar conexão com o bot do Telegram')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    // Verifica permissão de moderador
    if (!interaction.member.roles.cache.has(ROLES.MOD)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
        flags: 64
      });
    }

    try {
      const telegramService = require('../utils/telegram');
      
      // Teste simples
      const result = await telegramService.sendMessage('🧪 **Teste do Bot**\n\n✅ Bot funcionando corretamente!\n\n🕐 Teste realizado em: ' + new Date().toLocaleString('pt-BR'));
      
      if (result) {
        return interaction.reply({
          embeds: [EmbedFactory.success('✅ **Teste do Telegram realizado com sucesso!**\n\nMensagem enviada para o grupo do Telegram.')],
          flags: 64
        });
      } else {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Erro no teste do Telegram**\n\nVerifique:\n• Token do bot está correto\n• Chat ID está correto\n• Bot tem permissões no grupo')],
          flags: 64
        });
      }
    } catch (error) {
      console.error('[TELEGRAM TEST] Erro:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error(`❌ **Erro no teste do Telegram**\n\nErro: ${error.message}`)],
        flags: 64
      });
    }
  }
}; 