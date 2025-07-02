const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');
const { cats, refreshCategories } = require('../utils/categories');

const STATIC_CATEGORIES = [
  { id: 'Giveaways', label: 'Giveaways', emoji: EMOJIS.GIFT, color: 'blue' },
  { id: 'VIPS', label: 'VIPS', emoji: EMOJIS.CROWN, color: 'green' },
  { id: 'Dúvidas', label: 'Dúvidas', emoji: '❓', color: 'grey' },
  { id: 'Website', label: 'Website', emoji: '🌐', color: 'grey' },
  { id: 'Outros', label: 'Outros', emoji: '📌', color: 'red' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atualizartickets')
    .setDescription('Atualizar a mensagem fixa dos tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    try {
      await updateTicketMessage(interaction.guild, client);
      
      return interaction.reply({
        embeds: [EmbedFactory.success('Mensagem de tickets atualizada com sucesso!')],
        flags: 64
      });
    } catch (error) {
      console.error('Error updating ticket message:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao atualizar mensagem de tickets')],
        flags: 64
      });
    }
  }
};

// Function to update ticket message
async function updateTicketMessage(guild, client) {
  try {
    const ticketChannel = await guild.channels.fetch(CHANNELS.CREATETICKET);
    if (!ticketChannel) {
      console.error('Ticket channel not found:', CHANNELS.CREATETICKET);
      return;
    }

    // CORREÇÃO: Force refresh categories from database before creating buttons
    await refreshCategories();
    
    console.log(`📋 Creating ticket message with categories:`, Object.keys(cats));
    console.log(`📋 Active categories:`, Object.entries(cats).filter(([id, cat]) => cat.active).map(([id, cat]) => `${cat.name} (${id})`));
    
    const embed = EmbedFactory.ticket(
      'Sistema de Suporte',
      [
        '**Bem-vindo ao nosso sistema de suporte!**',
        '',
        `${EMOJIS.STAR} Clique no botão que melhor descreve o seu pedido`,
        `${EMOJIS.SHIELD} Suporte disponível 24/7`,
        `${EMOJIS.DIAMOND} Resposta rápida e profissional`,
        '',
        '*Escolha uma categoria abaixo para começar:*'
      ].join('\n')
    );

    const components = ComponentFactory.categoryButtons(STATIC_CATEGORIES, cats);
    console.log(`📋 Created ${components.length} component rows for ticket message`);

    // Clear channel and send new message
    const messages = await ticketChannel.messages.fetch({ limit: 100 });
    if (messages.size > 0) {
      await ticketChannel.bulkDelete(messages);
    }

    await ticketChannel.send({
      embeds: [embed],
      components: components
    });

    console.log('✅ Ticket message updated in channel:', ticketChannel.name);
  } catch (error) {
    console.error('Error updating ticket message:', error);
    throw error;
  }
}

// Export the function for use in other files
module.exports.updateTicketMessage = updateTicketMessage;