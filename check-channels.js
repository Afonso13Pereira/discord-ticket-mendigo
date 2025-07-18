// Script para verificar se os canais configurados existem
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CHANNELS = {
  ERROS: process.env.ERROS_CHANNEL_ID,
  REDEEMS: process.env.REDEEMS_CHANNEL_ID,
  AJUDAS: process.env.AJUDAS_CHANNEL_ID,
  GIVEAWAYSHELP: process.env.GIVEAWAYSHELP_CHANNEL_ID,
  OTHER: process.env.OTHER_CHANNEL_ID,
  LOGS: process.env.LOGS_CHANNEL_ID,
  TRANSCRIPTS: process.env.TRANSCRIPTS_CHANNEL_ID,
  MOD: process.env.MOD_CHANNEL_ID,
  APPROVE: process.env.APROVE_CHANNEL_ID,
  STATS: process.env.STATS_CHANNEL_ID,
  CREATETICKET: process.env.CREATETICKET_CHANNEL_ID
};

async function checkChannels() {
  console.log('🔍 Verificando canais configurados...\n');
  
  for (const [name, channelId] of Object.entries(CHANNELS)) {
    if (!channelId) {
      console.log(`❌ ${name}: NÃO CONFIGURADO (faltando no .env)`);
      continue;
    }
    
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        if (channel.send) {
          console.log(`✅ ${name}: ${channel.name} (${channelId}) - Canal de texto`);
        } else {
          console.log(`⚠️ ${name}: ${channel.name} (${channelId}) - NÃO é canal de texto`);
        }
      } else {
        console.log(`❌ ${name}: Canal não encontrado (${channelId})`);
      }
    } catch (error) {
      console.log(`❌ ${name}: Erro ao buscar canal (${channelId}) - ${error.message}`);
    }
  }
  
  console.log('\n📋 Resumo:');
  console.log('✅ = Canal de texto encontrado e funcionando');
  console.log('⚠️ = Canal encontrado mas NÃO é canal de texto');
  console.log('❌ = Canal não encontrado ou não configurado');
  console.log('\n💡 Para corrigir:');
  console.log('1. Criar os canais no Discord');
  console.log('2. Copiar os IDs dos canais');
  console.log('3. Adicionar ao arquivo .env');
  console.log('4. Remover STAFF_CHANNEL_ID do .env');
  
  process.exit(0);
}

client.once('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  checkChannels();
});

client.login(process.env.TOKEN).catch(error => {
  console.error('❌ Erro ao conectar:', error.message);
  process.exit(1);
}); 