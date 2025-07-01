require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const DatabaseManager = require('./utils/database');

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
function restoreTicketStates() {
  const savedStates = db.getAllTicketStates();
  client.ticketStates = savedStates;
  
  console.log(`✅ Restored ${savedStates.size} ticket states from database`);
}

// Save ticket state to database
function saveTicketState(channelId, state) {
  client.ticketStates.set(channelId, state);
  db.saveTicketState(channelId, state);
}

// Delete ticket state from database
function deleteTicketState(channelId) {
  client.ticketStates.delete(channelId);
  db.deleteTicketState(channelId);
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

// Cleanup old tickets daily
setInterval(() => {
  const cleaned = db.cleanupOldTickets(7);
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old ticket states`);
  }
}, 24 * 60 * 60 * 1000); // 24 hours

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  restoreTicketStates();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  db.close();
  client.destroy();
  process.exit(0);
});

client.login(process.env.TOKEN);