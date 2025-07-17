// events/interactionCreate.js
require('dotenv').config();
const {
  ChannelType, PermissionsBitField,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, InteractionType, AttachmentBuilder
} = require('discord.js');

const CASINOS = require('./casinos');
const { promos, create: createPromo, refreshExpired, refreshPromotions } = require('../utils/promotions');
const { cats, create: createCat, refreshCategories, ensureInitialized } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const TranscriptManager = require('../utils/transcripts');
const { CHANNELS, ROLES, EMOJIS, VIP_TYPES, VIP_CASINOS } = require('../config/constants');
const { updateTicketMessage } = require('../commands/atualizartickets');
const MESSAGES = require('../config/messages');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

const VIP_CHECKLISTS = {
  semanal: [
    "📱 Envia **print do perfil** com ID visível **e** o **ID em texto**",
    "💰 Envia **prints dos depósitos**",
    "💸 Envia **prints dos levantamentos**",
    "🏦 Envia **prints dos cofres**",
    "📥 Envia **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
  ],
  leaderboard: [
    "📱 Envia **print da conta** com ID visível **e** o **ID em texto**",
    "📥 Envia **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
  ]
};

// Category prefixes for ticket naming
const CATEGORY_PREFIXES = {
  'Giveaways': 'G',
  'VIPS': 'V',
  'Dúvidas': 'D',
  'Website': 'W',
  'Outros': 'O'
};

// NOVO: Função para verificar se o usuário tem cargo de verificação para um casino
function isUserVerifiedForCasino(member, casino) {
  const casinoData = CASINOS[casino];
  if (!casinoData || !casinoData.cargoafiliado) return false;
  
  return member.roles.cache.has(casinoData.cargoafiliado);
}

// NOVO: Função para obter todos os casinos para os quais o usuário está verificado
function getUserVerifiedCasinos(member) {
  const verifiedCasinos = [];
  
  for (const [casinoId, casinoData] of Object.entries(CASINOS)) {
    if (casinoData.cargoafiliado && member.roles.cache.has(casinoData.cargoafiliado)) {
      verifiedCasinos.push({
        casino: casinoId,
        label: casinoData.label,
        roleId: casinoData.cargoafiliado
      });
    }
  }
  
  return verifiedCasinos;
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Note: Error handling is now managed by ErrorHandler class in index.js
    // This function is called safely through errorHandler.safeExecuteInteraction()
    
    await refreshExpired();

    // Initialize transcript manager
    const transcriptManager = new TranscriptManager(client.db);

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) {
        // Command execution is handled by ErrorHandler
        return command.execute(interaction, client);
      }
    }

    if (interaction.customId.startsWith('view_transcript_')) {
      // Check if interaction is already processed or expired
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ View transcript interaction already processed, skipping');
        return;
      }

      const interactionAge = Date.now() - interaction.createdTimestamp;
      if (interactionAge > 15 * 60 * 1000) {
        console.warn('⚠️ View transcript interaction too old, skipping');
        return;
      }

      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('Error deferring view transcript interaction:', error);
        return;
      }

      const transcriptId = interaction.customId.replace('view_transcript_', '');
      
      try {
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
      } catch (error) {
        console.error('Error viewing transcript:', error);
        return interaction.editReply({
          embeds: [EmbedFactory.error('Erro ao visualizar transcript')]
        });
      }
    }

    if (interaction.customId.startsWith('download_transcript_')) {
      // Check if interaction is already processed or expired
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ Download transcript interaction already processed, skipping');
        return;
      }

      const interactionAge = Date.now() - interaction.createdTimestamp;
      if (interactionAge > 15 * 60 * 1000) {
        console.warn('⚠️ Download transcript interaction too old, skipping');
        return;
      }

      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('Error deferring download transcript interaction:', error);
        return;
      }

      const transcriptId = interaction.customId.replace('download_transcript_', '');
      
      try {
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          return interaction.editReply({
            embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
          });
        }

        // Create text file attachment
        const { AttachmentBuilder } = require('discord.js');
        const buffer = Buffer.from(transcript.content, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${transcript.channelName}-${transcriptId}.txt`
        });

        return interaction.editReply({
          embeds: [EmbedFactory.success(`Download do transcript **${transcript.channelName}** (ID: \`${transcriptId}\`)`)],
          files: [attachment]
        });
      } catch (error) {
        console.error('Error downloading transcript:', error);
        return interaction.editReply({
          embeds: [EmbedFactory.error('Erro ao fazer download do transcript')]
        });
      }
    }

    // === TRANSCRIPT PAGINATION ===
    if (interaction.customId.startsWith('transcript_user_') && interaction.customId.includes('_page_')) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate();
      }

      try {
        const parts = interaction.customId.split('_');
        const userId = parts[2];
        const page = parseInt(parts[4]);
        const limit = 10;
        const offset = (page - 1) * limit;

        const { transcripts, total } = await client.db.getUserTranscripts(userId, limit, offset);
        const user = await client.users.fetch(userId);
        
        if (transcripts.length === 0) {
          return safeEditReply(interaction, {
            embeds: [EmbedFactory.info('Não há mais transcripts nesta página.', 'Transcripts do Usuário')],
            components: []
          });
        }

        const totalPages = Math.ceil(total / limit);
        const embed = EmbedFactory.userTranscriptsList(user, transcripts, page, totalPages, total);
        const components = ComponentFactory.transcriptPaginationButtons(userId, page, totalPages);

        return safeEditReply(interaction, {
          embeds: [embed],
          components: components.length > 0 ? [components] : []
        });

      } catch (error) {
        console.error('Error in transcript pagination:', error);
        return safeEditReply(interaction, {
          embeds: [EmbedFactory.error('Erro ao carregar página de transcripts')],
          components: []
        });
      }
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
        
        try {
          await updateTicketMessage(interaction.guild, client);
        } catch (error) {
          console.error('Error updating ticket message after promotion creation:', error);
        }
        
        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.COMMANDS.PROMO_CREATED
            .replace('{name}', name)
            .replace('{id}', id))],
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
        
        try {
          await updateTicketMessage(interaction.guild, client);
        } catch (error) {
          console.error('Error updating ticket message after category creation:', error);
        }
        
        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.COMMANDS.CATEGORY_CREATED
            .replace('{name}', name)
            .replace('{id}', id))],
          flags: 64
        });
      }

      // Prize Modal
      if (interaction.customId.startsWith('prize_modal_')) {
        const submissionId = interaction.customId.split('_')[2];
        const prize = interaction.fields.getTextInputValue('prize_value').trim();
        
        const submission = await client.db.getSubmission(submissionId);
        if (!submission) {
          return interaction.reply({
            embeds: [EmbedFactory.error('Submissão não encontrada')],
            flags: 64
          });
        }

        // NOVO: Verificar se o usuário tem cargo de verificação para este casino
        const member = await interaction.guild.members.fetch(submission.userId);
        const isVerified = isUserVerifiedForCasino(member, submission.casino);

        // NOVO: Para BCGame, obter o ID do usuário
        let bcGameId = null;
        if (submission.casino === 'BCGame') {
          const ticketState = client.ticketStates.get(submission.ticketChannelId);
          bcGameId = ticketState?.vipId || ticketState?.bcGameId || null;
        }

        // Create approval
        const approvalId = await client.db.saveApproval(
          submission.ticketChannelId,
          submission.ticketNumber,
          submission.userId,
          submission.userTag,
          submission.casino,
          prize,
          submission.ltcAddress,
          bcGameId
        );

        // Send to approval channel
        const approveChannel = await interaction.guild.channels.fetch(CHANNELS.APPROVE);
        const embed = EmbedFactory.approvalFinal(
          submission.casino,
          prize,
          submission.userTag,
          submission.ticketNumber,
          submission.ltcAddress,
          bcGameId,
          isVerified
        );
        const components = ComponentFactory.approvalButtons(approvalId);

        const approvalMessage = await approveChannel.send({
          embeds: [embed],
          components: [components]
        });

        // Update approval with message info
        await client.db.updateApproval(approvalId, approvalMessage.id, approveChannel.id, 'pending');

        // Update submission status
        await client.db.updateSubmission(submissionId, null, null, 'approved');

        // NOVO: Apagar mensagem de submissão pendente
        try {
          const modChannel = await interaction.guild.channels.fetch(CHANNELS.MOD);
          const messages = await modChannel.messages.fetch({ limit: 50 });
          const submissionMessage = messages.find(m => 
            m.embeds.length > 0 && 
            m.embeds[0].description && 
            m.embeds[0].description.includes(`#${submission.ticketNumber}`)
          );
          
          if (submissionMessage) {
            await submissionMessage.delete();
            console.log(`🗑️ Deleted submission message for ticket #${submission.ticketNumber}`);
          }
        } catch (error) {
          console.error('Error deleting submission message:', error);
        }

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.APPROVED.replace('{prize}', prize))],
          flags: 64
        });
      }

      // Rejection Modal
      if (interaction.customId.startsWith('reject_modal_')) {
        const submissionId = interaction.customId.split('_')[2];
        const reason = interaction.fields.getTextInputValue('reject_reason').trim();
        
        const submission = await client.db.getSubmission(submissionId);
        if (!submission) {
          return interaction.reply({
            embeds: [EmbedFactory.error('Submissão não encontrada')],
            flags: 64
          });
        }

        // Send rejection to ticket
        const ticketChannel = await interaction.guild.channels.fetch(submission.ticketChannelId);
        const embed = EmbedFactory.rejectionReason(reason);
        const components = ComponentFactory.rejectionButtons();

        await ticketChannel.send({
          embeds: [embed],
          components: [components]
        });

        // Update submission status
        await client.db.updateSubmission(submissionId, null, null, 'rejected');

        // NOVO: Apagar mensagem de submissão pendente
        try {
          const modChannel = await interaction.guild.channels.fetch(CHANNELS.MOD);
          const messages = await modChannel.messages.fetch({ limit: 50 });
          const submissionMessage = messages.find(m => 
            m.embeds.length > 0 && 
            m.embeds[0].description && 
            m.embeds[0].description.includes(`#${submission.ticketNumber}`)
          );
          
          if (submissionMessage) {
            await submissionMessage.delete();
            console.log(`🗑️ Deleted submission message for ticket #${submission.ticketNumber}`);
          }
        } catch (error) {
          console.error('Error deleting submission message:', error);
        }

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.REJECTED)],
          flags: 64
        });
      }

      // Review Modal
      if (interaction.customId.startsWith('review_modal_')) {
        const approvalId = interaction.customId.split('_')[2];
        const reason = interaction.fields.getTextInputValue('review_reason').trim();
        
        const approval = await client.db.getApproval(approvalId);
        if (!approval) {
          return interaction.reply({
            embeds: [EmbedFactory.error('Aprovação não encontrada')],
            flags: 64
          });
        }

        // Send to staff channel as support request
        const staffChannel = await interaction.guild.channels.fetch(CHANNELS.STAFF);
        const embed = EmbedFactory.reviewRequest(reason, approval.ticketNumber, approval.userTag);
        const components = ComponentFactory.supportCompletionButton(`review_${approvalId}`);

        const supportMessage = await staffChannel.send({ 
          embeds: [embed],
          components: [components]
        });

        // Update approval status
        await client.db.updateApproval(approvalId, null, null, 'review');

        // Delete original approval message
        try {
          const originalMessage = await interaction.guild.channels.cache.get(approval.channelId)?.messages.fetch(approval.messageId);
          if (originalMessage) await originalMessage.delete();
        } catch (error) {
          console.error('Error deleting original approval message:', error);
        }

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.APPROVALS.REVIEW_SENT)],
          flags: 64
        });
      }
    }

    // Website Type Buttons
    if (interaction.isButton() && (interaction.customId === 'website_bug' || interaction.customId === 'website_redeem')) {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      if (interaction.customId === 'website_bug') {
        ticketState.websiteType = 'bug';
        ticketState.awaitDescription = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.websiteBugReport()],
          components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())]
        });
      }
      
      if (interaction.customId === 'website_redeem') {
        ticketState.websiteType = 'redeem';
        ticketState.awaitTwitchNick = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.websiteRedeemNick()],
          components: [ComponentFactory.createButtonRow(ComponentFactory.supportButton(), ComponentFactory.closeTicketButton())]
        });
      }
    }

    // Redeem Selection Buttons
    if (interaction.isButton() && interaction.customId.startsWith('select_redeem_')) {
      try { await interaction.deferUpdate(); } catch {}
      
      const redeemId = interaction.customId.split('_')[2];
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      // Get redeem details
      const redeem = await client.db.getRedeemById(redeemId);
      if (!redeem) {
        return interaction.followUp({
          embeds: [EmbedFactory.error('Redeem não encontrado')],
          flags: 64
        });
      }
      
      ticketState.selectedRedeem = redeemId;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      // Log redeem selection
      await client.db.logAction(interaction.channel.id, interaction.user.id, 'redeem_selected', `Item: ${redeem.itemName}, ID: ${redeemId}`);
      
      // Notify staff
      const staffChannel = await interaction.guild.channels.fetch(CHANNELS.STAFF);
      const embed = EmbedFactory.warning(
        `**Novo pedido de redeem**\n\n` +
        `🎫 **Ticket:** #${ticketState.ticketNumber}\n` +
        `👤 **Usuário:** ${ticketState.ownerTag}\n` +
        `🎁 **Item:** ${redeem.itemName}\n` +
        `📱 **Twitch:** ${redeem.twitchName}\n` +
        `📅 **Data do Redeem:** ${new Date(redeem.createdAt).toLocaleDateString('pt-PT')}\n\n` +
        `📍 **Canal:** ${interaction.channel}`
      );
      
      await staffChannel.send({ embeds: [embed] });
      
      await interaction.channel.send({
        embeds: [EmbedFactory.websiteRedeemSelected(redeem)],
        components: [ComponentFactory.markRedeemCompleteButton(redeemId)]
      });
    }

    // Mark Redeem Complete Button
    if (interaction.isButton() && interaction.customId.startsWith('mark_redeem_complete_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Você não tem permissão para usar este botão')],
          flags: 64
        });
      }

      const redeemId = interaction.customId.split('_')[3];
      
      // Mark redeem as completed in database
      const success = await client.db.markRedeemAsCompleted(redeemId);
      
      if (success) {
        // Log completion
        await client.db.logAction(interaction.channel.id, interaction.user.id, 'redeem_completed', `Redeem ID: ${redeemId}`);
        
        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.WEBSITE.REDEEM_COMPLETED)],
          flags: 64
        });
      } else {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.WEBSITE.REDEEM_ERROR)],
          flags: 64
        });
      }
    }

    // Close Ticket Menu Button
    if (interaction.isButton() && interaction.customId === 'close_ticket_menu') {
      // Check if interaction is still valid
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ Close ticket menu interaction already processed, skipping');
        return;
      }

      // Criar embed de confirmação
      const embed = EmbedFactory.warning([
        '**Tem a certeza que deseja fechar este ticket?**',
        '',
        '📋 **O ticket será fechado com transcript automático**',
        '💾 **Todas as mensagens serão guardadas por 2 semanas**',
        '🗑️ **O canal será eliminado após criar o transcript**',
        '',
        '⚠️ **Esta ação não pode ser desfeita**'
      ].join('\n'), 'Confirmar Fecho de Ticket');
      
      const components = ComponentFactory.createButtonRow(
        ComponentFactory.createButton('confirm_close_ticket', 'Sim, Fechar Ticket', 'Danger', '✅'),
        ComponentFactory.createButton('cancel_close_ticket', 'Cancelar', 'Secondary', '❌')
      );

      try {
        return await interaction.reply({
          embeds: [embed],
          components: [components],
          flags: 64
        });
      } catch (error) {
        console.error('❌ Failed to reply to close ticket menu:', error);
        // Try to send message to channel as fallback
        try {
          await interaction.channel.send({
            embeds: [embed],
            components: [components]
          });
        } catch (channelError) {
          console.error('❌ Failed to send close ticket menu to channel:', channelError);
        }
      }
    }

    // Confirm close ticket
    if (interaction.isButton() && interaction.customId === 'confirm_close_ticket') {
      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('❌ Failed to defer close ticket interaction:', error);
        // Try to reply normally if defer fails
        try {
          await interaction.reply({
            embeds: [EmbedFactory.warning('A processar pedido de fecho...')],
            flags: 64
          });
        } catch (replyError) {
          console.error('❌ Failed to reply to close ticket interaction:', replyError);
          return; // Give up if both defer and reply fail
        }
      }

      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      try {
        // Always create transcript
        const TranscriptManager = require('../utils/transcripts');
        const transcriptManager = new TranscriptManager(client.db);
        
        const transcriptId = await transcriptManager.generateTranscript(interaction.channel, ticketState);
        
        if (transcriptId) {
          // Send transcript to transcripts channel
          const transcriptsChannel = await interaction.guild.channels.fetch(CHANNELS.TRANSCRIPTS);
          const transcriptEmbed = EmbedFactory.transcriptCreated(
            transcriptId,
            interaction.channel.name,
            ticketState.ticketNumber || 0,
            ticketState.ownerTag,
            ticketState.category || 'unknown'
          );
          const transcriptComponents = ComponentFactory.transcriptButtons(transcriptId);
          
          await transcriptsChannel.send({
            embeds: [transcriptEmbed],
            components: [transcriptComponents]
          });
          
          // Log transcript creation
          await client.db.logAction(interaction.channel.id, interaction.user.id, 'transcript_created', transcriptId);
          
          try {
            await interaction.editReply({
              embeds: [EmbedFactory.success(`Transcript criado com ID: \`${transcriptId}\`\nCanal será eliminado em 10 segundos...`)]
            });
          } catch (editError) {
            console.error('❌ Failed to edit reply, trying followUp:', editError);
            try {
              await interaction.followUp({
                embeds: [EmbedFactory.success(`Transcript criado com ID: \`${transcriptId}\`\nCanal será eliminado em 10 segundos...`)],
                flags: 64
              });
            } catch (followUpError) {
              console.error('❌ Failed to send followUp:', followUpError);
              // Send message to channel as last resort
              await interaction.channel.send({
                embeds: [EmbedFactory.success(`Transcript criado com ID: \`${transcriptId}\`\nCanal será eliminado em 10 segundos...`)]
              });
            }
          }
        } else {
          try {
            await interaction.editReply({
              embeds: [EmbedFactory.warning('Erro ao criar transcript, mas o ticket será fechado mesmo assim.\nCanal será eliminado em 5 segundos...')]
            });
          } catch (editError) {
            console.error('❌ Failed to edit reply for transcript error:', editError);
            await interaction.channel.send({
              embeds: [EmbedFactory.warning('Erro ao criar transcript, mas o ticket será fechado mesmo assim.\nCanal será eliminado em 5 segundos...')]
            });
          }
        }
        
        // Delete ticket state and channel after delay
        setTimeout(async () => {
          try {
            await client.deleteTicketState(interaction.channel.id);
            await interaction.channel.delete();
          } catch (error) {
            console.error('Error deleting ticket channel:', error);
          }
        }, transcriptId ? 10000 : 5000);
        
      } catch (error) {
        console.error('Error closing ticket:', error);
        try {
          await interaction.editReply({
            embeds: [EmbedFactory.error('Erro ao fechar ticket. Tente novamente.')]
          });
        } catch (editError) {
          console.error('❌ Failed to edit reply for error:', editError);
          await interaction.channel.send({
            embeds: [EmbedFactory.error('Erro ao fechar ticket. Tente novamente.')]
          });
        }
      }
      return;
    }

    // Cancel close ticket
    if (interaction.isButton() && interaction.customId === 'cancel_close_ticket') {
      return interaction.reply({
        embeds: [EmbedFactory.info('Fecho de ticket cancelado.')],
        flags: 64 // Ephemeral
      });
    }

    // NOVO: Botão para resolver códigos duplicados
    if (interaction.isButton() && interaction.customId.startsWith('duplicate_resolved_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Você não tem permissão para usar este botão')],
          flags: 64
        });
      }

      const parts = interaction.customId.split('_');
      const currentTicketId = parts[2];
      const originalTicketId = parts[3];

      try {
        // Reativar ambos os tickets
        const currentTicketState = client.ticketStates.get(currentTicketId);
        if (currentTicketState) {
          currentTicketState.awaitingSupport = false;
          await client.saveTicketState(currentTicketId, currentTicketState);
        }

        if (originalTicketId && originalTicketId !== 'undefined') {
          const originalTicketState = client.ticketStates.get(originalTicketId);
          if (originalTicketState) {
            originalTicketState.awaitingSupport = false;
            await client.saveTicketState(originalTicketId, originalTicketState);
          }
        }

        // Notificar ambos os tickets
        const currentChannel = await interaction.guild.channels.fetch(currentTicketId).catch(() => null);
        if (currentChannel) {
          await currentChannel.send({
            embeds: [EmbedFactory.success('✅ **Situação resolvida pelo suporte**\n\nPode continuar com o seu ticket normalmente.')]
          });
        }

        if (originalTicketId && originalTicketId !== 'undefined') {
          const originalChannel = await interaction.guild.channels.fetch(originalTicketId).catch(() => null);
          if (originalChannel) {
            await originalChannel.send({
              embeds: [EmbedFactory.success('✅ **Situação resolvida pelo suporte**\n\nPode continuar com o seu ticket normalmente.')]
            });
          }
        }

        // Delete the alert message
        try {
          await interaction.message.delete();
        } catch (error) {
          console.error('Error deleting duplicate code alert message:', error);
        }

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.DUPLICATE_CODES.SITUATION_RESOLVED)],
          flags: 64
        });

      } catch (error) {
        console.error('Error resolving duplicate code situation:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.DUPLICATE_CODES.RESOLUTION_ERROR)],
          flags: 64
        });
      }
    }

    // Support Completion Button
    if (interaction.isButton() && interaction.customId.startsWith('support_complete_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.PERMISSIONS.NO_PERMISSION)],
          flags: 64
        });
      }

      // Delete the support message
      try {
        await interaction.message.delete();
      } catch (error) {
        console.error('Error deleting support message:', error);
      }

      return interaction.reply({
        embeds: [EmbedFactory.success(MESSAGES.SUPPORT.COMPLETED)],
        flags: 64
      });
    }

    // Transcript View/Download Buttons
    if (interaction.isButton() && (interaction.customId.startsWith('view_transcript_') || interaction.customId.startsWith('download_transcript_'))) {
      const transcriptId = interaction.customId.split('_')[2];
      
      if (interaction.customId.startsWith('view_transcript_')) {
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          return interaction.reply({
            embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.NOT_FOUND)],
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
            embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.NOT_FOUND)],
            flags: 64
          });
        }

        // Create text file attachment
        const buffer = Buffer.from(transcript.content, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${transcript.channelName}-${transcriptId}.txt`
        });

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.TRANSCRIPTS.DOWNLOAD_SUCCESS.replace('{channel}', transcript.channelName))],
          files: [attachment],
          flags: 64
        });
      }
    }

    // Category Buttons (Ticket Creation)
    if (interaction.isButton() && interaction.customId.startsWith('category_')) {
      // Prevent duplicate replies
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ Interaction already replied/deferred, skipping category creation');
        return;
      }
      
      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('Error deferring interaction:', error);
        return;
      }
      
      const categoryId = interaction.customId.slice(9);
      
      await ensureInitialized();
      await refreshCategories();
      
      const category = cats[categoryId] || { name: categoryId, color: 'grey', emoji: null };

      // Get next ticket number for this category
      const ticketNumber = await client.db.getNextTicketNumberForCategory(category.name);

      // Generate ticket name with category prefix
      const prefix = CATEGORY_PREFIXES[category.name] || category.name.toLowerCase();
      const ticketName = `ticket-${prefix}${String(ticketNumber).padStart(4, '0')}`;

      // Find or create category channel with overflow support
      let parentCategory = await findOrCreateCategoryWithOverflow(interaction.guild, category.name);

      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: parentCategory.id,
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

      const ticketState = { 
        ticketNumber,
        ownerTag: interaction.user.tag,
        ownerId: interaction.user.id,
        category: category.name
      };
      await client.saveTicketState(ticketChannel.id, ticketState);

      // Log ticket creation
      await client.db.logAction(ticketChannel.id, interaction.user.id, 'ticket_created', `Category: ${category.name}, Number: ${ticketNumber}`);

      // Send welcome message
      await ticketChannel.send({
        embeds: [EmbedFactory.welcome()]
      });

      const supportRow = ComponentFactory.createButtonRow(
        ComponentFactory.supportButton(),
        ComponentFactory.closeTicketButton()
      );

      // Handle different category types
      if (category.name === 'Giveaways') {
        // SEMPRE mostrar confirmação, independente de ser verificado
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitConfirm = true;
        
        // Verificar se o usuário tem cargos de verificação
        const verifiedCasinos = getUserVerifiedCasinos(interaction.member);
        if (verifiedCasinos.length > 0) {
          currentState.isVerified = true;
        }
        
        await client.saveTicketState(ticketChannel.id, currentState);
        
        await ticketChannel.send({
          embeds: [EmbedFactory.confirmation()],
          components: [supportRow]
        });
      } else if (category.name === 'VIPS') {
        await ticketChannel.send({
          embeds: [EmbedFactory.vipCasinoSelection()],
          components: [ComponentFactory.vipCasinoButtons(), supportRow]
        });
      } else if (category.name === 'Dúvidas') {
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitDescription = true;
        await client.saveTicketState(ticketChannel.id, currentState);
        
        await ticketChannel.send({
          embeds: [EmbedFactory.questionDescription()],
          components: [supportRow]
        });
      } else if (category.name === 'Website') {
        await ticketChannel.send({
          embeds: [EmbedFactory.websiteTypeSelection()],
          components: [ComponentFactory.websiteTypeButtons()]
        });
      } else if (category.name === 'Outros') {
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitDescription = true;
        await client.saveTicketState(ticketChannel.id, currentState);
        
        await ticketChannel.send({
          embeds: [EmbedFactory.otherHelp()],
          components: [supportRow]
        });
      } else {
        await ticketChannel.send({ components: [supportRow] });
      }

      return interaction.editReply({
        embeds: [EmbedFactory.success(MESSAGES.TICKETS.CREATED_SUCCESS
          .replace('{number}', ticketNumber)
          .replace('{channel}', ticketChannel))],
        flags: 64
      });
    }

    // VIP Casino Selection
    if (interaction.isButton() && interaction.customId.startsWith('vip_casino_')) {
      try { await interaction.deferUpdate(); } catch {}
      
      const casinoId = interaction.customId.split('_')[2];
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      ticketState.vipCasino = casinoId;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      await interaction.channel.send({
        embeds: [EmbedFactory.vipTypeSelection()],
        components: [ComponentFactory.vipTypeButtons()]
      });
    }

    // VIP Type Selection
    if (interaction.isButton() && interaction.customId.startsWith('vip_type_')) {
      try { await interaction.deferUpdate(); } catch {}
      
      const vipType = interaction.customId.split('_')[2];
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      ticketState.vipType = vipType;
      ticketState.step = 0;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      await interaction.channel.send({
        embeds: [EmbedFactory.success(MESSAGES.VIP.TYPE_SELECTED
          .replace('{type}', vipType.toUpperCase())
          .replace('{casino}', ticketState.vipCasino))]
      });
      
      return askVipChecklist(interaction.channel, ticketState);
    }

    // Giveaway Type and Promo Buttons
    if (interaction.isButton() && (interaction.customId.startsWith('gw_type_') || interaction.customId.startsWith('gw_promo_'))) {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      if (ticketState?.awaitConfirm) return;

      if (interaction.customId.startsWith('gw_promo_')) {
        await refreshPromotions();
        
        const promoId = interaction.customId.split('_')[2];
        const promo = promos[promoId];
        
        if (!promo || !promo.active || Date.now() > new Date(promo.end)) {
          return interaction.channel.send({
            embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.PROMO_EXPIRED)]
          });
        }

        ticketState.gwType = `promo:${promoId}`;

        if (/todos/i.test(promo.casino) || promo.casino.includes(',')) {
          ticketState.casino = null;
          await client.saveTicketState(interaction.channel.id, ticketState);
          
          await interaction.channel.send({
            embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.PROMO_CHOOSE_CASINO.replace('{name}', promo.name))]
          });
          return askCasino(interaction.channel);
        }

        const casinoId = findCasinoId(promo.casino);
        if (!casinoId) {
          return interaction.channel.send({
            embeds: [EmbedFactory.error(MESSAGES.GIVEAWAYS.CASINO_NOT_CONFIGURED.replace('{casino}', promo.casino))]
          });
        }

        ticketState.casino = casinoId;
        
        // NOVO: Verificar se o usuário tem cargo de verificação para este casino
        const isVerified = isUserVerifiedForCasino(interaction.member, casinoId);
        
        if (isVerified && ticketState.isVerified) {
          // Usuário verificado - pular checklist mas SEMPRE pedir depósito + LTC
          ticketState.awaitProof = false;
          ticketState.awaitLtcOnly = true;
          await client.saveTicketState(interaction.channel.id, ticketState);
          
          await interaction.channel.send({
            embeds: [EmbedFactory.success(`${MESSAGES.GIVEAWAYS.PROMO_SELECTED_CASINO.replace('{name}', promo.name).replace('{casino}', casinoId)}\n\n${MESSAGES.GIVEAWAYS.VERIFIED_USER_SKIP}`)],
            components: [ComponentFactory.finishButtons()]
          });
        } else {
          // Usuário não verificado - processo normal
          ticketState.step = 0;
          ticketState.awaitProof = true;
          await client.saveTicketState(interaction.channel.id, ticketState);
          
          await interaction.channel.send({
            embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.PROMO_SELECTED_CASINO.replace('{name}', promo.name).replace('{casino}', casinoId))]
          });
          return askChecklist(interaction.channel, ticketState);
        }
      }

      // Handle fixed giveaway types
      const type = interaction.customId.split('_')[2];
      ticketState.gwType = type;
      if (type === 'gtb') ticketState.prize = 30;
      await client.saveTicketState(interaction.channel.id, ticketState);

      if (type === 'telegram') {
        return interaction.channel.send({
          embeds: [EmbedFactory.info(MESSAGES.GIVEAWAYS.TELEGRAM_INSTRUCTIONS)]
        });
      }
      
      // NOVO: Para GTB e outros tipos, verificar se o usuário está verificado
      return askCasino(interaction.channel);
    }

    // Casino Selection
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_casino') {
      try { await interaction.deferUpdate(); } catch {}
      
      const choice = interaction.values[0];
      if (choice === 'none') {
        return interaction.followUp({
          embeds: [EmbedFactory.warning(MESSAGES.GIVEAWAYS.CASINO_INVALID_SELECTION)],
          flags: 64
        });
      }

      const ticketState = client.ticketStates.get(interaction.channel.id);
      ticketState.casino = choice;
      
      // NOVO: Verificar se o usuário tem cargo de verificação para este casino
      const isVerified = isUserVerifiedForCasino(interaction.member, choice);
      
      if (isVerified && ticketState.isVerified) {
        // Usuário verificado - pular checklist mas SEMPRE pedir depósito + LTC
        ticketState.awaitProof = false;
        ticketState.awaitLtcOnly = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.success(`${MESSAGES.GIVEAWAYS.CASINO_SELECTED.replace('{casino}', choice)}\n\n${MESSAGES.GIVEAWAYS.VERIFIED_USER_SKIP}`)],
          components: [ComponentFactory.finishButtons()]
        });
      } else {
        // Usuário não verificado - processo normal
        ticketState.step = 0;
        ticketState.awaitProof = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        return askChecklist(interaction.channel, ticketState);
      }
    }

    // Next Step Button - AUTOMÁTICO AGORA
    if (interaction.isButton() && interaction.customId === 'proof_next') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      if (!ticketState || ticketState.awaitProof) {
        return interaction.followUp({
          embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.IMAGE_REQUIRED)],
          flags: 64
        });
      }

      ticketState.step++;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      if (ticketState.vipType) {
        return askVipChecklist(interaction.channel, ticketState);
      } else {
        return askChecklist(interaction.channel, ticketState);
      }
    }

    // Finish Button
    if (interaction.isButton() && interaction.customId === 'finish_ticket') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      // Create submission
      const submissionId = await client.db.saveSubmission(
        interaction.channel.id,
        ticketState.ticketNumber,
        ticketState.ownerId,
        ticketState.ownerTag,
        ticketState.gwType || ticketState.vipType || 'unknown',
        ticketState.casino || ticketState.vipCasino,
        ticketState.prize,
        ticketState.ltcAddress,
        ticketState.bcGameId
      );

      // Send to mod channel
      const modChannel = await interaction.guild.channels.fetch(CHANNELS.MOD);
      const embed = EmbedFactory.submissionReady(ticketState.ticketNumber, ticketState.ownerTag, interaction.channel.id);
      const components = ComponentFactory.submissionButtons(interaction.channel.id, ticketState.ticketNumber);

      await modChannel.send({
        embeds: [embed],
        components: [components]
      });

      // Update submission with message info
      await client.db.updateSubmission(submissionId, null, modChannel.id, 'pending');
      
      // Send mod buttons to the ticket itself
      const modButtons = ComponentFactory.modButtons(submissionId);
      await interaction.channel.send({
        embeds: [EmbedFactory.info(MESSAGES.GIVEAWAYS.SUBMISSION_SENT)],
        components: [modButtons]
      });
    }

    // Mod Approve Button
    if (interaction.isButton() && interaction.customId.startsWith('mod_approve_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.PERMISSIONS.NO_PERMISSION)],
          flags: 64
        });
      }

      const submissionId = interaction.customId.split('_')[2];
      
      // Show prize modal
      const modal = new ModalBuilder()
        .setCustomId(`prize_modal_${submissionId}`)
        .setTitle(`💰 ${MESSAGES.LABELS.PRIZE_VALUE}`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('prize_value')
              .setLabel(MESSAGES.LABELS.PRIZE_VALUE)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder(MESSAGES.PLACEHOLDERS.PRIZE_VALUE)
              .setRequired(true)
          )
        );
      
      return interaction.showModal(modal);
    }

    // Mod Reject Button
    if (interaction.isButton() && interaction.customId.startsWith('mod_reject_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.PERMISSIONS.NO_PERMISSION)],
          flags: 64
        });
      }

      const submissionId = interaction.customId.split('_')[2];
      
      // Show rejection modal
      const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${submissionId}`)
        .setTitle(`❌ ${MESSAGES.LABELS.REJECT_REASON}`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reject_reason')
              .setLabel(MESSAGES.LABELS.REJECT_REASON)
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder(MESSAGES.PLACEHOLDERS.REJECT_REASON)
              .setRequired(true)
          )
        );
      
      return interaction.showModal(modal);
    }

    // Approval Buttons
    if (interaction.isButton() && interaction.customId.startsWith('approval_')) {
      const action = interaction.customId.split('_')[1];
      const approvalId = interaction.customId.split('_')[2];
      
      const approval = await client.db.getApproval(approvalId);
      if (!approval) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Aprovação não encontrada')],
          flags: 64
        });
      }

      if (action === 'goto') {
        // Redirect to ticket
        return interaction.reply({
          content: `🎫 **${MESSAGES.BUTTONS.GOTO_TICKET} #${approval.ticketNumber}:** <#${approval.ticketChannelId}>`,
          flags: 64
        });
      }

      if (action === 'paid') {
        // Mark as paid and send message to ticket
        const ticketChannel = await interaction.guild.channels.fetch(approval.ticketChannelId);
        await ticketChannel.send({
          embeds: [EmbedFactory.giveawayPaid()]
        });

        // Update approval status
        await client.db.updateApproval(approvalId, null, null, 'paid');

        // NOVO: Adicionar cargo de verificação para o usuário
        if (approval.casino && CASINOS[approval.casino]) {
          const casino = CASINOS[approval.casino];
          const roleId = casino.cargoafiliado;
          
          try {
            // Adicionar cargo ao usuário
            const member = await interaction.guild.members.fetch(approval.userId);
            if (member && roleId) {
              await member.roles.add(roleId);
              console.log(`✅ Added verification role ${roleId} to user ${approval.userTag} for casino ${approval.casino}`);
            }
          } catch (error) {
            console.error('Error adding verification role:', error);
          }
        }

        // Delete approval message
        try {
          await interaction.message.delete();
        } catch (error) {
          console.error('Error deleting approval message:', error);
        }

        return interaction.reply({
          embeds: [EmbedFactory.success(MESSAGES.GIVEAWAYS.PAID
            .replace('{number}', approval.ticketNumber)
            .replace('{casino}', approval.casino))],
          flags: 64
        });
      }

      if (action === 'review') {
        // Show review modal
        const modal = new ModalBuilder()
          .setCustomId(`review_modal_${approvalId}`)
          .setTitle(`🔍 ${MESSAGES.LABELS.REVIEW_REASON}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('review_reason')
                .setLabel(MESSAGES.LABELS.REVIEW_REASON)
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(MESSAGES.PLACEHOLDERS.REVIEW_REASON)
                .setRequired(true)
            )
          );
        
        return interaction.showModal(modal);
      }
    }

    // Rejection Resubmit Button
    if (interaction.isButton() && interaction.customId === 'rejection_resubmit') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      // Reset ticket state for resubmission
      ticketState.step = 0;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      await interaction.channel.send({
        embeds: [EmbedFactory.success(MESSAGES.CHECKLIST.RESUBMIT_STARTED)]
      });
      
      if (ticketState.vipType) {
        return askVipChecklist(interaction.channel, ticketState);
      } else if (ticketState.casino) {
        return askChecklist(interaction.channel, ticketState);
      } else {
        return askCasino(interaction.channel);
      }
    }

    // Support Button
    if (interaction.isButton() && interaction.customId === 'support_ticket') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      const staffChannel = await interaction.guild.channels.fetch(CHANNELS.STAFF);
      
      const embed = EmbedFactory.supportRequest(
        MESSAGES.SUPPORT.REQUEST_TITLE,
        ticketState?.ticketNumber || 'N/A',
        interaction.user.tag,
        interaction.channel.id
      );
      const components = ComponentFactory.supportCompletionButton(`general_${interaction.channel.id}`);
      
      await staffChannel.send({
        embeds: [embed],
        components: [components]
      });
      
      // Log support request
      await client.db.logAction(interaction.channel.id, interaction.user.id, 'support_requested', null);
      
      return interaction.followUp({
        embeds: [EmbedFactory.success(MESSAGES.SUPPORT.TEAM_NOTIFIED)],
        flags: 64
      });
    }
  }
};

// Helper function to find or create category with overflow support
async function findOrCreateCategoryWithOverflow(guild, categoryName) {
  // Find all categories with this base name (including numbered ones)
  const existingCategories = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildCategory)
    .filter(c => {
      const name = c.name.toLowerCase();
      return name === categoryName.toLowerCase() || 
             name.startsWith(categoryName.toLowerCase() + ' ');
    })
    .sort((a, b) => {
      // Sort by number (Giveaways, Giveaways 2, Giveaways 3, etc.)
      const aNum = extractCategoryNumber(a.name, categoryName);
      const bNum = extractCategoryNumber(b.name, categoryName);
      return aNum - bNum;
    });

  // Check each category for available space (Discord limit is 50 channels per category)
  for (const category of existingCategories.values()) {
    const channelCount = guild.channels.cache
      .filter(c => c.parentId === category.id)
      .size;
    
    if (channelCount < 50) {
      console.log(`✅ Using existing category: ${category.name} (${channelCount}/50 channels)`);
      return category;
    }
  }

  // All categories are full, create a new one
  const nextNumber = existingCategories.size + 1;
  const newCategoryName = nextNumber === 1 ? categoryName : `${categoryName} ${nextNumber}`;
  
  console.log(`📁 Creating new category: ${newCategoryName} (overflow from full categories)`);
  
  const newCategory = await guild.channels.create({
    name: newCategoryName,
    type: ChannelType.GuildCategory
  });

  return newCategory;
}

// Helper function to extract number from category name
function extractCategoryNumber(categoryName, baseName) {
  const name = categoryName.toLowerCase();
  const base = baseName.toLowerCase();
  
  if (name === base) {
    return 1; // Base category is number 1
  }
  
  const match = name.match(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`));
  return match ? parseInt(match[1]) : 999; // Unknown format goes to end
}

// Helper Functions
function askCasino(channel) {
  channel.send({
    embeds: [EmbedFactory.casino(
      MESSAGES.GIVEAWAYS.CASINO_SELECTION_TITLE,
      MESSAGES.GIVEAWAYS.CASINO_SELECTION_DESCRIPTION
    )],
    components: [ComponentFactory.casinoSelectMenu(CASINOS)]
  });
}

function askChecklist(channel, ticketState) {
  const casino = CASINOS[ticketState.casino];
  if (!casino) {
    return channel.send({
      embeds: [EmbedFactory.error(MESSAGES.ERRORS.CASINO_NOT_CONFIGURED)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  // NOVO: Para BCGame, modificar o primeiro passo para incluir ID
  let checklist = [...casino.checklist];
  if (ticketState.casino === 'BCGame' && stepIndex === 0) {
    checklist[0] = MESSAGES.CHECKLIST.BCGAME_STEP1;
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    checklist.length,
    checklist[stepIndex],
    casino.images?.[stepIndex]
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.stepButtons()]
  });
}

function askVipChecklist(channel, ticketState) {
  const checklist = VIP_CHECKLISTS[ticketState.vipType];
  if (!checklist) {
    return channel.send({
      embeds: [EmbedFactory.error(MESSAGES.VIP.TYPE_NOT_CONFIGURED)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  if (stepIndex >= checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success(MESSAGES.VIP.COMPLETED)],
      components: [ComponentFactory.finishButtons()]
    });
  }

  const embed = EmbedFactory.vipChecklist(
    stepIndex + 1,
    checklist.length,
    checklist[stepIndex],
    ticketState.vipType
  );

  channel.send({
    embeds: [embed],
    components: [ComponentFactory.stepButtons()]
  });
}