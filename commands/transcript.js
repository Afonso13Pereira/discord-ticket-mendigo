const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');
const MESSAGES = require('../config/messages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Gerir transcripts de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => 
      sub.setName('user')
        .setDescription('Ver transcripts de um usuário')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuário para ver transcripts')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('page')
            .setDescription('Página dos resultados (padrão: 1)')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub => 
      sub.setName('id')
        .setDescription('Ver transcript por ID')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID do transcript')
            .setRequired(true)
        )
    )
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
    // Verificar se a interação já foi processada ou expirou
    if (interaction.replied || interaction.deferred) {
      console.warn('⚠️ Interaction already processed, skipping transcript command');
      return;
    }

    // Verificar idade da interação (máximo 15 minutos)
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 15 * 60 * 1000) {
      console.warn('⚠️ Interaction too old, skipping transcript command');
      return;
    }

    // Defer a resposta imediatamente para operações que podem demorar
    try {
      await interaction.deferReply({ flags: 64 });
    } catch (error) {
      console.error('Error deferring transcript interaction:', error);
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'user') {
      const user = interaction.options.getUser('user');
      const page = interaction.options.getInteger('page') || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      try {
        const { transcripts, total } = await client.db.getUserTranscripts(user.id, limit, offset);
        
        if (transcripts.length === 0) {
          return interaction.editReply({
            embeds: [EmbedFactory.info(
              page === 1 
                ? MESSAGES.TRANSCRIPTS.USER_NO_TRANSCRIPTS.replace('{user}', user.tag)
                : MESSAGES.TRANSCRIPTS.USER_NO_MORE_PAGES.replace('{page}', page)
            )]
          });
        }

        const totalPages = Math.ceil(total / limit);
        const embed = EmbedFactory.userTranscriptsList(user, transcripts, page, totalPages, total);
        const components = ComponentFactory.transcriptPaginationButtons(user.id, page, totalPages);

        return interaction.editReply({
          embeds: [embed],
          components: components.length > 0 ? [components] : []
        });

      } catch (error) {
        console.error('Error getting user transcripts:', error);
        return interaction.editReply({
          embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.GET_ERROR)]
        });
      }
    }

    if (subcommand === 'id') {
      const transcriptId = interaction.options.getString('id');
      
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.editReply({
          embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.NOT_FOUND)]
        });
      }

      const embed = EmbedFactory.transcriptView(transcript);
      const components = ComponentFactory.transcriptButtons(transcriptId);

      return interaction.editReply({
        embeds: [embed],
        components: [components]
      });
    }

    if (subcommand === 'view') {
      const transcriptId = interaction.options.getString('id');
      
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.editReply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
        });
      }

      const embed = EmbedFactory.transcriptView(transcript);
      const components = ComponentFactory.transcriptButtons(transcriptId);

      return interaction.editReply({
        embeds: [embed],
        components: [components]
      });
    }

    if (subcommand === 'download') {
      const transcriptId = interaction.options.getString('id');
      
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.editReply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
        });
      }

      // Create text file attachment
      const buffer = Buffer.from(transcript.content, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, {
        name: `transcript-${transcript.channelName}-${transcriptId}.txt`
      });

      return interaction.editReply({
        embeds: [EmbedFactory.success(`Download do transcript **${transcript.channelName}** (ID: \`${transcriptId}\`)`)],
        files: [attachment]
      });
    }

    if (subcommand === 'send') {
      const transcriptId = interaction.options.getString('id');
      
      const transcript = await client.db.getTranscript(transcriptId);
      
      if (!transcript) {
        return interaction.editReply({
          embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
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

        return interaction.editReply({
          embeds: [EmbedFactory.success(`Transcript **${transcript.channelName}** enviado para ${transcriptsChannel}`)]
        });

      } catch (error) {
        console.error('Error sending transcript to channel:', error);
        return interaction.editReply({
          embeds: [EmbedFactory.error('Erro ao enviar transcript para o canal')]
        });
      }
    }
  }
};