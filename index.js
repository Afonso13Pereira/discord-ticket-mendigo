require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const DatabaseManager = require('./utils/database');
const TranscriptManager = require('./utils/transcripts');
const EmbedFactory = require('./utils/embeds');
const { CHANNELS } = require('./config/constants');

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

// Map que guarda o estado de cada ticket (por channelId)
client.ticketStates = new Map();

// Restore ticket states from database on startup
async function restoreTicketStates() {
  // Wait for database connection
  setTimeout(async () => {
    try {
      const savedStates = await db.getAllTicketStates();
      client.ticketStates = savedStates;
      
      console.log(`✅ Restored ${savedStates.size} ticket states from MongoDB`);
    } catch (error) {
      console.error('Error restoring ticket states:', error);
    }
  }, 2000); // Wait 2 seconds for DB connection
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
  restoreTicketStates();
  
  // Update statistics on startup
  setTimeout(updateStatistics, 5000); // Wait 5 seconds for everything to load
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await db.close();
  client.destroy();
  process.exit(0);
});

client.login(process.env.TOKEN);