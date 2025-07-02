const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { cats, refreshCategories, forceRefresh, getCategoriesFromDB } = require('../utils/categories');
const { promos, refreshPromotions, forceRefresh: forceRefreshPromos, getPromotionsFromDB } = require('../utils/promotions');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Comandos de debug para resolver problemas')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => 
      sub.setName('categories')
        .setDescription('Debug das categorias')
    )
    .addSubcommand(sub =>
      sub.setName('promotions')
        .setDescription('Debug das promoções')
    )
    .addSubcommand(sub =>
      sub.setName('refresh')
        .setDescription('Forçar refresh de tudo')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'categories') {
      try {
        // Get categories from memory
        const memoryCats = Object.keys(cats);
        
        // Get categories directly from database
        const dbCats = await getCategoriesFromDB();
        const dbCatsKeys = Object.keys(dbCats);
        
        // Force refresh
        await forceRefresh();
        const refreshedCats = Object.keys(cats);
        
        const embed = EmbedFactory.info([
          `**🧠 Categorias na Memória:** ${memoryCats.length}`,
          memoryCats.length > 0 ? memoryCats.map(id => `• ${cats[id]?.name || 'Unknown'} (${id})`).join('\n') : 'Nenhuma categoria na memória',
          '',
          `**💾 Categorias na Base de Dados:** ${dbCatsKeys.length}`,
          dbCatsKeys.length > 0 ? dbCatsKeys.map(id => `• ${dbCats[id]?.name || 'Unknown'} (${id}) - active: ${dbCats[id]?.active}`).join('\n') : 'Nenhuma categoria na base de dados',
          '',
          `**🔄 Após Force Refresh:** ${refreshedCats.length}`,
          refreshedCats.length > 0 ? refreshedCats.map(id => `• ${cats[id]?.name || 'Unknown'} (${id}) - active: ${cats[id]?.active}`).join('\n') : 'Nenhuma categoria após refresh'
        ].join('\n'), 'Debug das Categorias');
        
        return interaction.reply({
          embeds: [embed],
          flags: 64
        });
        
      } catch (error) {
        console.error('Error in debug categories:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro no debug das categorias')],
          flags: 64
        });
      }
    }

    if (subcommand === 'promotions') {
      try {
        // Get promotions from memory
        const memoryPromos = Object.keys(promos);
        
        // Get promotions directly from database
        const dbPromos = await getPromotionsFromDB();
        const dbPromosKeys = Object.keys(dbPromos);
        
        // Force refresh
        await forceRefreshPromos();
        const refreshedPromos = Object.keys(promos);
        
        const embed = EmbedFactory.info([
          `**🧠 Promoções na Memória:** ${memoryPromos.length}`,
          memoryPromos.length > 0 ? memoryPromos.map(id => `• ${promos[id]?.name || 'Unknown'} (${id}) - active: ${promos[id]?.active}`).join('\n') : 'Nenhuma promoção na memória',
          '',
          `**💾 Promoções na Base de Dados:** ${dbPromosKeys.length}`,
          dbPromosKeys.length > 0 ? dbPromosKeys.map(id => `• ${dbPromos[id]?.name || 'Unknown'} (${id}) - active: ${dbPromos[id]?.active}`).join('\n') : 'Nenhuma promoção na base de dados',
          '',
          `**🔄 Após Force Refresh:** ${refreshedPromos.length}`,
          refreshedPromos.length > 0 ? refreshedPromos.map(id => `• ${promos[id]?.name || 'Unknown'} (${id}) - active: ${promos[id]?.active}`).join('\n') : 'Nenhuma promoção após refresh'
        ].join('\n'), 'Debug das Promoções');
        
        return interaction.reply({
          embeds: [embed],
          flags: 64
        });
        
      } catch (error) {
        console.error('Error in debug promotions:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro no debug das promoções')],
          flags: 64
        });
      }
    }

    if (subcommand === 'refresh') {
      try {
        // Force refresh everything
        await forceRefresh();
        await forceRefreshPromos();
        
        const categoriesCount = Object.keys(cats).length;
        const promosCount = Object.keys(promos).length;
        
        const embed = EmbedFactory.success([
          `**🔄 Refresh Completo Executado**`,
          '',
          `✅ **Categorias:** ${categoriesCount} carregadas`,
          `✅ **Promoções:** ${promosCount} carregadas`,
          '',
          `${EMOJIS.INFO} Todos os dados foram recarregados da base de dados`
        ].join('\n'), 'Refresh Completo');
        
        return interaction.reply({
          embeds: [embed],
          flags: 64
        });
        
      } catch (error) {
        console.error('Error in debug refresh:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro no refresh completo')],
          flags: 64
        });
      }
    }
  }
};