// deploy-commands.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const TOKEN    = process.env.TOKEN;
const CLIENTID = process.env.CLIENT_ID;
const GUILDID  = process.env.GUILD_ID || null;          // pode ficar vazio

if (!TOKEN || !CLIENTID) {
  console.error('❌  TOKEN ou CLIENT_ID não definidos no .env');
  process.exit(1);
}

/* ─── carrega todos os comandos da pasta ./commands ─── */
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function deployCommands() {
  try {
    if (GUILDID) {
      console.log(`🔄  Atualizando ${commands.length} comandos PARA A GUILD ${GUILDID}…`);
      await rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands });
      console.log('✅  Comandos registados (guild).');
    } else {
      console.log(`🔄  Atualizando ${commands.length} comandos GLOBAIS…`);
      await rest.put(Routes.applicationCommands(CLIENTID), { body: commands });
      console.log('✅  Comandos registados (global). Propagação pode levar até 1 h.');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Export the function for use in index.js
module.exports = { deployCommands };

// Run deploy if this file is executed directly
if (require.main === module) {
  deployCommands();
}
