const { SlashCommandBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gravacaoecra')
    .setDescription('Informações sobre gravações de ecrã'),

  async execute(interaction) {
    try {
      const embed = EmbedFactory.info([
        '**📹 Gravações de Ecrã**\n',
        `${interaction.user} A partir de agora vamos pedir para em certos passos fazer **gravações de ecrã** e não prints!\n`,
        '**🔧 Extensão Recomendada:**',
        'https://chromewebstore.google.com/detail/screen-recorder/hniebljpgcogalllopnjokppmgbhaden\n',
        'Aqui deixo uma extensão para instalarem para ser mais fácil gravarem o ecrã sem precisarem de aplicações.\n',
        '**📤 Como Partilhar:**',
        'Depois tem 2 opções:',
        '• Ou mandam o vídeo para o Discord',
        '• No caso de ser demasiado grande, publicam aqui: https://streamable.com/'
      ].join('\n'), 'Gravações de Ecrã');

      return interaction.reply({
        embeds: [embed],
        flags: 64
      });

    } catch (error) {
      console.error('Error in gravacaoecra:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao exibir informações sobre gravações de ecrã')],
        flags: 64
      });
    }
  }
};
