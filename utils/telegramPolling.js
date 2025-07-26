const telegramService = require('./telegram');

class TelegramPolling {
  constructor(client) {
    this.client = client;
    this.botToken = telegramService.botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.lastUpdateId = 0;
    this.isPolling = false;
  }

  async start() {
    if (!this.botToken) {
      console.warn('[TELEGRAM] Bot token não configurado. Polling não iniciado.');
      return;
    }

    this.isPolling = true;
    console.log('[TELEGRAM] Iniciando polling...');
    
    while (this.isPolling) {
      try {
        await this.pollUpdates();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll a cada 1 segundo
      } catch (error) {
        console.error('[TELEGRAM] Erro no polling:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos em caso de erro
      }
    }
  }

  stop() {
    this.isPolling = false;
    console.log('[TELEGRAM] Polling parado.');
  }

  async pollUpdates() {
    try {
      const response = await fetch(`${this.baseUrl}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=30`);
      const result = await response.json();

      if (!result.ok) {
        console.error('[TELEGRAM] Erro ao buscar atualizações:', result);
        return;
      }

      for (const update of result.result) {
        await this.handleUpdate(update);
        this.lastUpdateId = update.update_id;
      }
    } catch (error) {
      console.error('[TELEGRAM] Erro no polling:', error);
    }
  }

  async handleUpdate(update) {
    console.log('[TELEGRAM] Update recebido:', update.update_id);

    if (update.callback_query) {
      await telegramService.handleCallbackQuery(update.callback_query, this.client);
    }

    if (update.message) {
      console.log('[TELEGRAM] Mensagem recebida:', update.message.text);
      // Aqui você pode adicionar lógica para responder a mensagens
    }
  }
}

module.exports = TelegramPolling; 