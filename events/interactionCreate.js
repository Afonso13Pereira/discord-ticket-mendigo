// events/interactionCreate.js
require('dotenv').config();
const {
  ChannelType, PermissionsBitField,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, InteractionType, AttachmentBuilder
} = require('discord.js');

const CASINOS = require('./casinos');
const { promos, create: createPromo, refreshExpired } = require('../utils/promotions');
const { cats, create: createCat } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const TranscriptManager = require('../utils/transcripts');
const { CHANNELS, EMOJIS } = require('../config/constants');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    await refreshExpired();

    // Initialize transcript manager
    const transcriptManager = new TranscriptManager(client.db);

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) return command.execute(interaction, client);
    }

    // Modal Submissions
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'promo_create') {
        const name = interaction.fields.getTextInputValue('pname').trim();
        const endISO = interaction.fields.getTextInputValue('pend').trim();
        const casino = interaction.fields.getTextInputValue('pcasino').trim();
        const color = interaction.fields.getTextInputValue('pcolor')?.trim().toLowerCase() || 'grey';
        const emoji = interaction.fields.getTextInputValue('pemoji')?.trim() || null;
        
        const id = await createPromo(name, endISO, casino, color, emoji);
        
        // Log action
        await client.db.logAction(interaction.channel?.id || 'DM', interaction.user.id, 'promo_created', `ID: ${id}, Name: ${name}`);
        
        return interaction.reply({
          embeds: [EmbedFactory.success(`Promoção **${name}** criada com sucesso!\nID: \`${id}\``)],
          flags: 64
        });
      }

      if (interaction.customId === 'cat_create') {
        const name = interaction.fields.getTextInputValue('cname').trim();
        const color = interaction.fields.getTextInputValue('ccolor')?.trim().toLowerCase() || 'grey';
        const emoji = interaction.fields.getTextInputValue('cemoji')?.trim() || null;
        
        const id = await createCat(name, color, emoji);
        
        // Log action
        await client.db.logAction(interaction.channel?.id || 'DM', interaction.user.id, 'category_created', `ID: ${id}, Name: ${name}`);
        
        return interaction.reply({
          embeds: [EmbedFactory.success(`Categoria **${name}** criada com sucesso!\nID: \`${id}\``)],
          flags: 64
        });
      }
    }

    // Close Ticket Buttons
    if (interaction.isButton() && (interaction.customId === 'close_with_transcript' || interaction.customId === 'close_delete_ticket')) {
      try { await interaction.deferReply({ flags: 64 }); } catch {}

      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      if (interaction.customId === 'close_with_transcript') {
        try {
          // Generate transcript
          const transcriptId = await transcriptManager.generateTranscript(interaction.channel, ticketState || { ownerTag: 'Unknown' });
          
          // Log transcript creation
          await client.db.logAction(interaction.channel.id, interaction.user.id, 'transcript_created', `ID: ${transcriptId}`);
          
          // Send transcript info to transcripts channel
          const transcriptsChannel = await interaction.guild.channels.fetch(CHANNELS.TRANSCRIPTS);
          const embed = EmbedFactory.transcriptCreated(transcriptId, interaction.channel.name);
          const components = ComponentFactory.transcriptButtons(transcriptId);
          
          await transcriptsChannel.send({
            embeds: [embed],
            components: [components]
          });

          // Clean up ticket state
          await client.deleteTicketState(interaction.channel.id);
          
          await interaction.editReply({
            embeds: [EmbedFactory.success(`Transcript criado com ID: \`${transcriptId}\`\nCanal será eliminado em 10 segundos...`)]
          });

          // Delete channel after 10 seconds
          setTimeout(async () => {
            try {
              await interaction.channel.delete();
            } catch (error) {
              console.error('Error deleting channel:', error);
            }
          }, 10000);

        } catch (error) {
          console.error('Error creating transcript:', error);
          await interaction.editReply({
            embeds: [EmbedFactory.error('Erro ao criar transcript. Tente novamente.')]
          });
        }
      }

      if (interaction.customId === 'close_delete_ticket') {
        // Log ticket deletion
        await client.db.logAction(interaction.channel.id, interaction.user.id, 'ticket_deleted', 'No transcript');
        
        // Clean up ticket state
        await client.deleteTicketState(interaction.channel.id);
        
        await interaction.editReply({
          embeds: [EmbedFactory.warning('Ticket será eliminado em 5 segundos...')]
        });

        // Delete channel after 5 seconds
        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (error) {
            console.error('Error deleting channel:', error);
          }
        }, 5000);
      }

      return;
    }

    // Transcript View/Download Buttons
    if (interaction.isButton() && (interaction.customId.startsWith('view_transcript_') || interaction.customId.startsWith('download_transcript_'))) {
      const transcriptId = interaction.customId.split('_')[2];
      
      if (interaction.customId.startsWith('view_transcript_')) {
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          return interaction.reply({
            embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')],
            flags: 64
          });
        }

        const embed = EmbedFactory.transcriptView(transcript);
        
        return interaction.reply({
          embeds: [embed],
          flags: 64
        });
      }

      if (interaction.customId.startsWith('download_transcript_')) {
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
          embeds: [EmbedFactory.success(`Download do transcript **${transcript.channelName}**`)],
          files: [attachment],
          flags: 64
        });
      }
    }

    // Category Buttons (Ticket Creation)
    if (interaction.isButton() && interaction.customId.startsWith('category_')) {
      const categoryId = interaction.customId.slice(9);
      const category = cats[categoryId] || { name: categoryId, color: 'grey', emoji: null };

      // Create ticket channel
      const parentCategory = interaction.guild.channels.cache
        .find(c => c.name === category.name && c.type === ChannelType.GuildCategory);
      
      const ticketNumber = Math.max(0,
        ...interaction.guild.channels.cache
          .filter(c => c.name?.startsWith('ticket-'))
          .map(c => parseInt(c.name.split('-')[1]) || 0)
      ) + 1;

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: parentCategory?.id,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      const ticketState = { ownerTag: interaction.user.tag };
      await client.saveTicketState(ticketChannel.id, ticketState);

      // Log ticket creation
      await client.db.logAction(ticketChannel.id, interaction.user.id, 'ticket_created', `Category: ${category.name}`);

      // Send welcome message
      await ticketChannel.send({
        embeds: [EmbedFactory.welcome()]
      });

      const supportRow = ComponentFactory.createButtonRow(
        ComponentFactory.supportButton()
      );

      if (category.name === 'Giveaways') {
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitConfirm = true;
        await client.saveTicketState(ticketChannel.id, currentState);
        
        await ticketChannel.send({
          embeds: [EmbedFactory.confirmation()],
          components: [supportRow]
        });
      } else {
        await ticketChannel.send({ components: [supportRow] });
      }

      return interaction.reply({
        embeds: [EmbedFactory.success(`Ticket criado com sucesso: ${ticketChannel}`)],
        flags: 64
      });
    }

    // Giveaway Type and Promo Buttons
    if (interaction.isButton() && (interaction.customId.startsWith('gw_type_') || interaction.customId.startsWith('gw_promo_'))) {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      if (ticketState?.awaitConfirm) return;

      if (interaction.customId.startsWith('gw_promo_')) {
        const promoId = interaction.customId.split('_')[2];
        const promo = promos[promoId];
        
        if (!promo || !promo.active || Date.now() > new Date(promo.end)) {
          return interaction.channel.send({
            embeds: [EmbedFactory.error('Esta promoção já terminou ou não está disponível')]
          });
        }

        ticketState.gwType = `promo:${promoId}`;

        if (/todos/i.test(promo.casino) || promo.casino.includes(',')) {
          ticketState.casino = null;
          ticketState.step = 0;
          ticketState.awaitProof = true;
          await client.saveTicketState(interaction.channel.id, ticketState);
          
          await interaction.channel.send({
            embeds: [EmbedFactory.success(`Promoção **${promo.name}** selecionada! Agora escolha o casino.`)]
          });
          return askCasino(interaction.channel);
        }

        const casinoId = findCasinoId(promo.casino);
        if (!casinoId) {
          return interaction.channel.send({
            embeds: [EmbedFactory.error(`Casino **${promo.casino}** não está configurado`)]
          });
        }

        ticketState.casino = casinoId;
        ticketState.step = 0;
        ticketState.awaitProof = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.success(`Promoção **${promo.name}** selecionada para **${casinoId}**`)]
        });
        return askChecklist(interaction.channel, ticketState);
      }

      // Handle fixed giveaway types
      const type = interaction.customId.split('_')[2];
      ticketState.gwType = type;
      if (type === 'gtb') ticketState.prize = 30;
      await client.saveTicketState(interaction.channel.id, ticketState);

      if (type === 'telegram') {
        return interaction.channel.send({
          embeds: [EmbedFactory.info('📱 Envie o **código** + **print** da mensagem do bot Telegram')]
        });
      }
      return askCasino(interaction.channel);
    }

    // Casino Selection
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_casino') {
      try { await interaction.deferUpdate(); } catch {}
      
      const choice = interaction.values[0];
      if (choice === 'none') {
        return interaction.followUp({
          embeds: [EmbedFactory.warning('Por favor, selecione um casino válido')],
          flags: 64
        });
      }

      const ticketState = client.ticketStates.get(interaction.channel.id);
      ticketState.casino = choice;
      ticketState.step = 0;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      return askChecklist(interaction.channel, ticketState);
    }

    // Next Step Button
    if (interaction.isButton() && interaction.customId === 'proof_next') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      if (!ticketState || ticketState.awaitProof) {
        return interaction.followUp({
          embeds: [EmbedFactory.error('Ainda é necessário enviar a prova antes de continuar')],
          flags: 64
        });
      }

      ticketState.step++;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      return askChecklist(interaction.channel, ticketState);
    }

    // Support Button
    if (interaction.isButton() && interaction.customId === 'support_ticket') {
      try { await interaction.deferUpdate(); } catch {}
      
      const staffChannel = await interaction.guild.channels.fetch(CHANNELS.STAFF);
      await staffChannel.send({
        embeds: [EmbedFactory.warning(`${EMOJIS.SHIELD} Suporte solicitado em ${interaction.channel}\nUsuário: ${interaction.user.tag}`)]
      });
      
      // Log support request
      await client.db.logAction(interaction.channel.id, interaction.user.id, 'support_requested', null);
      
      return interaction.followUp({
        embeds: [EmbedFactory.success('Equipe de suporte foi notificada! Aguarde um momento.')],
        flags: 64
      });
    }
  }
};

// Helper Functions
function askCasino(channel) {
  channel.send({
    embeds: [EmbedFactory.casino(
      'Seleção de Casino',
      `${EMOJIS.WARNING} **Importante:** Selecione o casino correto\n${EMOJIS.SHIELD} Sujeito a BAN se não cumprir as regras`
    )],
    components: [ComponentFactory.casinoSelectMenu(CASINOS)]
  });
}

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  if (!casino) {
    return channel.send({
      embeds: [EmbedFactory.error('Casino não configurado no sistema')]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    casino.checklist.length,
    casino.checklist[stepIndex],
    casino.images?.[stepIndex]
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.createButtonRow(ComponentFactory.nextStepButton())]
  });
}