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
const { CHANNELS, ROLES, EMOJIS, VIP_TYPES, VIP_CASINOS } = require('../config/constants');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

const VIP_CHECKLISTS = {
  semanal: [
    "📱 Envie **print do perfil** com ID visível **e** o **ID em texto**",
    "💰 Envie **prints dos depósitos**",
    "💸 Envie **prints dos levantamentos**",
    "🏦 Envie **prints dos cofres**",
    "📥 Envie **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
  ],
  leaderboard: [
    "📱 Envie **print da conta** com ID visível **e** o **ID em texto**",
    "📥 Envie **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**"
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

        // Create approval
        const approvalId = await client.db.saveApproval(
          submission.ticketChannelId,
          submission.ticketNumber,
          submission.userId,
          submission.userTag,
          submission.casino,
          prize,
          submission.ltcAddress
        );

        // Send to approval channel
        const approveChannel = await interaction.guild.channels.fetch(CHANNELS.APPROVE);
        const embed = EmbedFactory.approvalFinal(
          submission.casino,
          prize,
          submission.userTag,
          submission.ticketNumber,
          submission.ltcAddress
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

        return interaction.reply({
          embeds: [EmbedFactory.success(`Giveaway aprovado com prémio de **${prize}** e enviado para aprovações finais!`)],
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

        return interaction.reply({
          embeds: [EmbedFactory.success(`Giveaway rejeitado. Motivo enviado ao usuário.`)],
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

        await staffChannel.send({ embeds: [embed] });

        // Update approval status
        await client.db.updateApproval(approvalId, null, null, 'review');

        return interaction.reply({
          embeds: [EmbedFactory.success(`Solicitação de revisão enviada para o suporte humano.`)],
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
          const transcriptId = await transcriptManager.generateTranscript(interaction.channel, ticketState || { 
            ownerTag: 'Unknown', 
            ownerId: 'Unknown',
            ticketNumber: 0,
            category: 'unknown'
          });
          
          // Log transcript creation
          await client.db.logAction(interaction.channel.id, interaction.user.id, 'transcript_created', `ID: ${transcriptId}`);
          
          // Send transcript info to transcripts channel
          const transcriptsChannel = await interaction.guild.channels.fetch(CHANNELS.TRANSCRIPTS);
          const embed = EmbedFactory.transcriptCreated(
            transcriptId, 
            interaction.channel.name,
            ticketState?.ticketNumber || 0,
            ticketState?.ownerTag || 'Unknown',
            ticketState?.category || 'unknown'
          );
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

      // Get next ticket number for this category
      const ticketNumber = await client.db.getNextTicketNumberForCategory(category.name);

      // Generate ticket name with category prefix
      const prefix = CATEGORY_PREFIXES[category.name] || category.name.toLowerCase();
      const ticketName = `ticket-${prefix}${String(ticketNumber).padStart(4, '0')}`;

      // Find or create category channel
      let parentCategory = interaction.guild.channels.cache
        .find(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === ChannelType.GuildCategory);
      
      if (!parentCategory) {
        parentCategory = await interaction.guild.channels.create({
          name: category.name,
          type: ChannelType.GuildCategory
        });
      }

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
        ComponentFactory.supportButton()
      );

      // Handle different category types
      if (category.name === 'Giveaways') {
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitConfirm = true;
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
        const currentState = client.ticketStates.get(ticketChannel.id);
        currentState.awaitDescription = true;
        await client.saveTicketState(ticketChannel.id, currentState);
        
        await ticketChannel.send({
          embeds: [EmbedFactory.questionDescription()],
          components: [supportRow]
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

      return interaction.reply({
        embeds: [EmbedFactory.success(`Ticket #${ticketNumber} criado com sucesso: ${ticketChannel}`)],
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
        embeds: [EmbedFactory.success(`Tipo VIP **${vipType.toUpperCase()}** selecionado para **${ticketState.vipCasino}**!`)]
      });
      
      return askVipChecklist(interaction.channel, ticketState);
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
        ticketState.ltcAddress
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
      
      // Send mod buttons to the ticket itself (CORREÇÃO AQUI!)
      const modButtons = ComponentFactory.modButtons(submissionId);
      await interaction.channel.send({
        embeds: [EmbedFactory.info('Solicitação enviada para aprovação! Aguarde a análise da equipe.')],
        components: [modButtons]
      });
    }

    // Mod Approve Button (agora no ticket)
    if (interaction.isButton() && interaction.customId.startsWith('mod_approve_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Você não tem permissão para usar este botão')],
          flags: 64
        });
      }

      const submissionId = interaction.customId.split('_')[2];
      
      // Show prize modal
      const modal = new ModalBuilder()
        .setCustomId(`prize_modal_${submissionId}`)
        .setTitle('💰 Definir Valor da Prenda')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('prize_value')
              .setLabel('Valor da Prenda')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex: 30')
              .setRequired(true)
          )
        );
      
      return interaction.showModal(modal);
    }

    // Mod Reject Button (agora no ticket)
    if (interaction.isButton() && interaction.customId.startsWith('mod_reject_')) {
      // Check if user has mod role
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Você não tem permissão para usar este botão')],
          flags: 64
        });
      }

      const submissionId = interaction.customId.split('_')[2];
      
      // Show rejection modal
      const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${submissionId}`)
        .setTitle('❌ Motivo da Rejeição')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reject_reason')
              .setLabel('Motivo da Rejeição')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Explique o motivo da rejeição...')
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
          content: `🎫 **Ir para Ticket #${approval.ticketNumber}:** <#${approval.ticketChannelId}>`,
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

        return interaction.reply({
          embeds: [EmbedFactory.success(`Giveaway marcado como pago! Mensagem enviada ao ticket #${approval.ticketNumber}.`)],
          flags: 64
        });
      }

      if (action === 'review') {
        // Show review modal
        const modal = new ModalBuilder()
          .setCustomId(`review_modal_${approvalId}`)
          .setTitle('🔍 Motivo da Revisão')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('review_reason')
                .setLabel('Motivo da Revisão')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Explique o motivo da revisão...')
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
        embeds: [EmbedFactory.success('Reenvio iniciado! Por favor, complete novamente o checklist.')]
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
      
      await staffChannel.send({
        embeds: [EmbedFactory.warning(`${EMOJIS.SHIELD} Suporte solicitado em ${interaction.channel}\nTicket: #${ticketState?.ticketNumber || 'N/A'}\nUsuário: ${interaction.user.tag}`)]
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

function askVipChecklist(channel, ticketState) {
  const checklist = VIP_CHECKLISTS[ticketState.vipType];
  if (!checklist) {
    return channel.send({
      embeds: [EmbedFactory.error('Tipo VIP não configurado no sistema')]
    });
  }

  const stepIndex = ticketState.step ?? 0;
  
  if (stepIndex >= checklist.length) {
    return channel.send({
      embeds: [EmbedFactory.success('Checklist VIP concluído! Clique em **Finalizar** para enviar para aprovação.')],
      components: [ComponentFactory.createButtonRow(ComponentFactory.finishButton())]
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
    components: [ComponentFactory.createButtonRow(ComponentFactory.nextStepButton())]
  });
}