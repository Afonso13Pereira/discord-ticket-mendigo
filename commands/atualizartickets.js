const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { CHANNELS, EMOJIS } = require('../config/constants');
const { cats, refreshCategories, ensureInitialized } = require('../utils/categories');

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

    // CORREÇÃO CRÍTICA: Garantir inicialização e refresh completo
    await ensureInitialized();
    await refreshCategories();
    
    // Wait a bit for the refresh to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`📋 Creating ticket message with categories:`, Object.keys(cats));
    console.log(`📋 All categories:`, cats);
    
    const activeCats = Object.entries(cats).filter(([id, cat]) => cat.active);
    console.log(`📋 Active categories:`, activeCats.map(([id, cat]) => `${cat.name} (${id})`));
    
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

    // CORREÇÃO: Passar as categorias atualizadas diretamente
    const components = ComponentFactory.categoryButtons(STATIC_CATEGORIES, cats);
    console.log(`📋 Created ${components.length} component rows for ticket message`);

    // Try to find existing ticket message to edit
    const messages = await ticketChannel.messages.fetch({ limit: 10 });
    console.log(`🔍 Searching for existing ticket message in ${messages.size} messages`);
    
    let existingMessage = messages.find(msg => 
      msg.author.id === client.user.id && 
      msg.embeds.length > 0 && 
      msg.components.length > 0 && // Must have buttons
      msg.embeds[0].title && 
      msg.embeds[0].title.includes('Sistema de Suporte')
    );

    // Fallback: look for any message with buttons from the bot
    if (!existingMessage) {
      existingMessage = messages.find(msg => 
        msg.author.id === client.user.id && 
        msg.components.length > 0
      );
      if (existingMessage) {
        console.log('🔍 Found message with buttons, will edit it');
      }
    }

    if (existingMessage) {
      // Edit existing message
      await existingMessage.edit({
        embeds: [embed],
        components: components
      });
      console.log('✅ Ticket message edited in channel:', ticketChannel.name);
    } else {
      // Send new message if no existing message found
      console.log('📝 No existing ticket message found, sending new one');
      await ticketChannel.send({
        embeds: [embed],
        components: components
      });
      console.log('✅ New ticket message sent in channel:', ticketChannel.name);
    }

    console.log('✅ Ticket message updated in channel:', ticketChannel.name);
  } catch (error) {
    console.error('Error updating ticket message:', error);
    throw error;
  }
}

// Export the function for use in other files
module.exports.updateTicketMessage = updateTicketMessage;