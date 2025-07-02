const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder } = require('discord.js');
const { cats, create, close, list, refreshCategories, ensureInitialized } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Gerir categorias de ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('create').setDescription('Criar nova categoria'))
    .addSubcommand(s => s.setName('activelist').setDescription('Listar categorias ativas'))
    .addSubcommand(s => s.setName('close')
        .setDescription('Fechar categoria')
        .addStringOption(o => o.setName('id').setDescription('ID da categoria').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const modal = new ModalBuilder()
        .setCustomId('cat_create')
        .setTitle(`${EMOJIS.TICKET} Nova Categoria`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cname')
              .setLabel('Nome da Categoria')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex: Suporte Técnico')
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('ccolor')
              .setLabel('Cor do Botão (blue|grey|green|red)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('blue')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cemoji')
              .setLabel('Emoji (opcional)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('🛠️')
              .setRequired(false)
          )
        );
      
      return interaction.showModal(modal);
    }

    if (subcommand === 'activelist') {
      try {
        // CORREÇÃO: Garantir que a base de dados está inicializada e refresh das categorias
        await ensureInitialized();
        await refreshCategories();
        
        console.log(`📋 Getting category list. Categories in memory:`, Object.keys(cats));
        
        const categoryList = await list();
        
        console.log(`📋 Category list result:`, categoryList.length, 'categories');
        categoryList.forEach(([id, cat]) => {
          console.log(`  - ${cat.name} (${id}): active=${cat.active}`);
        });
        
        if (!categoryList.length) {
          return interaction.reply({
            embeds: [EmbedFactory.info('Nenhuma categoria encontrada', 'Lista de Categorias')],
            flags: 64
          });
        }

        const description = categoryList.slice(0, 15).map(([id, category]) => {
          const status = category.active ? EMOJIS.SUCCESS : EMOJIS.ERROR;
          const emoji = category.emoji || EMOJIS.TICKET;
          const createdDate = new Date(category.created).toLocaleDateString('pt-PT');
          return `${status} ${emoji} **${category.name}**\n└ ID: \`${id}\` • Criada: ${createdDate} • Status: ${category.active ? 'Ativa' : 'Inativa'}`;
        }).join('\n\n');

        const embed = EmbedFactory.primary(description, `${EMOJIS.TICKET} Lista de Categorias (${categoryList.length})`);
        
        return interaction.reply({ embeds: [embed], flags: 64 });
        
      } catch (error) {
        console.error('Error in tickets activelist:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao obter lista de categorias')],
          flags: 64
        });
      }
    }

    if (subcommand === 'close') {
      try {
        await ensureInitialized();
        await refreshCategories();
        
        const id = interaction.options.getString('id');
        
        console.log(`🔍 Looking for category ID: ${id}`);
        console.log(`📋 Available categories:`, Object.keys(cats));
        
        if (!cats[id]) {
          return interaction.reply({
            embeds: [EmbedFactory.error(`ID de categoria inválido: \`${id}\`\n\nCategorias disponíveis: ${Object.keys(cats).join(', ')}`)],
            flags: 64
          });
        }

        await close(id);
        return interaction.reply({
          embeds: [EmbedFactory.success(`Categoria \`${cats[id].name}\` (ID: \`${id}\`) foi fechada com sucesso`)],
          flags: 64
        });
        
      } catch (error) {
        console.error('Error closing category:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao fechar categoria')],
          flags: 64
        });
      }
    }
  }
};