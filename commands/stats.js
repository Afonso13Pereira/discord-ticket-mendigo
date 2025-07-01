const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { CHANNELS, EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostrar estatísticas dos tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => 
      sub.setName('show')
        .setDescription('Mostrar estatísticas atuais')
    )
    .addSubcommand(sub =>
      sub.setName('update')
        .setDescription('Atualizar mensagem de estatísticas no canal')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'show') {
      const stats = await client.db.getTicketStatistics();
      
      if (!stats) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao obter estatísticas')],
          flags: 64
        });
      }

      const embed = EmbedFactory.ticketStatistics(stats);
      
      return interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }

    if (subcommand === 'update') {
      try {
        const statsChannel = await interaction.guild.channels.fetch(CHANNELS.STATS);
        const stats = await client.db.getTicketStatistics();
        
        if (!stats) {
          return interaction.reply({
            embeds: [EmbedFactory.error('Erro ao obter estatísticas')],
            flags: 64
          });
        }

        const embed = EmbedFactory.ticketStatistics(stats);
        
        // Clear channel and send new stats
        const messages = await statsChannel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
          await statsChannel.bulkDelete(messages);
        }
        
        await statsChannel.send({
          embeds: [embed]
        });

        return interaction.reply({
          embeds: [EmbedFactory.success(`Estatísticas atualizadas no canal ${statsChannel}`)],
          flags: 64
        });

      } catch (error) {
        console.error('Error updating stats:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao atualizar estatísticas no canal')],
          flags: 64
        });
      }
    }
  }
};