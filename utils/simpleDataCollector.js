// utils/simpleDataCollector.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const EmbedFactory = require('./embeds');
const Logger = require('./logger');

class SimpleDataCollector {
  static async collectBasicInfo(channel, ticketState) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📝 Informações Básicas')
      .setDescription('Por favor, forneça as informações básicas do seu giveaway:')
      .addFields(
        { name: '🎰 Casino', value: 'Qual casino? (BCGame, 1xBit, HexaBet)', inline: true },
        { name: '💰 Prêmio', value: 'Qual o valor do prêmio?', inline: true },
        { name: '🆔 ID BCGame', value: 'Seu ID da BCGame (opcional)', inline: true },
        { name: '💳 LTC', value: 'Seu endereço LTC', inline: true }
      )
      .setFooter({ text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE' });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('collect_basic_info')
          .setLabel('📝 Fornecer Informações')
          .setStyle(ButtonStyle.Primary)
      );

    await channel.send({
      embeds: [embed],
      components: [buttons]
    });

    Logger.ticket('Basic info collection started', ticketState.ticketNumber);
  }

  static async processBasicInfo(interaction, ticketState) {
    const modal = new ModalBuilder()
      .setCustomId('basic_info_modal')
      .setTitle('📝 Informações do Giveaway')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('casino')
            .setLabel('Casino')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('BCGame, 1xBit, HexaBet')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prêmio')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 50, 100, 200')
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bcgame_id')
            .setLabel('ID BCGame (opcional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Seu ID da BCGame')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('ltc_address')
            .setLabel('Endereço LTC')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Seu endereço LTC')
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }

  static async handleBasicInfoModal(interaction, ticketState) {
    const casino = interaction.fields.getTextInputValue('casino').trim();
    const prize = interaction.fields.getTextInputValue('prize').trim();
    const bcGameId = interaction.fields.getTextInputValue('bcgame_id').trim() || null;
    const ltcAddress = interaction.fields.getTextInputValue('ltc_address').trim();

    // Validar casino
    const validCasinos = ['BCGame', '1xBit', 'HexaBet'];
    if (!validCasinos.includes(casino)) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Casino inválido. Use: BCGame, 1xBit ou HexaBet')],
        flags: 64
      });
    }

    // Atualizar ticket state
    ticketState.casino = casino;
    ticketState.prize = prize;
    ticketState.bcGameId = bcGameId;
    ticketState.ltcAddress = ltcAddress;
    ticketState.step = 1; // Próximo passo

    await interaction.client.saveTicketState(interaction.channel.id, ticketState);

    // Mostrar resumo
    const embed = new EmbedBuilder()
      .setColor(0x00d26a)
      .setTitle('✅ Informações Recebidas')
      .addFields(
        { name: '🎰 Casino', value: casino, inline: true },
        { name: '💰 Prêmio', value: prize, inline: true },
        { name: '🆔 ID BCGame', value: bcGameId || 'Não fornecido', inline: true },
        { name: '💳 LTC', value: ltcAddress, inline: true }
      )
      .setFooter({ text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE' });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_info')
          .setLabel('✅ Confirmar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('edit_info')
          .setLabel('✏️ Editar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      flags: 64
    });

    Logger.ticket(`Basic info collected: ${casino} - ${prize}`, ticketState.ticketNumber);
  }

  static async confirmInfo(interaction, ticketState) {
    // Criar submission
    const submissionId = await interaction.client.db.saveSubmission(
      interaction.channel.id,
      ticketState.ticketNumber,
      ticketState.ownerId,
      ticketState.ownerTag,
      'giveaway',
      ticketState.casino,
      ticketState.prize,
      ticketState.ltcAddress,
      ticketState.bcGameId
    );

    if (submissionId) {
      // Enviar para canal de moderação
      const { CHANNELS } = require('../config/constants');
      const modChannel = await interaction.guild.channels.fetch(CHANNELS.MOD);
      
      if (modChannel) {
        const embed = EmbedFactory.submissionReady(ticketState.ticketNumber, ticketState.ownerTag, interaction.channel.id);
        const ComponentFactory = require('./components');
        const components = ComponentFactory.submissionButtons(interaction.channel.id, ticketState.ticketNumber);

        await modChannel.send({
          embeds: [embed],
          components: [components]
        });
      }

      // Confirmar no ticket
      await interaction.channel.send({
        embeds: [EmbedFactory.success('✅ Giveaway enviado para aprovação! Aguarde a resposta da moderação.')]
      });

      Logger.ticket(`Submission created: ${submissionId}`, ticketState.ticketNumber);
    }

    await interaction.update({
      content: '✅ Informações confirmadas e enviadas para aprovação!',
      embeds: [],
      components: []
    });
  }
}

module.exports = SimpleDataCollector; 