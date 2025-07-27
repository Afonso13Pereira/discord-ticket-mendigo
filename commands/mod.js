const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { ROLES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Enviar mensagem como bot (apenas moderadores)')
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('Mensagem a ser enviada como bot')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    try {
      // Verificar se o usuário tem cargo de moderador
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
          flags: 64
        });
      }

      const mensagem = interaction.options.getString('mensagem');
      
      // Apagar a mensagem do comando /mod
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();

      // Enviar a mensagem como se fosse do bot
      await interaction.channel.send({
        embeds: [EmbedFactory.info(mensagem)]
      });

      // Log da ação
      await client.db.logAction(
        interaction.channel.id, 
        interaction.user.id, 
        'mod_command_used', 
        `Mensagem: ${mensagem.substring(0, 100)}`
      );

    } catch (error) {
      console.error('Erro no comando /mod:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('❌ **Erro ao executar comando!**\n\nTente novamente ou contate o suporte.')],
        flags: 64
      });
    }
  }
}; 