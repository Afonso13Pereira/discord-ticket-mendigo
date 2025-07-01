const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder } = require('discord.js');
const { cats, create, close, list } = require('../utils/categories');
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
      const categoryList = list();
      
      if (!categoryList.length) {
        return interaction.reply({
          embeds: [EmbedFactory.info('Nenhuma categoria encontrada', 'Lista de Categorias')],
          flags: 64
        });
      }

      const description = categoryList.slice(0, 15).map(([id, category]) => {
        const status = category.active ? EMOJIS.SUCCESS : EMOJIS.ERROR;
        const emoji = category.emoji || EMOJIS.TICKET;
        return `${status} ${emoji} **${category.name}**\n└ ID: \`${id}\``;
      }).join('\n\n');

      const embed = EmbedFactory.primary(description, `${EMOJIS.TICKET} Lista de Categorias`);
      
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (subcommand === 'close') {
      const id = interaction.options.getString('id');
      
      if (!cats[id]) {
        return interaction.reply({
          embeds: [EmbedFactory.error('ID de categoria inválido')],
          flags: 64
        });
      }

      close(id);
      return interaction.reply({
        embeds: [EmbedFactory.success(`Categoria \`${id}\` foi fechada com sucesso`)],
        flags: 64
      });
    }
  }
};