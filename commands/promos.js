const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder } = require('discord.js');
const { promos, create, close, list, refreshPromotions, ensureInitialized } = require('../utils/promotions');
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
      try {
        // CORREÇÃO: Garantir que a base de dados está inicializada e refresh das promoções
        await ensureInitialized();
        await refreshPromotions();
        
        console.log(`🔥 Getting promotion list. Promotions in memory:`, Object.keys(promos));
        
        const promoList = await list();
        
        console.log(`🔥 Promotion list result:`, promoList.length, 'promotions');
        promoList.forEach(([id, promo]) => {
          console.log(`  - ${promo.name} (${id}): active=${promo.active}, expires=${promo.end}`);
        });
        
        if (!promoList.length) {
          return interaction.reply({
            embeds: [EmbedFactory.info('Nenhuma promoção encontrada', 'Lista de Promoções')],
            flags: 64
          });
        }

        const description = promoList.slice(0, 15).map(([id, promo]) => {
          const status = promo.active ? EMOJIS.SUCCESS : EMOJIS.ERROR;
          const emoji = promo.emoji || EMOJIS.FIRE;
          const isExpired = Date.now() > new Date(promo.end);
          const statusText = !promo.active ? 'Fechada' : isExpired ? 'Expirada' : 'Ativa';
          return `${status} ${emoji} **${promo.name}**\n└ ID: \`${id}\` • Casino: ${promo.casino} • Status: ${statusText}\n└ Termina: <t:${Math.floor(new Date(promo.end)/1000)}:R>`;
        }).join('\n\n');

        const embed = EmbedFactory.primary(description, `${EMOJIS.FIRE} Lista de Promoções (${promoList.length})`);
        
        return interaction.reply({ embeds: [embed], flags: 64 });
        
      } catch (error) {
        console.error('Error in promos activelist:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao obter lista de promoções')],
          flags: 64
        });
      }
    }

    if (subcommand === 'close') {
      try {
        await ensureInitialized();
        await refreshPromotions();
        
        const id = interaction.options.getString('id');
        
        console.log(`🔍 Looking for promotion ID: ${id}`);
        console.log(`🔥 Available promotions:`, Object.keys(promos));
        
        if (!promos[id]) {
          return interaction.reply({
            embeds: [EmbedFactory.error(`ID de promoção inválido: \`${id}\`\n\nPromoções disponíveis: ${Object.keys(promos).join(', ')}`)],
            flags: 64
          });
        }

        await close(id);
        return interaction.reply({
          embeds: [EmbedFactory.success(`Promoção \`${promos[id].name}\` (ID: \`${id}\`) foi fechada com sucesso`)],
          flags: 64
        });
        
      } catch (error) {
        console.error('Error closing promotion:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao fechar promoção')],
          flags: 64
        });
      }
    }
  }
};