// commands/setup-tickets.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const { cats } = require('../utils/categories');   // ← categorias dinâmicas

/* mapa texto → estilos do Discord */
const styleMap = {
  blue : ButtonStyle.Primary,
  grey : ButtonStyle.Secondary,
  green: ButtonStyle.Success,
  red  : ButtonStyle.Danger
};

/* categorias “fixas” (sempre visíveis) */
const STATIC_CATS = [
  { id: 'Giveaways', label: 'Giveaways', emoji: '🎁', color: 'blue' },
  { id: 'VIPS',      label: 'VIPS',      emoji: '👑', color: 'green' },
  { id: 'Dúvidas',   label: 'Dúvidas',   emoji: '❓', color: 'grey' },
  { id: 'Website',   label: 'Website',   emoji: '🌐', color: 'grey' },
  { id: 'Outros',    label: 'Outros',    emoji: '📌', color: 'red'  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Publica ou actualiza a mensagem principal dos tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(inter) {

    /* ---------- constroi as rows de botões ---------- */
    const rows = [];
    let current = new ActionRowBuilder();

    /* 1) categorias estáticas */
    for (const c of STATIC_CATS) {
      current.addComponents(
        new ButtonBuilder()
          .setCustomId(`category_${c.id}`)
          .setLabel(c.label)
          .setStyle(styleMap[c.color])
          .setEmoji(c.emoji)
      );
    }
    rows.push(current);

    /* 2) categorias dinâmicas (máx 5 botões por row) */
    current = new ActionRowBuilder();
    for (const [id, cat] of Object.entries(cats)) {
      if (!cat.active) continue;

      if (current.components.length === 5) {          // inicia nova row
        rows.push(current);
        current = new ActionRowBuilder();
      }

      const btn = new ButtonBuilder()
        .setCustomId(`category_${id}`)
        .setLabel(cat.name)
        .setStyle(styleMap[cat.color] || ButtonStyle.Secondary);

      if (cat.emoji) btn.setEmoji(cat.emoji);
      current.addComponents(btn);
    }
    if (current.components.length) rows.push(current);   // adiciona última row

    /* ---------- envia a mensagem ---------- */
    await inter.reply({ content: '(Mensagem actualizada)', flags: 64 });

    await inter.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🛠️ Suporte • Tickets')
          .setDescription('Clica no botão que melhor descreve o teu pedido:')
      ],
      components: rows
    });
  }
};
