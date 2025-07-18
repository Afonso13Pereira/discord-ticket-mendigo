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
const { CHANNELS, ROLES, EMOJIS } = require('../config/constants');
const VIPS = require('./vips');
const { updateTicketMessage } = require('../commands/atualizartickets');
const MESSAGES = require('../config/messages');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

// VIP_CHECKLISTS removido - agora carregado dinamicamente de events/vips/

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

    // Add this at the start of the execute function to log all interactions
    console.log('[Interaction]', {
      type: interaction.type,
      customId: interaction.customId,
      commandName: interaction.commandName,
      user: interaction.user?.tag,
      userId: interaction.user?.id,
      createdTimestamp: interaction.createdTimestamp,
    });

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) {
        // Command execution is handled by ErrorHandler
        return command.execute(interaction, client);
      }
    }

    // === TRANSCRIPT PAGINATION ===
    if (interaction.customId.startsWith('transcript_user_') && interaction.customId.includes('_page_')) {
      // Verificar se já foi processado
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ Transcript pagination already processed');
        return;
      }

      try {
        await interaction.deferUpdate();
      } catch (error) {
        console.error('Error deferring transcript pagination:', error);
        return;
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

        return interaction.editReply({
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
        console.log('[APPROVAL][SUBMIT] ltcAddress:', submission.ltcAddress);
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
        console.log('[APPROVAL][criação] approvalId para botões:', approvalId);

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
        await client.db.updateApproval(approvalId, 'pending');

        // Update submission status
        await client.db.updateSubmission(submissionId, 'approved');

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
        await client.db.updateSubmission(submissionId, 'rejected');

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
        const otherChannel = await interaction.guild.channels.fetch(CHANNELS.OTHER).catch(() => null);
        if (otherChannel && otherChannel.send) {
          const embed = EmbedFactory.reviewRequest(reason, approval.ticketNumber, approval.userTag);
          const components = ComponentFactory.supportCompletionButton(`review_${approvalId}`);

          const supportMessage = await otherChannel.send({ 
            embeds: [embed],
            components: [components]
          });
        } else {
          console.error('❌ OTHER_CHANNEL_ID not found, invalid, or not a text channel');
        }

        // Update approval status
        await client.db.updateApproval(approvalId, 'review');

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
      const redeemsChannel = await interaction.guild.channels.fetch(CHANNELS.REDEEMS).catch(() => null);
      if (redeemsChannel && redeemsChannel.send) {
        const embed = EmbedFactory.warning(
          `**Novo pedido de redeem**\n\n` +
          `🎫 **Ticket:** #${ticketState.ticketNumber}\n` +
          `👤 **Usuário:** ${ticketState.ownerTag}\n` +
          `🎁 **Item:** ${redeem.itemName}\n` +
          `📱 **Twitch:** ${redeem.twitchName}\n` +
          `📅 **Data do Redeem:** ${new Date(redeem.createdAt).toLocaleDateString('pt-PT')}\n\n` +
          `📍 **Canal:** ${interaction.channel}`
        );
        
        await redeemsChannel.send({ embeds: [embed] });
      } else {
        console.error('❌ REDEEMS_CHANNEL_ID not found, invalid, or not a text channel');
      }
      
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

    // View transcript button
    if (interaction.isButton() && interaction.customId.startsWith('view_transcript_')) {
      try {
        // Verificar se a interação já foi processada ou expirou
        if (interaction.replied || interaction.deferred) {
          console.warn('⚠️ View transcript interaction already processed, skipping');
          return;
        }

        // Verificar idade da interação (máximo 2 minutos para botões)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 2 * 60 * 1000) {
          console.warn('⚠️ View transcript interaction too old, skipping');
          return;
        }

        // Tentar defer com timeout
        const deferPromise = interaction.deferReply({ flags: 64 });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Defer timeout')), 2000)
        );
        
        await Promise.race([deferPromise, timeoutPromise]);
        
        const transcriptId = interaction.customId.replace('view_transcript_', '');
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          await interaction.editReply({
            embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
          });
          return;
        }

        const embed = EmbedFactory.transcriptView(transcript);
        const components = ComponentFactory.transcriptButtons(transcriptId);

        await interaction.editReply({
          embeds: [embed],
          components: [components]
        });
      } catch (error) {
        console.error('Error in view transcript interaction:', error);
        
        // Tentar responder com erro se ainda for possível
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              embeds: [EmbedFactory.error('Erro ao visualizar transcript - interação expirou')],
              flags: 64
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              embeds: [EmbedFactory.error('Erro ao visualizar transcript')]
            });
          }
        } catch (replyError) {
          console.error('Failed to send error message for view transcript:', replyError);
        }
      }
      return;
    }

    // Download transcript button
    if (interaction.isButton() && interaction.customId.startsWith('download_transcript_')) {
      try {
        // Verificar se a interação já foi processada ou expirou
        if (interaction.replied || interaction.deferred) {
          console.warn('⚠️ Download transcript interaction already processed, skipping');
          return;
        }

        // Verificar idade da interação (máximo 2 minutos para botões)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 2 * 60 * 1000) {
          console.warn('⚠️ Download transcript interaction too old, skipping');
          return;
        }

        // Tentar defer com timeout
        const deferPromise = interaction.deferReply({ flags: 64 });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Defer timeout')), 2000)
        );
        
        await Promise.race([deferPromise, timeoutPromise]);
        
        const transcriptId = interaction.customId.replace('download_transcript_', '');
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          await interaction.editReply({
            embeds: [EmbedFactory.error('Transcript não encontrado ou expirado')]
          });
          return;
        }

        // Create text file attachment
        const buffer = Buffer.from(transcript.content, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${transcript.channelName}-${transcriptId}.txt`
        });

        await interaction.editReply({
          embeds: [EmbedFactory.success(`Download do transcript **${transcript.channelName}** (ID: \`${transcriptId}\`)`)],
          files: [attachment]
        });

      } catch (error) {
        console.error('Error in download transcript interaction:', error);
        
        // Tentar responder com erro se ainda for possível
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              embeds: [EmbedFactory.error('Erro ao fazer download - interação expirou')],
              flags: 64
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              embeds: [EmbedFactory.error('Erro ao fazer download do transcript')]
            });
          }
        } catch (replyError) {
          console.error('Failed to send error message for download transcript:', replyError);
        }
      }
      return;
    }

    // Transcript View/Download Buttons
    if (interaction.isButton() && (interaction.customId.startsWith('view_transcript_') || interaction.customId.startsWith('download_transcript_'))) {
      // Verificar se já foi processado
      if (interaction.replied || interaction.deferred) {
        console.warn('⚠️ Transcript action already processed');
        return;
      }

      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('Error deferring transcript action:', error);
        return;
      }

      const transcriptId = interaction.customId.split('_')[2];
      
      if (interaction.customId.startsWith('view_transcript_')) {
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          return interaction.editReply({
            embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.NOT_FOUND)]
          });
        }

        const embed = EmbedFactory.transcriptView(transcript);
        
        return interaction.editReply({
          embeds: [embed],
          flags: 64
        });
      }

      if (interaction.customId.startsWith('download_transcript_')) {
        const transcript = await client.db.getTranscript(transcriptId);
        
        if (!transcript) {
          return interaction.editReply({
            embeds: [EmbedFactory.error(MESSAGES.TRANSCRIPTS.NOT_FOUND)]
          });
        }

        // Create text file attachment
        const buffer = Buffer.from(transcript.content, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${transcript.channelName}-${transcriptId}.txt`
        });

        return interaction.editReply({
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
      // Defer immediately to avoid interaction expiration
      try {
        await interaction.deferReply({ flags: 64 });
      } catch (error) {
        console.error('Error deferring interaction:', error);
        return;
      }
      
      // Now do all other async work:
      await ensureInitialized();
      await refreshCategories();
      
      const categoryId = interaction.customId.slice(9);
      
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
          embeds: [EmbedFactory.vipTypeSelection()],
          components: [ComponentFactory.vipTypeButtons(), supportRow]
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
      ticketState.step = 0;
      ticketState.awaitProof = true;
      await client.saveTicketState(interaction.channel.id, ticketState);
      
      await interaction.channel.send({
        embeds: [EmbedFactory.success(MESSAGES.VIP.TYPE_SELECTED
          .replace('{type}', ticketState.vipType.toUpperCase())
          .replace('{casino}', casinoId))]
      });
      
      return askVipChecklist(interaction.channel, ticketState);
    }

    // VIP Type Selection
    if (interaction.isButton() && interaction.customId.startsWith('vip_type_')) {
      try { await interaction.deferUpdate(); } catch {}
      
      const vipType = interaction.customId.split('_')[2];
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      ticketState.vipType = vipType;
      await client.saveTicketState(interaction.channel.id, ticketState);

      // NOVO: Deletar a última mensagem de seleção de tipo de VIP
      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const lastVipTypeMsg = messages.find(m => m.author.id === interaction.client.user.id && m.embeds?.[0]?.title === '💎 Tipo de VIP');
      if (lastVipTypeMsg) {
        try { await lastVipTypeMsg.delete(); } catch (e) { console.error('Erro ao deletar mensagem de seleção de tipo de VIP:', e); }
      }
      
      // NOVO: Verificar se há apenas 1 casino disponível para este VIP
      const vip = VIPS[vipType];
      if (vip && vip.casinos && vip.casinos.length === 1) {
        // Apenas 1 casino disponível - selecionar automaticamente
        const casinoId = vip.casinos[0];
        ticketState.vipCasino = casinoId;
        ticketState.step = 0;
        ticketState.awaitProof = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.success(MESSAGES.VIP.TYPE_SELECTED
            .replace('{type}', vipType.toUpperCase())
            .replace('{casino}', casinoId))]
        });
        
        return askVipChecklist(interaction.channel, ticketState);
      } else {
        // Múltiplos casinos - mostrar seleção
        await interaction.channel.send({
          embeds: [EmbedFactory.vipCasinoSelection()],
          components: [ComponentFactory.vipCasinoButtons(vipType)]
        });
      }
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
      // NOVO: Se estiver aguardando seleção filtrada, só permitir allowedCasinos
      if (ticketState.awaitingCasinoSelection && Array.isArray(ticketState.allowedCasinos)) {
        if (!ticketState.allowedCasinos.includes(choice)) {
          return interaction.followUp({
            embeds: [EmbedFactory.error('Seleção de casino inválida para este ticket.')],
            flags: 64
          });
        }
        // Limpar flags de seleção após escolha
        ticketState.awaitingCasinoSelection = false;
        ticketState.allowedCasinos = undefined;
      }
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
      console.log(interaction);
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      console.log(ticketState);
   
      // Handle VIP tickets differently
      if (ticketState.vipType) {
        console.log('🔍 VIP Next Step - Step:', ticketState.step, 'VIP Type:', ticketState.vipType);
        
        const vip = VIPS[ticketState.vipType];
        if (!vip || !vip.checklist) {
          return interaction.followUp({
            embeds: [EmbedFactory.error(`VIP type '${ticketState.vipType}' não configurado corretamente`)],
            flags: 64
          });
        }

        const stepIndex = ticketState.step;
        const currentStep = vip.checklist[stepIndex];
        console.log('🔍 VIP Current step:', currentStep);
        
        // Check if current step requires any input
        let stepTypes = [];
        if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
          stepTypes = currentStep.type;
        }
        console.log('🔍 VIP Step types:', stepTypes);

        // If step has no requirements (empty type array), advance automatically
        if (stepTypes.length === 0) {
          console.log('✅ VIP Step has no requirements, advancing...');
          ticketState.step++;
          ticketState.awaitProof = true;
          await client.saveTicketState(interaction.channel.id, ticketState);
          return askVipChecklist(interaction.channel, ticketState);
        } else {
          // Step requires input, show error
          console.log('❌ VIP Step requires input, showing error');
          return interaction.followUp({
            embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.IMAGE_REQUIRED)],
            flags: 64
          });
        }
      }

      // For regular casino tickets, check if current step requires any input
      const casino = CASINOS[ticketState.casino];
      if (!casino || !casino.checklist) {
        return interaction.followUp({
          embeds: [EmbedFactory.error('Casino não configurado corretamente')],
          flags: 64
        });
      }

      const stepIndex = ticketState.step;
      const currentStep = casino.checklist[stepIndex];
      
      let stepTypes = [];
      if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
        stepTypes = currentStep.type;
      }

      // If step has no requirements (empty type array), advance automatically
      if (stepTypes.length === 0) {
        ticketState.step++;
        ticketState.awaitProof = true;
        await client.saveTicketState(interaction.channel.id, ticketState);
        return askChecklist(interaction.channel, ticketState);
      } else {
        // Step requires input, show error
        return interaction.followUp({
          embeds: [EmbedFactory.error(MESSAGES.CHECKLIST.IMAGE_REQUIRED)],
          flags: 64
        });
      }
    }

    // Finish Button
    if (interaction.isButton() && interaction.customId === 'finish_ticket') {
      try { await interaction.deferUpdate(); } catch {}
      
      const ticketState = client.ticketStates.get(interaction.channel.id);
      
      // Garante que ltcAddress será preenchido no momento da submissão
      if (
        ticketState &&
        ticketState.casino &&
        CASINOS[ticketState.casino]
      ) {
        const casino = CASINOS[ticketState.casino];
        const lastStepIndex = casino.checklist.length - 1;
        const lastStep = casino.checklist[lastStepIndex];
        if (
          Array.isArray(lastStep.type) &&
          lastStep.type.includes('text') &&
          ticketState.stepData &&
          ticketState.stepData[lastStepIndex] &&
          ticketState.stepData[lastStepIndex].textContent
        ) {
          console.log('[FINALIZAR][LTC] Copiando LTC na submissão:', ticketState.stepData[lastStepIndex].textContent);
          ticketState.ltcAddress = ticketState.stepData[lastStepIndex].textContent;
          await client.saveTicketState(interaction.channel.id, ticketState);
      // Debug: Log do estado completo do ticket
      console.log('[FINISH][DEBUG] Estado completo do ticket:', JSON.stringify(ticketState, null, 2));
      console.log('[FINISH][DEBUG] ltcAddress no estado:', ticketState.ltcAddress);
      
      // DEBUG: Log completo do estado do ticket
      console.log('[FINISH_TICKET][DEBUG] Estado completo do ticket:', JSON.stringify(ticketState, null, 2));
      console.log('[FINISH_TICKET][DEBUG] ltcAddress no estado:', ticketState.ltcAddress);
      console.log('[FINISH_TICKET][DEBUG] Tipo do ltcAddress:', typeof ticketState.ltcAddress);

        }
      }

      // Create submission
      // DEBUG: Estado completo do ticket
      console.log('[FINISH][DEBUG] Estado completo do ticket:', JSON.stringify(ticketState, null, 2));
      console.log('[FINISH][DEBUG] ltcAddress no estado:', ticketState.ltcAddress);
      console.log('[FINISH][DEBUG] Tipo do ltcAddress:', typeof ticketState.ltcAddress);
      console.log('[FINISH_TICKET][START] Estado completo do ticket:', JSON.stringify(ticketState, null, 2));
      console.log('[FINISH_TICKET][START] ltcAddress inicial:', ticketState.ltcAddress);
      let finalLtcAddress = ticketState.ltcAddress;
      // CRÍTICO: Garantir que temos ltcAddress antes de continuar
      // Se não tem ltcAddress, tentar buscar nos stepData
        console.log('[FINISH_TICKET][SEARCH] ltcAddress não definido, buscando nos stepData...');
        
        // Primeiro: buscar por formato válido de LTC
        for (const [stepIdx, stepData] of Object.entries(ticketState.stepData)) {
          if (stepData.textContent && stepData.textContent.trim().length >= 10) {
            const potentialLtc = stepData.textContent.trim();
            console.log('[FINISH][DEBUG] Texto encontrado no passo', stepIdx, ':', potentialLtc);
            
              finalLtcAddress = potentialLtc;
              console.log('[FINISH][DEBUG] LTC encontrado nos stepData:', finalLtcAddress);
              await client.saveTicketState(interaction.channel.id, ticketState);
              break;
              console.log(`[FINISH_TICKET][SEARCH] LTC válido encontrado no passo ${stepIdx}:`, text);
              // Fallback: qualquer texto longo pode ser LTC
              finalLtcAddress = potentialLtc;
            }
          }
        }
        
        // Segundo: se não encontrou formato válido, usar qualquer texto longo
        if (!ticketState.ltcAddress) {
          for (const [stepIdx, stepData] of Object.entries(ticketState.stepData)) {
            if (stepData.textContent && stepData.textContent.trim().length >= 10) {
              const text = stepData.textContent.trim();
              // Salvar no estado
              console.log(`[FINISH_TICKET][SEARCH] LTC fallback encontrado no passo ${stepIdx}:`, text);
              await client.saveTicketState(interaction.channel.id, ticketState);
              break;
            }
          }
        }
      }
      
        finalLtcAddress = 'N/A - Não fornecido';
        console.log('[FINISH][DEBUG] Usando valor padrão para LTC');
      // CRÍTICO: Verificar se conseguimos obter ltcAddress
      console.log('[FINISH_TICKET][FINAL] ltcAddress após busca:', ticketState.ltcAddress);
      
      // Se ainda não temos ltcAddress, usar valor padrão informativo
      if (!ticketState.ltcAddress) {
        ticketState.ltcAddress = "N/A - Endereço não fornecido";
        await client.saveTicketState(interaction.channel.id, ticketState);
        console.log('[FINISH_TICKET][FINAL] Usando valor padrão para ltcAddress');
      }
      
      // Verificar estado final antes de criar submission
      const finalState = await client.db.getTicketState(interaction.channel.id);
      console.log('[FINISH_TICKET][DB_CHECK] Estado final na DB:', finalState?.ltcAddress);

      const submissionId = await client.db.saveSubmission(
        interaction.channel.id,
        ticketState.ticketNumber,
        ticketState.ownerId,
        ticketState.ownerTag,
        ticketState.gwType || ticketState.vipType || 'unknown',
        ticketState.casino || ticketState.vipCasino,
        ticketState.ltcAddress,
        ticketState.ltcAddress,
        ticketState.bcGameId
      );

      console.log('[FINISH_TICKET][DEBUG] Submission criada com ID:', submissionId);
      console.log('[FINISH_TICKET][DEBUG] ltcAddress enviado para DB:', ticketState.ltcAddress);
      console.log('[FINISH][DEBUG] Submission criada com ID:', submissionId);
      console.log('[FINISH][DEBUG] ltcAddress enviado para DB:', finalLtcAddress);
      
      // Send to mod channel
      const modChannel = await interaction.guild.channels.fetch(CHANNELS.MOD);
      const embed = EmbedFactory.submissionReady(ticketState.ticketNumber, ticketState.ownerTag, interaction.channel.id);
      const components = ComponentFactory.submissionButtons(interaction.channel.id, ticketState.ticketNumber);

      await modChannel.send({
        embeds: [embed],
        components: [components]
      });

      // Update submission with message info
      await client.db.updateSubmission(submissionId, 'pending');
      
      // Send mod buttons to the ticket itself
      const modButtons = ComponentFactory.modButtons(submissionId);
      await interaction.channel.send({
        embeds: [EmbedFactory.info(MESSAGES.GIVEAWAYS.SUBMISSION_SENT)],
        components: [modButtons]
      });
    }

    // === MOD BUTTONS ===
    if (interaction.customId.startsWith('mod_')) {
      const [action, submissionId] = interaction.customId.split('_').slice(1);
      
      console.log(`[MOD][${action.toUpperCase()}] Looking for submissionId:`, submissionId);
      
      const submission = await client.db.getSubmission(submissionId);
      if (!submission) {
        console.log(`[MOD][${action.toUpperCase()}] Submission not found:`, submissionId);
        return interaction.reply({
          embeds: [EmbedFactory.error('Submissão não encontrada')],
          flags: 64
        });
      }
      
      console.log(`[MOD][${action.toUpperCase()}] Found submission:`, submission.submissionId);

      if (action === 'approve') {
        // Check if user has mod role
        if (!interaction.member.roles.cache.has(ROLES.MOD)) {
          return interaction.reply({
            embeds: [EmbedFactory.error(MESSAGES.PERMISSIONS.NO_PERMISSION)],
            flags: 64
          });
        }

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

      if (action === 'reject') {
        // Check if user has mod role
        if (!interaction.member.roles.cache.has(ROLES.MOD)) {
          return interaction.reply({
            embeds: [EmbedFactory.error(MESSAGES.PERMISSIONS.NO_PERMISSION)],
            flags: 64
          });
        }

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
    }

    // Approval Buttons
    if (interaction.isButton() && interaction.customId.startsWith('approval_')) {
      // Corrigido: suporta approvalId com underscores
      const [_, action, ...approvalIdParts] = interaction.customId.split('_');
      const approvalId = approvalIdParts.join('_');
      
      console.log(`[APPROVAL][${action.toUpperCase()}] Looking for approvalId:`, approvalId);
      
      const approval = await client.db.getApproval(approvalId);
      if (!approval) {
        console.log(`[APPROVAL][${action.toUpperCase()}] Approval not found:`, approvalId);
        return interaction.reply({
          embeds: [EmbedFactory.error('Aprovação não encontrada')],
          flags: 64
        });
      }
      
      console.log(`[APPROVAL][${action.toUpperCase()}] Found approval:`, approval.approvalId);

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
        await client.db.updateApproval(approvalId, 'paid');

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
      
      // Determine which channel to use based on ticket type
      let targetChannel;
      let channelName;
      
      if (ticketState?.gwType || ticketState?.casino || ticketState?.category === 'Giveaways') {
        // Giveaway-related ticket - use GIVEAWAYSHELP channel
        targetChannel = await interaction.guild.channels.fetch(CHANNELS.GIVEAWAYSHELP).catch(() => null);
        channelName = 'GIVEAWAYSHELP_CHANNEL_ID';
      } else if (ticketState?.category === 'Website' && ticketState?.websiteType === 'redeem') {
        // Website redeem ticket - use REDEEMS channel
        targetChannel = await interaction.guild.channels.fetch(CHANNELS.REDEEMS).catch(() => null);
        channelName = 'REDEEMS_CHANNEL_ID';
      } else if (ticketState?.category === 'Website' && ticketState?.websiteType === 'bug') {
        // Website bug ticket - use OTHER channel
        targetChannel = await interaction.guild.channels.fetch(CHANNELS.OTHER).catch(() => null);
        channelName = 'OTHER_CHANNEL_ID';
      } else if (ticketState?.category === 'Dúvidas') {
        // Questions ticket - use AJUDAS channel
        targetChannel = await interaction.guild.channels.fetch(CHANNELS.AJUDAS).catch(() => null);
        channelName = 'AJUDAS_CHANNEL_ID';
      } else {
        // Other ticket types - use OTHER channel
        targetChannel = await interaction.guild.channels.fetch(CHANNELS.OTHER).catch(() => null);
        channelName = 'OTHER_CHANNEL_ID';
      }
      
      if (targetChannel && targetChannel.send) {
        const embed = EmbedFactory.supportRequest(
          MESSAGES.SUPPORT.REQUEST_TITLE,
          ticketState?.ticketNumber || 'N/A',
          interaction.user.tag,
          interaction.channel.id
        );
        const components = ComponentFactory.supportCompletionButton(`general_${interaction.channel.id}`);
        
        await targetChannel.send({
          embeds: [embed],
          components: [components]
        });
      } else {
        console.error(`❌ ${channelName} not found, invalid, or not a text channel`);
      }
      
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
  
  // NOVO: Handle new checklist structure (objects with title, description, type, image)
  let stepDescription, stepImage;
  if (typeof casino.checklist[stepIndex] === 'object' && casino.checklist[stepIndex] !== null) {
    // New structure: object with title, description, type, image
    stepDescription = casino.checklist[stepIndex].description;
    stepImage = casino.checklist[stepIndex].image;
  } else {
    // Old structure: just a string
    stepDescription = casino.checklist[stepIndex];
    stepImage = casino.images?.[stepIndex];
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    casino.checklist.length,
    stepDescription,
    stepImage
  );

  // Check if current step requires any input
  const currentStep = casino.checklist[stepIndex];
  let stepTypes = [];
  if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
    stepTypes = currentStep.type;
  }

  // Show different buttons based on step requirements
  let components;
  if (stepTypes.length === 0) {
    // Step has no requirements - show next step button (for info steps)
    components = [ComponentFactory.infoStepButtons()];
  } else {
    // Step has requirements - show next step button
    components = [ComponentFactory.stepButtons()];
  }

  channel.send({
    embeds: [embed],
    components: components
  });
}

function askVipChecklist(channel, ticketState) {
  const vip = VIPS[ticketState.vipType];
  if (!vip || !vip.checklist) {
    return channel.send({
      embeds: [EmbedFactory.error(`VIP type '${ticketState.vipType}' não configurado corretamente`)]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  if (stepIndex >= vip.checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success(`Checklist do VIP ${vip.label} completado!`)],
      components: [ComponentFactory.finishButtons()]
    });
  }

  const currentStep = vip.checklist[stepIndex];
  
  // Handle new checklist structure (objects with title, description, type, image)
  let stepDescription, stepImage;
  if (typeof currentStep === 'object' && currentStep !== null) {
    // New structure: object with title, description, type, image
    stepDescription = currentStep.description;
    stepImage = currentStep.image;
  } else {
    // Old structure: just a string
    stepDescription = currentStep;
    stepImage = null;
  }
  
  const embed = EmbedFactory.checklist(
    stepIndex + 1,
    vip.checklist.length,
    stepDescription,
    stepImage
  );

  // Check if current step requires any input
  let stepTypes = [];
  if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
    stepTypes = currentStep.type;
  }

  // Show different buttons based on step requirements
  let components;
  if (stepTypes.length === 0) {
    // Step has no requirements - show next step button (for info steps)
    components = [ComponentFactory.infoStepButtons()];
  } else {
    // Step has requirements - show next step button
    components = [ComponentFactory.stepButtons()];
  }

  channel.send({
    embeds: [embed],
    components: components
  });
}