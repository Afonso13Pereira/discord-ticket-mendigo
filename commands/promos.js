const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder } = require('discord.js');
const { promos, create, close, list } = require('../utils/promotions');
const EmbedFactory = require('../utils/embeds');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promos')
    .setDescription('Gerir promoções flash')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('create').setDescription('Criar nova promoção'))
    .addSubcommand(s => s.setName('activelist').setDescription('Listar promoções ativas'))
    .addSubcommand(s => s.setName('close')
        .setDescription('Fechar promoção')
        .addStringOption(o => o.setName('id').setDescription('ID da promoção').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const modal = new ModalBuilder()
        .setCustomId('promo_create')
        .setTitle(`${EMOJIS.FIRE} Criar Nova Promoção`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pname')
              .setLabel('Nome da Promoção')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex: Flash Promo Weekend')
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pend')
              .setLabel('Data de Término (AAAA-MM-DD HH:MM)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('2025-12-31 23:30')
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pcasino')
              .setLabel('Casino ("todos" ou nome específico)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('RioAce, BCGame, ou "todos"')
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pcolor')
              .setLabel('Cor do Botão (blue|grey|green|red)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('blue')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pemoji')
              .setLabel('Emoji (opcional)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('🔥')
              .setRequired(false)
          )
        );
      
      return interaction.showModal(modal);
    }

    if (subcommand === 'activelist') {
      const promoList = list();
      
      if (!promoList.length) {
        return interaction.reply({
          embeds: [EmbedFactory.info('Nenhuma promoção encontrada', 'Lista de Promoções')],
          flags: 64
        });
      }

      const description = promoList.slice(0, 15).map(([id, promo]) => {
        const status = promo.active ? EMOJIS.SUCCESS : EMOJIS.ERROR;
        const emoji = promo.emoji || EMOJIS.FIRE;
        return `${status} ${emoji} **${promo.name}**\n└ ID: \`${id}\` • Termina: <t:${Math.floor(new Date(promo.end)/1000)}:R>`;
      }).join('\n\n');

      const embed = EmbedFactory.primary(description, `${EMOJIS.FIRE} Lista de Promoções`);
      
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (subcommand === 'close') {
      const id = interaction.options.getString('id');
      
      if (!promos[id]) {
        return interaction.reply({
          embeds: [EmbedFactory.error('ID de promoção inválido')],
          flags: 64
        });
      }

      close(id);
      return interaction.reply({
        embeds: [EmbedFactory.success(`Promoção \`${id}\` foi fechada com sucesso`)],
        flags: 64
      });
    }
  }
};