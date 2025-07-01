const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Gerir transcripts de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => 
      sub.setName('view')
        .setDescription('Ver transcript por ID')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID do transcript')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('download')
        .setDescription('Download de transcript por ID')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID do transcript')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Enviar transcript para o canal de transcripts')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID do transcript')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const transcriptId = interaction.options.getString('id');

    if (subcommand === 'view') {
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')],
          flags: 64
        });
      }

      const embed = EmbedFactory.transcriptView(transcript);
      const components = ComponentFactory.transcriptButtons(transcriptId);

      return interaction.reply({
        embeds: [embed],
        components: [components],
        flags: 64
      });
    }

    if (subcommand === 'download') {
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')],
          flags: 64
        });
      }

      // Create text file attachment
      const buffer = Buffer.from(transcript.content, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, {
        name: `transcript-${transcript.channelName}-${transcriptId}.txt`
      });

      return interaction.reply({
        embeds: [EmbedFactory.success(`Download do transcript **${transcript.channelName}** (ID: \`${transcriptId}\`)`)],
        files: [attachment],
        flags: 64
      });
    }

    if (subcommand === 'send') {
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')],
          flags: 64
        });
      }

      try {
        // Send transcript to transcripts channel
        const transcriptsChannel = await interaction.guild.channels.fetch(CHANNELS.TRANSCRIPTS);
        const embed = EmbedFactory.transcriptCreated(transcriptId, transcript.channelName);
        const components = ComponentFactory.transcriptButtons(transcriptId);
        
        await transcriptsChannel.send({
          embeds: [embed],
          components: [components]
        });

        return interaction.reply({
          embeds: [EmbedFactory.success(`Transcript **${transcript.channelName}** enviado para ${transcriptsChannel}`)],
          flags: 64
        });

      } catch (error) {
        console.error('Error sending transcript to channel:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao enviar transcript para o canal')],
          flags: 64
        });
      }
    }
  }
};