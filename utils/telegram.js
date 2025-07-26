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
        
        // Verificar se é erro de migração de grupo
        if (result.error_code === 400 && result.description.includes('upgraded to a supergroup')) {
          const newChatId = result.parameters?.migrate_to_chat_id;
          if (newChatId) {
            console.log(`[TELEGRAM] Grupo migrado para supergrupo. Novo Chat ID: ${newChatId}`);
            console.log(`[TELEGRAM] Atualize TELEGRAM_CHAT_ID no .env para: ${newChatId}`);
          }
        }
        
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

  async handleCallbackQuery(callbackQuery, client) {
    const { data, from } = callbackQuery;
    
    console.log(`[TELEGRAM] Callback recebido: ${data} de @${from.username}`);
    
    if (data.startsWith('paid_')) {
      const approvalId = data.split('_')[1];
      console.log(`[TELEGRAM] Processando pagamento para approval: ${approvalId}`);
      
      try {
        // Buscar approval no banco de dados
        const approval = await client.db.getApproval(approvalId);
        if (!approval) {
          await this.sendMessage(`❌ Approval não encontrada: ${approvalId}`);
          return;
        }

        if (approval.status !== 'pending') {
          await this.sendMessage(`❌ Approval já foi processada (status: ${approval.status})`);
          return;
        }

        // Atualizar status para paid
        await client.db.updateApproval(approvalId, 'paid');

        // Enviar mensagem de confirmação no Telegram
        await this.sendMessage(`✅ <b>Giveaway Pago</b>\n\n🎫 <b>Ticket:</b> #${approval.ticketNumber}\n👤 <b>Usuário:</b> ${approval.userTag}\n🎰 <b>Casino:</b> ${approval.casino}\n💰 <b>Prêmio:</b> ${approval.prize}\n\n👤 <b>Pago por:</b> @${from.username}`);

        // Enviar mensagem para o ticket no Discord
        try {
          const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
          if (ticketChannel) {
            const EmbedFactory = require('./embeds');
            await ticketChannel.send({
              embeds: [EmbedFactory.giveawayPaid()]
            });
          }
        } catch (error) {
          console.error('[TELEGRAM] Erro ao enviar mensagem para ticket Discord:', error);
        }

        // Log da ação
        await client.db.logAction(approval.ticketChannelId, from.id, 'giveaway_paid_telegram', `Ticket #${approval.ticketNumber} - Pago por @${from.username}`);

      } catch (error) {
        console.error('[TELEGRAM] Erro ao processar pagamento:', error);
        await this.sendMessage(`❌ Erro ao processar pagamento: ${error.message}`);
      }
    }
    
    if (data.startsWith('reject_')) {
      const approvalId = data.split('_')[1];
      console.log(`[TELEGRAM] Processando rejeição para approval: ${approvalId}`);
      
      try {
        // Buscar approval no banco de dados
        const approval = await client.db.getApproval(approvalId);
        if (!approval) {
          await this.sendMessage(`❌ Approval não encontrada: ${approvalId}`);
          return;
        }

        if (approval.status !== 'pending') {
          await this.sendMessage(`❌ Approval já foi processada (status: ${approval.status})`);
          return;
        }

        // Atualizar status para rejected
        await client.db.updateApproval(approvalId, 'rejected');

        // Enviar mensagem de confirmação no Telegram
        await this.sendMessage(`❌ <b>Giveaway Rejeitado</b>\n\n🎫 <b>Ticket:</b> #${approval.ticketNumber}\n👤 <b>Usuário:</b> ${approval.userTag}\n🎰 <b>Casino:</b> ${approval.casino}\n💰 <b>Prêmio:</b> ${approval.prize}\n\n👤 <b>Rejeitado por:</b> @${from.username}\n\n📝 <b>Motivo:</b> Rejeitado via Telegram`);

        // Enviar mensagem para o ticket no Discord
        try {
          const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
          if (ticketChannel) {
            const EmbedFactory = require('./embeds');
            await ticketChannel.send({
              embeds: [EmbedFactory.error('O seu giveaway foi rejeitado. Entre em contacto com o suporte para mais informações.')]
            });
          }
        } catch (error) {
          console.error('[TELEGRAM] Erro ao enviar mensagem para ticket Discord:', error);
        }

        // Log da ação
        await client.db.logAction(approval.ticketChannelId, from.id, 'giveaway_rejected_telegram', `Ticket #${approval.ticketNumber} - Rejeitado por @${from.username}`);

      } catch (error) {
        console.error('[TELEGRAM] Erro ao processar rejeição:', error);
        await this.sendMessage(`❌ Erro ao processar rejeição: ${error.message}`);
      }
    }
  }

  // Função para configurar webhook (opcional)
  async setWebhook(webhookUrl) {
    if (!this.botToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl
        })
      });

      const result = await response.json();
      console.log('[TELEGRAM] Webhook configurado:', result);
      return result;
    } catch (error) {
      console.error('[TELEGRAM] Erro ao configurar webhook:', error);
      return null;
    }
  }
}

module.exports = new TelegramService(); 