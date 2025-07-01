// events/interactionCreate.js
require('dotenv').config();
const {
  ChannelType, PermissionsBitField,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, InteractionType
} = require('discord.js');

const CASINOS = require('./casinos');
const { promos, create: createPromo, refreshExpired } = require('../utils/promotions');
const { cats, create: createCat } = require('../utils/categories');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;

const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    refreshExpired();

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
        
        const id = createPromo(name, endISO, casino, color, emoji);
        
        return interaction.reply({
          embeds: [EmbedFactory.success(`Promoção **${name}** criada com sucesso!\nID: \`${id}\``)],
          flags: 64
        });
      }

      if (interaction.customId === 'cat_create') {
        const name = interaction.fields.getTextInputValue('cname').trim();
        const color = interaction.fields.getTextInputValue('ccolor')?.trim().toLowerCase() || 'grey';
        const emoji = interaction.fields.getTextInputValue('cemoji')?.trim() || null;
        
        const id = createCat(name, color, emoji);
        
        return interaction.reply({
          embeds: [EmbedFactory.success(`Categoria **${name}** criada com sucesso!\nID: \`${id}\``)],
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

      client.ticketStates.set(ticketChannel.id, { ownerTag: interaction.user.tag });

      // Send welcome message
      await ticketChannel.send({
        embeds: [EmbedFactory.welcome()]
      });

      const supportRow = ComponentFactory.createButtonRow(
        ComponentFactory.supportButton()
      );

      if (category.name === 'Giveaways') {
        const ticketState = client.ticketStates.get(ticketChannel.id);
        ticketState.awaitConfirm = true;
        client.ticketStates.set(ticketChannel.id, ticketState);
        
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
          client.ticketStates.set(interaction.channel.id, ticketState);
          
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
        client.ticketStates.set(interaction.channel.id, ticketState);
        
        await interaction.channel.send({
          embeds: [EmbedFactory.success(`Promoção **${promo.name}** selecionada para **${casinoId}**`)]
        });
        return askChecklist(interaction.channel, ticketState);
      }

      // Handle fixed giveaway types
      const type = interaction.customId.split('_')[2];
      ticketState.gwType = type;
      if (type === 'gtb') ticketState.prize = 30;
      client.ticketStates.set(interaction.channel.id, ticketState);

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
      client.ticketStates.set(interaction.channel.id, ticketState);
      
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
      client.ticketStates.set(interaction.channel.id, ticketState);
      
      return askChecklist(interaction.channel, ticketState);
    }

    // Support Button
    if (interaction.isButton() && interaction.customId === 'support_ticket') {
      try { await interaction.deferUpdate(); } catch {}
      
      const staffChannel = await interaction.guild.channels.fetch(CHANNELS.STAFF);
      await staffChannel.send({
        embeds: [EmbedFactory.warning(`${EMOJIS.SHIELD} Suporte solicitado em ${interaction.channel}\nUsuário: ${interaction.user.tag}`)]
      });
      
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