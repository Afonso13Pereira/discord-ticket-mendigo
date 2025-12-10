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
      await interaction.deferReply({ ephemeral: true });
      
      if (!interaction.guild) {
        return interaction.editReply({
          embeds: [EmbedFactory.error('Erro: Guild não encontrado')]
        });
      }
      
      await updateTicketMessage(interaction.guild, client);
      
      return interaction.editReply({
        embeds: [EmbedFactory.success('Mensagem de tickets atualizada com sucesso!')]
      });
    } catch (error) {
      console.error('❌ Error updating ticket message:', error);
      console.error('Stack:', error.stack);
      
      const errorMessage = error.message || 'Erro desconhecido ao atualizar mensagem de tickets';
      return interaction.editReply({
        embeds: [EmbedFactory.error(`Erro ao atualizar mensagem de tickets: ${errorMessage}`)]
      }).catch(err => {
        console.error('❌ Error sending error message:', err);
        // Try to reply if edit fails
        if (interaction.replied || interaction.deferred) {
          interaction.followUp({
            embeds: [EmbedFactory.error(`Erro ao atualizar mensagem de tickets: ${errorMessage}`)],
            ephemeral: true
          }).catch(() => {});
        } else {
          interaction.reply({
            embeds: [EmbedFactory.error(`Erro ao atualizar mensagem de tickets: ${errorMessage}`)],
            ephemeral: true
          }).catch(() => {});
        }
      });
    }
  }
};

// Function to update ticket message
async function updateTicketMessage(guild, client) {
  try {
    if (!guild) {
      throw new Error('Guild não fornecido');
    }
    
    if (!client || !client.user) {
      throw new Error('Client não está pronto');
    }
    
    console.log('🔄 Iniciando atualização da mensagem de tickets...');
    console.log(`📋 Guild: ${guild.name} (${guild.id})`);
    console.log(`📋 Canal ID: ${CHANNELS.CREATETICKET}`);
    
    const ticketChannel = await guild.channels.fetch(CHANNELS.CREATETICKET).catch(err => {
      console.error('❌ Erro ao buscar canal:', err);
      throw new Error(`Canal não encontrado: ${CHANNELS.CREATETICKET}`);
    });
    
    if (!ticketChannel) {
      throw new Error(`Canal de tickets não encontrado: ${CHANNELS.CREATETICKET}`);
    }
    
    console.log(`✅ Canal encontrado: ${ticketChannel.name} (${ticketChannel.id})`);

    // CORREÇÃO CRÍTICA: Garantir inicialização e refresh completo
    console.log('🔄 Garantindo inicialização das categorias...');
    await ensureInitialized();
    console.log('✅ Categorias inicializadas');
    
    console.log('🔄 Atualizando categorias...');
    await refreshCategories();
    console.log('✅ Categorias atualizadas');
    
    // Wait a bit for the refresh to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`📋 Criando mensagem com categorias:`, Object.keys(cats));
    console.log(`📋 Total de categorias:`, Object.keys(cats).length);
    
    const activeCats = Object.entries(cats).filter(([id, cat]) => cat.active);
    console.log(`📋 Categorias ativas:`, activeCats.map(([id, cat]) => `${cat.name} (${id})`));
    
    const embed = EmbedFactory.ticket();
    console.log('✅ Embed criado');

    // CORREÇÃO: Passar as categorias atualizadas diretamente
    const components = ComponentFactory.categoryButtons(STATIC_CATEGORIES, cats);
    console.log(`✅ Criados ${components.length} rows de componentes para a mensagem de tickets`);

    // Try to find existing ticket message to edit
    console.log('🔍 Procurando mensagem existente...');
    const messages = await ticketChannel.messages.fetch({ limit: 50 }).catch(err => {
      console.error('❌ Erro ao buscar mensagens:', err);
      throw new Error('Erro ao buscar mensagens do canal');
    });
    
    console.log(`🔍 Procurando em ${messages.size} mensagens`);
    
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
        console.log('🔍 Mensagem com botões encontrada, será editada');
      }
    }

    if (existingMessage) {
      // Edit existing message
      console.log(`✏️ Editando mensagem existente (ID: ${existingMessage.id})...`);
      await existingMessage.edit({
        embeds: [embed],
        components: components
      }).catch(err => {
        console.error('❌ Erro ao editar mensagem:', err);
        throw new Error(`Erro ao editar mensagem: ${err.message}`);
      });
      console.log('✅ Mensagem de tickets editada com sucesso no canal:', ticketChannel.name);
    } else {
      // Send new message if no existing message found
      console.log('📝 Nenhuma mensagem existente encontrada, enviando nova mensagem...');
      await ticketChannel.send({
        embeds: [embed],
        components: components
      }).catch(err => {
        console.error('❌ Erro ao enviar mensagem:', err);
        throw new Error(`Erro ao enviar mensagem: ${err.message}`);
      });
      console.log('✅ Nova mensagem de tickets enviada com sucesso no canal:', ticketChannel.name);
    }

    console.log('✅ Mensagem de tickets atualizada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem de tickets:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Export the function for use in other files
module.exports.updateTicketMessage = updateTicketMessage;