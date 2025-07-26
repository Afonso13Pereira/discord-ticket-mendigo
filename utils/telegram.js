const { TELEGRAM } = require('../config/constants');

class TelegramService {
  constructor() {
    this.botToken = TELEGRAM.BOT_TOKEN;
    this.chatId = TELEGRAM.CHAT_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(text, replyMarkup = null) {
    if (!this.botToken || !this.chatId) {
      console.warn('[TELEGRAM] Bot token ou chat ID não configurados');
      return null;
    }

    try {
      const payload = {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML'
      };

      if (replyMarkup) {
        payload.reply_markup = JSON.stringify(replyMarkup);
      }

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('[TELEGRAM] Erro ao enviar mensagem:', result);
        return null;
      }

      console.log('[TELEGRAM] Mensagem enviada com sucesso');
      return result.result;
    } catch (error) {
      console.error('[TELEGRAM] Erro ao enviar mensagem:', error);
      return null;
    }
  }

  async sendApprovalMessage(approval) {
    const text = this.formatApprovalMessage(approval);
    const replyMarkup = this.createApprovalButtons(approval.approvalId);
    
    return this.sendMessage(text, replyMarkup);
  }

  formatApprovalMessage(approval) {
    let text = `🎁 <b>Giveaway Aprovado</b>\n\n`;
    text += `🎰 <b>Casino:</b> ${approval.casino}\n`;
    text += `💰 <b>Prêmio:</b> ${approval.prize}\n`;
    text += `👤 <b>Usuário:</b> ${approval.userTag}\n`;
    text += `🎫 <b>Ticket:</b> #${approval.ticketNumber}\n`;
    
    if (approval.bcGameId) {
      text += `🆔 <b>ID BCGame:</b> ${approval.bcGameId}\n`;
    }
    
    text += `💳 <b>Endereço LTC:</b> ${approval.ltcAddress}\n\n`;
    text += `⏰ <i>Aguardando pagamento...</i>`;
    
    return text;
  }

  createApprovalButtons(approvalId) {
    return {
      inline_keyboard: [
        [
          {
            text: '💰 Pago',
            callback_data: `paid_${approvalId}`
          },
          {
            text: '❌ Não Aprovar',
            callback_data: `reject_${approvalId}`
          }
        ]
      ]
    };
  }

  async handleCallbackQuery(callbackQuery) {
    const { data, from } = callbackQuery;
    
    if (data.startsWith('paid_')) {
      const approvalId = data.split('_')[1];
      // Aqui você pode implementar a lógica para marcar como pago
      console.log(`[TELEGRAM] Aprovação ${approvalId} marcada como paga por ${from.username}`);
      return this.sendMessage(`✅ Giveaway marcado como <b>PAGO</b> por @${from.username}`);
    }
    
    if (data.startsWith('reject_')) {
      const approvalId = data.split('_')[1];
      // Aqui você pode implementar a lógica para rejeitar
      console.log(`[TELEGRAM] Aprovação ${approvalId} rejeitada por ${from.username}`);
      return this.sendMessage(`❌ Giveaway <b>REJEITADO</b> por @${from.username}\n\nPor favor, informe o motivo da rejeição.`);
    }
  }
}

module.exports = new TelegramService(); 