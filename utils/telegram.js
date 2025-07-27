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
    
    const result = await this.sendMessage(text, replyMarkup);
    return result;
  }

  async updateApprovalMessage(approval) {
    if (!approval.telegramMessageId) {
      console.log('[TELEGRAM] No message ID found for approval:', approval.approvalId);
      return;
    }

    const text = this.formatApprovalMessage(approval);
    const replyMarkup = this.createApprovalButtons(approval.approvalId);
    
    try {
      const response = await fetch(`${this.baseUrl}/editMessageText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          message_id: approval.telegramMessageId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: JSON.stringify(replyMarkup)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[TELEGRAM] Error updating message:', errorData);
      } else {
        console.log('[TELEGRAM] Message updated successfully for approval:', approval.approvalId);
      }
    } catch (error) {
      console.error('[TELEGRAM] Error updating approval message:', error);
    }
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
    const { data, from, message } = callbackQuery;
    
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

        // Editar a mensagem original no Telegram (manter todas as informações e mostrar como pago)
        try {
          let updatedText = `🎁 <b>Giveaway Aprovado</b>\n\n🎰 <b>Casino:</b> ${approval.casino}\n💰 <b>Prêmio:</b> ${approval.prize}\n👤 <b>Usuário:</b> ${approval.userTag}\n🎫 <b>Ticket:</b> #${approval.ticketNumber}`;
          
          // Adicionar ID BCGame se existir
          if (approval.bcGameId) {
            updatedText += `\n🆔 <b>ID BCGame:</b> ${approval.bcGameId}`;
          }
          
          // Adicionar endereço LTC
          updatedText += `\n💳 <b>Endereço LTC:</b> ${approval.ltcAddress}`;
          
          // Adicionar status de pagamento
          updatedText += `\n\n✅ <b>Pago com sucesso por @${from.username}</b>`;
          
          await fetch(`${this.baseUrl}/editMessageText`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: this.chatId,
              message_id: message.message_id,
              text: updatedText,
              parse_mode: 'HTML',
              reply_markup: JSON.stringify({ inline_keyboard: [] }) // Remove botões
            })
          });
        } catch (error) {
          console.error('[TELEGRAM] Erro ao editar mensagem:', error);
        }

        // Enviar mensagem para o ticket no Discord (igual ao Discord)
        try {
          const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
          if (ticketChannel) {
            const EmbedFactory = require('../utils/embeds');
            await ticketChannel.send({
              embeds: [EmbedFactory.giveawayPaid()]
            });
          }
        } catch (error) {
          console.error('[TELEGRAM] Erro ao enviar mensagem para ticket Discord:', error);
        }

        // NOVO: Apagar mensagem de aprovação no Discord (igual ao Discord)
        try {
          const { CHANNELS } = require('../config/constants');
          const approveChannel = await client.channels.fetch(CHANNELS.APPROVE);
          if (approveChannel) {
            const messages = await approveChannel.messages.fetch({ limit: 100 });
            const approvalMessage = messages.find(m => {
              if (m.embeds.length === 0) return false;
              
              const embed = m.embeds[0];
              const embedText = [
                embed.title,
                embed.description,
                ...(embed.fields || []).map(f => f.value)
              ].filter(Boolean).join(' ');
              
              return embedText.includes(`#${approval.ticketNumber}`) || 
                     embedText.includes(`Ticket #${approval.ticketNumber}`) ||
                     embedText.includes(`ticket-${approval.ticketNumber}`);
            });
            
            if (approvalMessage) {
              await approvalMessage.delete();
              console.log(`🗑️ Deleted approval message for ticket #${approval.ticketNumber}`);
            } else {
              console.log(`⚠️ Approval message not found for ticket #${approval.ticketNumber}`);
            }
          }
        } catch (error) {
          console.error('[TELEGRAM] Erro ao apagar mensagem de aprovação no Discord:', error);
        }

        // NOVO: Adicionar cargo de verificação para o usuário (igual ao Discord)
        try {
          const casinos = require('../events/casinos');
          const casino = casinos[approval.casino];
          
          if (casino && casino.cargoafiliado) {
            const guild = client.guilds.cache.first();
            if (guild) {
              // Verificar se o cargo existe
              const role = await guild.roles.fetch(casino.cargoafiliado);
              if (!role) {
                console.log(`⚠️ Role ${casino.cargoafiliado} not found for casino ${approval.casino}`);
                return;
              }
              
              const member = await guild.members.fetch(approval.userId);
              if (member) {
                await member.roles.add(casino.cargoafiliado);
                console.log(`✅ Added verification role ${casino.cargoafiliado} (${role.name}) to user ${approval.userTag} for casino ${approval.casino}`);
              }
            }
          } else {
            console.log(`⚠️ No cargoafiliado configured for casino ${approval.casino}`);
          }
        } catch (error) {
          console.error('Error adding verification role:', error);
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

        // Tentar implementar modal no Telegram (se não der, usar mensagem simples)
        try {
          // Enviar mensagem pedindo motivo
          await this.sendMessage(`📝 <b>Rejeição de Giveaway</b>\n\n🎫 <b>Ticket:</b> #${approval.ticketNumber}\n👤 <b>Usuário:</b> ${approval.userTag}\n\nPor favor, envie o motivo da rejeição em uma mensagem separada.`);
          
          // Armazenar estado de espera para este approval
          this.pendingRejections = this.pendingRejections || new Map();
          this.pendingRejections.set(approvalId, {
            approval,
            userId: from.id,
            username: from.username,
            messageId: message.message_id,
            timestamp: Date.now()
          });
          
          // Timeout para limpar após 5 minutos
          setTimeout(() => {
            this.pendingRejections.delete(approvalId);
          }, 5 * 60 * 1000);
          
          return;
          
        } catch (error) {
          console.error('[TELEGRAM] Erro ao implementar modal, usando rejeição simples:', error);
          
          // Fallback: rejeição simples
          await this.processRejection(approval, from, 'Rejeitado via Telegram', client, message.message_id);
        }

      } catch (error) {
        console.error('[TELEGRAM] Erro ao processar rejeição:', error);
        await this.sendMessage(`❌ Erro ao processar rejeição: ${error.message}`);
      }
    }
  }

  // Método para processar mensagens de texto
  async handleMessage(message, client) {
    const { text, from } = message;
    
    // Verificar se é uma resposta a uma rejeição pendente
    if (this.pendingRejections && text) {
      for (const [approvalId, pendingData] of this.pendingRejections.entries()) {
        if (pendingData.userId === from.id) {
          console.log(`[TELEGRAM] Motivo de rejeição recebido para approval ${approvalId}: ${text}`);
          
          // Processar a rejeição com o motivo
          await this.processRejection(pendingData.approval, from, text, client, pendingData.messageId);
          
          // Limpar o estado pendente
          this.pendingRejections.delete(approvalId);
          
          // Confirmar recebimento
          await this.sendMessage(`✅ <b>Rejeição processada</b>\n\n🎫 <b>Ticket:</b> #${pendingData.approval.ticketNumber}\n📝 <b>Motivo:</b> ${text}\n\nA rejeição foi aplicada com sucesso.`);
          
          return;
        }
      }
    }
    
    // Outras mensagens podem ser processadas aqui
    console.log(`[TELEGRAM] Mensagem de @${from.username}: ${text}`);
  }

  // Método auxiliar para processar rejeição
  async processRejection(approval, from, reason, client, messageId = null) {
    // Atualizar status para rejected
    await client.db.updateApproval(approval.approvalId, 'rejected');

    // Editar a mensagem original no Telegram (manter todas as informações e mostrar rejeição)
    if (messageId) {
      try {
        let updatedText = `🎁 <b>Giveaway Aprovado</b>\n\n🎰 <b>Casino:</b> ${approval.casino}\n💰 <b>Prêmio:</b> ${approval.prize}\n👤 <b>Usuário:</b> ${approval.userTag}\n🎫 <b>Ticket:</b> #${approval.ticketNumber}`;
        
        // Adicionar ID BCGame se existir
        if (approval.bcGameId) {
          updatedText += `\n🆔 <b>ID BCGame:</b> ${approval.bcGameId}`;
        }
        
        // Adicionar endereço LTC
        updatedText += `\n💳 <b>Endereço LTC:</b> ${approval.ltcAddress}`;
        
        // Adicionar status de rejeição
        updatedText += `\n\n❌ <b>Não aprovado por @${from.username}</b>\n📝 <b>Motivo:</b> ${reason}`;
        
        await fetch(`${this.baseUrl}/editMessageText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({ inline_keyboard: [] }) // Remove botões
          })
        });
      } catch (error) {
        console.error('[TELEGRAM] Erro ao editar mensagem:', error);
      }
    }

    // Enviar mensagem para o ticket no Discord (igual ao Discord)
    try {
      const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
      if (ticketChannel) {
        const EmbedFactory = require('../utils/embeds');
        const ComponentFactory = require('../utils/components');
        
        const embed = EmbedFactory.rejectionReason(reason);
        const components = ComponentFactory.rejectionButtons();

        await ticketChannel.send({
          embeds: [embed],
          components: [components]
        });
      }
    } catch (error) {
      console.error('[TELEGRAM] Erro ao enviar mensagem para ticket Discord:', error);
    }

    // NOVO: Apagar mensagem de aprovação no Discord (igual ao Discord)
    try {
      const { CHANNELS } = require('../config/constants');
      const approveChannel = await client.channels.fetch(CHANNELS.APPROVE);
      if (approveChannel) {
        const messages = await approveChannel.messages.fetch({ limit: 100 });
        const approvalMessage = messages.find(m => {
          if (m.embeds.length === 0) return false;
          
          const embed = m.embeds[0];
          const embedText = [
            embed.title,
            embed.description,
            ...(embed.fields || []).map(f => f.value)
          ].filter(Boolean).join(' ');
          
          return embedText.includes(`#${approval.ticketNumber}`) || 
                 embedText.includes(`Ticket #${approval.ticketNumber}`) ||
                 embedText.includes(`ticket-${approval.ticketNumber}`);
        });
        
        if (approvalMessage) {
          await approvalMessage.delete();
          console.log(`🗑️ Deleted approval message for ticket #${approval.ticketNumber}`);
        } else {
          console.log(`⚠️ Approval message not found for ticket #${approval.ticketNumber}`);
        }
      }
    } catch (error) {
      console.error('[TELEGRAM] Erro ao apagar mensagem de aprovação no Discord:', error);
    }

    // Log da ação
    await client.db.logAction(approval.ticketChannelId, from.id, 'giveaway_rejected_telegram', `Ticket #${approval.ticketNumber} - Rejeitado por @${from.username} - Motivo: ${reason}`);
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