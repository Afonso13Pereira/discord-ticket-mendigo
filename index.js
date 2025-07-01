require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Map que guarda o estado de cada ticket (por channelId)
client.ticketStates = new Map();

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

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
