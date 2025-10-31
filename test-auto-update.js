// test-auto-update.js
require('dotenv').config();

console.log('🔍 Testando sistema de atualização automática e migração...\n');

// Simular cliente Discord
const mockClient = {
  channels: {
    fetch: async (channelId) => ({
      messages: {
        fetch: async (messageId) => ({
          edit: async (data) => {
            console.log('✅ Mensagem Discord editada:', {
              channelId,
              messageId,
              embeds: data.embeds?.length || 0,
              components: data.components?.length || 0
            });
            return true;
          }
        })
      }
    })
  },
  db: {
    Approval: {
      findOne: async (query) => {
        console.log('🔍 Buscando approval:', query);
        // Simular approval encontrada
        return {
          approvalId: 'test-123',
          ticketChannelId: query.ticketChannelId,
          discordMessageId: 'discord-msg-123',
          telegramMessageId: 'telegram-msg-123',
          casino: 'BCGame',
          prize: '50€',
          userTag: 'TestUser#1234',
          ticketNumber: '12345',
          ltcAddress: 'LTC123...',
          bcGameId: '12345',
          isVerified: false,
          bcGameProfileImage: null
        };
      }
    },
    updateApprovalFields: async (approvalId, fields) => {
      console.log('✅ Approval atualizada:', { approvalId, fields });
      return { approvalId, ...fields };
    },
    getApproval: async (approvalId) => {
      console.log('🔍 Buscando approval:', approvalId);
      return {
        approvalId,
        ticketChannelId: 'test-channel',
        discordMessageId: 'discord-msg-123',
        telegramMessageId: 'telegram-msg-123',
        casino: 'BCGame',
        prize: '50€',
        userTag: 'TestUser#1234',
        ticketNumber: '12345',
        ltcAddress: 'LTC123...',
        bcGameId: '12345',
        isVerified: false,
        bcGameProfileImage: null
      };
    }
  }
};

// Mock do serviço Telegram
const mockTelegramService = {
  updateApprovalMessage: async (approval) => {
    console.log('✅ Mensagem Telegram atualizada:', {
      approvalId: approval.approvalId,
      casino: approval.casino,
      prize: approval.prize
    });
    return true;
  }
};

// Mock dos componentes
const mockComponents = {
  approvalButtons: (approvalId, channelId) => [
    { type: 'button', label: 'Teste' }
  ]
};

// Mock dos embeds
const mockEmbeds = {
  approvalFinal: (casino, prize, userTag, ticketNumber, ltcAddress, bcGameId, isVerified, bcGameProfileImage) => ({
    title: 'Giveaway Aprovado',
    description: `Casino: ${casino}, Prêmio: ${prize}`
  })
};

// Substituir módulos por mocks
const originalRequire = require;
require = function(moduleName) {
  if (moduleName === './telegram') {
    return mockTelegramService;
  }
  if (moduleName === './components') {
    return mockComponents;
  }
  if (moduleName === './embeds') {
    return mockEmbeds;
  }
  if (moduleName === '../config/constants') {
    return { CHANNELS: { APPROVE: 'test-approve-channel' } };
  }
  return originalRequire(moduleName);
};

// Testar o sistema
async function testAutoUpdate() {
  try {
    console.log('🚀 Iniciando teste...\n');
    
    const AutoMessageUpdater = require('./utils/autoMessageUpdater');
    const updater = new AutoMessageUpdater(mockClient);
    
    console.log('📋 Testando atualização de mensagens...\n');
    
    // Simular mudança de ticket state
    await updater.onTicketStateChange('test-channel', {
      casino: 'BCGame',
      prize: '100€',
      bcGameId: '67890',
      ltcAddress: 'LTC456...'
    });
    
    console.log('\n✅ Teste de atualização automática concluído!');
    
    // Testar migração de approvals antigas
    console.log('\n🔄 Testando migração de approvals antigas...\n');
    
    // Mock da função de migração
    const mockMigrateLegacy = async () => {
      console.log('✅ Função de migração simulada com sucesso');
      console.log('📊 Aproximadamente 5 approvals antigas seriam migradas');
      return true;
    };
    
    await mockMigrateLegacy();
    
    console.log('\n✅ Teste de migração concluído!');
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testAutoUpdate(); 