require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const DatabaseManager = require('./utils/database');
const TranscriptManager = require('./utils/transcripts');
const EmbedFactory = require('./utils/embeds');
const ErrorHandler = require('./utils/errorHandler');
const { CHANNELS } = require('./config/constants');
const { updateTicketMessage } = require('./commands/atualizartickets');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Initialize database
const db = new DatabaseManager();

// Initialize error handler
let errorHandler;

// Map que guarda o estado de cada ticket (por channelId)
client.ticketStates = new Map();

// Restore ticket states from database on startup
async function restoreTicketStates() {
  // Wait for database connection
  const waitForDatabase = async () => {
    let attempts = 0;
    while ((!client.db || !client.db.connected) && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!client.db || !client.db.connected) {
      console.log('⚠️ Database not available, starting with empty ticket states');
      return;
    }
    
    try {
      const savedStates = await client.db.getAllTicketStates();
      client.ticketStates = savedStates;
      
      console.log(`✅ Restored ${savedStates.size} ticket states from MongoDB`);
    } catch (error) {
      console.error('Error restoring ticket states:', error);
    }
  };
  
  // Start waiting for database in background
  waitForDatabase();
}

// Save ticket state to database
async function saveTicketState(channelId, state) {
  client.ticketStates.set(channelId, state);
  await db.saveTicketState(channelId, state);
}

// Delete ticket state from database
async function deleteTicketState(channelId) {
  client.ticketStates.delete(channelId);
  await db.deleteTicketState(channelId);
}

// Update statistics in stats channel
async function updateStatistics() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const statsChannel = await guild.channels.fetch(CHANNELS.STATS);
    if (!statsChannel) return;

    const stats = await db.getTicketStatistics();
    if (!stats) return;

    const embed = EmbedFactory.ticketStatistics(stats);
    
    // Clear channel and send new stats
    const messages = await statsChannel.messages.fetch({ limit: 100 });
    if (messages.size > 0) {
      await statsChannel.bulkDelete(messages);
    }
    
    await statsChannel.send({
      embeds: [embed]
    });

    console.log('📊 Statistics updated in stats channel');
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

// Update ticket message in create ticket channel
async function updateTicketMessagePeriodically() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    await updateTicketMessage(guild, client);
    console.log('🎫 Ticket message updated automatically');
  } catch (error) {
    console.error('Error updating ticket message:', error);
  }
}

// Expose database functions to client
client.saveTicketState = saveTicketState;
client.deleteTicketState = deleteTicketState;
client.db = db;

// carregar comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
  else console.warn(`⚠️ Ignorando comando ${file}`);
}

// carregar eventos
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const evt = require(path.join(eventsPath, file));
  if (evt.once) client.once(evt.name, (...args) => evt.execute(...args, client));
  else client.on(evt.name, (...args) => evt.execute(...args, client));
}

// Update statistics every 30 minutes
setInterval(updateStatistics, 30 * 60 * 1000);

// Update ticket message every 6 hours
setInterval(updateTicketMessagePeriodically, 6 * 60 * 60 * 1000);

// Cleanup old tickets and transcripts daily
setInterval(async () => {
  try {
    const cleanedTickets = await db.cleanupOldTickets(7);
    const cleanedTranscripts = await db.cleanupExpiredTranscripts();
    
    if (cleanedTickets > 0) {
      console.log(`🧹 Cleaned up ${cleanedTickets} old ticket states from MongoDB`);
    }
    if (cleanedTranscripts > 0) {
      console.log(`🧹 Cleaned up ${cleanedTranscripts} expired transcripts from MongoDB`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 hours

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  
  // Initialize error handler after client is ready
  errorHandler = new ErrorHandler(client);
  
  restoreTicketStates();
  
  // Update statistics and ticket message on startup
  setTimeout(updateStatistics, 5000); // Wait 5 seconds for everything to load
  setTimeout(updateTicketMessagePeriodically, 7000); // Wait 7 seconds for everything to load
});

// Safe command execution with error handling
client.on('interactionCreate', async (interaction) => {
  if (errorHandler) {
    await errorHandler.safeExecuteInteraction(interaction);
  } else {
    // Fallback if error handler not ready
    console.warn('⚠️ Error handler not ready, executing interaction without protection');
    const { execute } = require('./events/interactionCreate');
    await execute(interaction, client);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  if (errorHandler) {
    await errorHandler.gracefulShutdown();
  } else {
    await db.close();
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.TOKEN);