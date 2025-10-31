// test-telegram-config.js
require('dotenv').config();

console.log('🔍 Testando configuração do Telegram...\n');

// Verificar variáveis de ambiente
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log('📋 Variáveis de ambiente:');
console.log('TELEGRAM_BOT_TOKEN:', botToken ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
console.log('TELEGRAM_CHAT_ID:', chatId ? '✅ Configurado' : '❌ NÃO CONFIGURADO');

if (botToken && chatId) {
  console.log('\n✅ Configuração do Telegram está correta!');
  console.log('Bot Token:', botToken.substring(0, 10) + '...');
  console.log('Chat ID:', chatId);
  
  // Testar API do Telegram
  const baseUrl = `https://api.telegram.org/bot${botToken}`;
  console.log('\n🔗 Base URL:', baseUrl);
  
  // Testar getMe
  fetch(`${baseUrl}/getMe`)
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        console.log('✅ Bot conectado com sucesso!');
        console.log('Nome do bot:', data.result.first_name);
        console.log('Username:', data.result.username);
      } else {
        console.log('❌ Erro na API do Telegram:', data);
      }
    })
    .catch(error => {
      console.log('❌ Erro ao conectar com API do Telegram:', error.message);
    });
    
} else {
  console.log('\n❌ Configuração do Telegram incompleta!');
  console.log('Verifique se as seguintes variáveis estão definidas no arquivo .env:');
  console.log('- TELEGRAM_BOT_TOKEN');
  console.log('- TELEGRAM_CHAT_ID');
} 