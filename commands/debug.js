const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { cats, refreshCategories, ensureInitialized, getCategoriesFromDB } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Debug das categorias e sistema')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      await ensureInitialized();
      await refreshCategories();
      
      // Get categories from database directly
      const dbCats = await getCategoriesFromDB();
      
      const debugInfo = [
        `**📊 Estado das Categorias**`,
        `**Memória:** ${Object.keys(cats).length} categorias`,
        `**Base de Dados:** ${Object.keys(dbCats).length} categorias`,
        `**Inicializado:** ${cats ? 'Sim' : 'Não'}`,
        ``,
        `**📋 Categorias na Memória:**`,
        ...Object.entries(cats).map(([id, cat]) => 
          `• ${cat.active ? '✅' : '❌'} ${cat.name} (${id}) - ${cat.emoji || 'Sem emoji'}`
        ),
        ``,
        `**🔍 Categorias na Base de Dados:**`,
        ...Object.entries(dbCats).map(([id, cat]) => 
          `• ${cat.active ? '✅' : '❌'} ${cat.name} (${id}) - ${cat.emoji || 'Sem emoji'}`
        )
      ].join('\n');
      
      const embed = EmbedFactory.primary(debugInfo, '🐛 Debug das Categorias');
      
      return interaction.reply({
        embeds: [embed],
        flags: 64
      });
      
    } catch (error) {
      console.error('Error in debug command:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao executar comando de debug')],
        flags: 64
      });
    }
  }
};