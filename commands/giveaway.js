const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, ROLES, EMOJIS } = require('../config/constants');
const CASINOS = require('../events/casinos');
const MESSAGES = require('../config/messages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Criar giveaway aprovado manualmente (ADMIN ONLY)')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuário que ganhou o giveaway')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('casino')
        .setDescription('Casino onde o prêmio será enviado')
        .setRequired(true)
        .addChoices(
          ...Object.entries(CASINOS).map(([id, casino]) => ({
            name: `${casino.emoji} ${casino.label}`,
            value: id
          }))
        )
    )
    .addStringOption(option =>
      option
        .setName('premio')
        .setDescription('Valor do prêmio (ex: 100)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('endereco_ltc')
        .setDescription('Endereço LTC do usuário')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('bcgame_id')
        .setDescription('ID do BCGame (apenas para BCGame)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de giveaway')
        .setRequired(false)
        .addChoices(
          { name: '🎁 Telegram', value: 'telegram' },
          { name: '🎰 GTB', value: 'gtb' },
          { name: '🔥 Promoção', value: 'promo' },
          { name: '🎯 Manual', value: 'manual' }
        )
    )
    .addStringOption(option =>
      option
        .setName('motivo')
        .setDescription('Motivo do giveaway (opcional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Categoria do ticket (opcional)')
        .setRequired(false)
        .addChoices(
          { name: '🎁 Giveaways', value: 'Giveaways' },
          { name: '❓ Dúvidas', value: 'Dúvidas' },
          { name: '🌐 Website', value: 'Website' },
          { name: '📌 Outros', value: 'Outros' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Verificar permissões
      if (!interaction.member.roles.cache.has(ROLES.MOD)) {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Sem permissão!**\n\nApenas moderadores podem usar este comando.')],
          flags: 64
        });
      }

      // Obter dados do comando
      const user = interaction.options.getUser('usuario');
      const casinoId = interaction.options.getString('casino');
      const prize = interaction.options.getString('premio');
      const ltcAddress = interaction.options.getString('endereco_ltc') || 'N/A - Manual';
      const bcGameId = interaction.options.getString('bcgame_id') || null;
      const giveawayType = interaction.options.getString('tipo') || 'manual';
      const reason = interaction.options.getString('motivo') || 'Giveaway manual';
      const selectedCategory = interaction.options.getString('categoria') || null;

      // Validar dados
      if (!CASINOS[casinoId]) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.COMMANDS.GIVEAWAY_INVALID_CASINO)],
          flags: 64
        });
      }

      if (!/^\d+$/.test(prize)) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.COMMANDS.GIVEAWAY_INVALID_PRIZE)],
          flags: 64
        });
      }

      // Verificar se é BCGame e se tem ID
      if (casinoId === 'BCGame' && !bcGameId) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.COMMANDS.GIVEAWAY_BCGAME_ID_REQUIRED)],
          flags: 64
        });
      }

      // Determinar categoria
      let category = selectedCategory || 'Giveaways'; // Usar categoria escolhida ou padrão
      if (!selectedCategory && giveawayType === 'manual') {
        category = 'Outros'; // Para giveaways manuais sem categoria específica
      }

      // Gerar número de ticket usando o sistema correto
      const ticketNumber = await client.db.getNextTicketNumberForCategory(category);

      // Verificar se o usuário tem cargo de verificação
      const member = await interaction.guild.members.fetch(user.id);
      const isVerified = isUserVerifiedForCasino(member, casinoId);

      // Criar approval na base de dados
      const approvalId = await client.db.saveApproval(
        interaction.channel.id, // Usar o canal atual onde o comando foi executado
        ticketNumber,
        user.id,
        user.tag,
        casinoId,
        prize,
        ltcAddress,
        bcGameId,
        null, // bcGameProfileImage
        null, // messageId
        isVerified, // NOVO: Passar o status de verificação
        interaction.user.id, // approverId
        interaction.user.tag // approverTag
      );

      if (!approvalId) {
        return interaction.reply({
          embeds: [EmbedFactory.error(MESSAGES.COMMANDS.GIVEAWAY_ERROR)],
          flags: 64
        });
      }

      // Determinar valor a exibir como número do ticket
      let ticketDisplay = ticketNumber;
      if (giveawayType === 'manual') {
        ticketDisplay = `<#${interaction.channel.id}>`;
      }

      // Enviar para canal de aprovações
      const approveChannel = await interaction.guild.channels.fetch(CHANNELS.APPROVE);
      const embed = EmbedFactory.approvalFinal(
        casinoId,
        prize,
        user.tag,
        ticketDisplay,
        ltcAddress,
        bcGameId,
        isVerified,
        null // bcGameProfileImage
      );

      // Adicionar informações extras ao embed
      embed.addFields(
        { name: '🎯 Tipo', value: giveawayType.toUpperCase(), inline: true },
        { name: '📝 Motivo', value: reason, inline: true },
        { name: '👤 Criado por', value: interaction.user.tag, inline: true }
      );

      const components = ComponentFactory.approvalButtons(approvalId, interaction.channel.id);

      const approvalMessage = await approveChannel.send({
        embeds: [embed],
        components: [components]
      });

      // Salvar ID da mensagem do Discord no approval
      await client.db.updateApprovalMessageIds(approvalId, approvalMessage.id, null);

      // Log da ação
      await client.db.logAction(
        interaction.channel.id,
        interaction.user.id,
        'manual_giveaway_created',
        `User: ${user.tag}, Casino: ${casinoId}, Prize: ${prize}, Type: ${giveawayType}, Category: ${category}`
      );

      // Responder com confirmação
      const successEmbed = EmbedFactory.success([
        '✅ **Giveaway criado com sucesso!**',
        '',
        `👤 **Usuário:** ${user.tag}`,
        `🎰 **Casino:** ${CASINOS[casinoId].label}`,
        `💰 **Prêmio:** ${prize}`,
        `🎯 **Tipo:** ${giveawayType.toUpperCase()}`,
        `📂 **Categoria:** ${category}`,
        `🎫 **Ticket:** #${ticketNumber}`,
        `✅ **Verificado:** ${isVerified ? 'Sim' : 'Não'}`,
        '',
        '📋 A aprovação foi enviada para o canal de aprovações.'
      ].join('\n'));

      return interaction.reply({
        embeds: [successEmbed],
        flags: 64
      });

    } catch (error) {
      console.error('Error creating manual giveaway:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error(MESSAGES.COMMANDS.GIVEAWAY_ERROR)],
        flags: 64
      });
    }
  }
};

// Função auxiliar para verificar se o usuário tem cargo de verificação
function isUserVerifiedForCasino(member, casino) {
  const casinoData = CASINOS[casino];
  
  if (!casinoData || !casinoData.cargoafiliado) {
    return false;
  }
  
  return member.roles.cache.has(casinoData.cargoafiliado);
} 