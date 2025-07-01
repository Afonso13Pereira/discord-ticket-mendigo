// commands/setup-tickets.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { cats } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { EMOJIS } = require('../config/constants');

const STATIC_CATEGORIES = [
  { id: 'Giveaways', label: 'Giveaways', emoji: EMOJIS.GIFT, color: 'blue' },
  { id: 'VIPS', label: 'VIPS', emoji: EMOJIS.CROWN, color: 'green' },
  { id: 'Dúvidas', label: 'Dúvidas', emoji: '❓', color: 'grey' },
  { id: 'Website', label: 'Website', emoji: '🌐', color: 'grey' },
  { id: 'Outros', label: 'Outros', emoji: '📌', color: 'red' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Publica ou atualiza a mensagem principal dos tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = EmbedFactory.ticket(
      'Sistema de Suporte',
      [
        '**Bem-vindo ao nosso sistema de suporte!**',
        '',
        `${EMOJIS.STAR} Clique no botão que melhor descreve o seu pedido`,
        `${EMOJIS.SHIELD} Suporte disponível 24/7`,
        `${EMOJIS.DIAMOND} Resposta rápida e profissional`,
        '',
        '*Escolha uma categoria abaixo para começar:*'
      ].join('\n')
    );

    const components = ComponentFactory.categoryButtons(STATIC_CATEGORIES, cats);

    await interaction.reply({ 
      content: `${EMOJIS.SUCCESS} Mensagem de tickets atualizada com sucesso!`, 
      flags: 64 
    });

    await interaction.channel.send({
      embeds: [embed],
      components: components
    });
  }
};