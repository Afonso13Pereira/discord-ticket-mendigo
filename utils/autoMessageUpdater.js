// utils/autoMessageUpdater.js
const EmbedFactory = require('./embeds');
const ComponentFactory = require('./components');
const { CHANNELS } = require('../config/constants');

class AutoMessageUpdater {
  constructor(client) {
    this.client = client;
    this.updateQueue = new Map(); // Evita atualizações simultâneas
    this.updateTimeout = 1000; // 1 segundo de delay
  }

  // Atualizar mensagens automaticamente quando ticket state mudar
  async updateTicketMessages(channelId, ticketState) {
    if (this.updateQueue.has(channelId)) {
      console.log(`[AUTO-UPDATE] Update já em andamento para ${channelId}, aguardando...`);
      return;
    }

    this.updateQueue.set(channelId, true);
    
    try {
      console.log(`[AUTO-UPDATE] Iniciando atualização automática para ticket ${channelId}`);
      
      // Buscar approval relacionada
      const approval = await this.client.db.Approval.findOne({ 
        ticketChannelId: channelId, 
        status: 'pending' 
      });

      if (approval) {
        console.log(`[AUTO-UPDATE] Encontrada approval ${approval.approvalId}, atualizando mensagens...`);
        await this.updateApprovalMessages(approval, ticketState);
      } else {
        console.log(`[AUTO-UPDATE] Nenhuma approval encontrada para ${channelId}`);
      }

      // Aguardar um pouco antes de permitir nova atualização
      setTimeout(() => {
        this.updateQueue.delete(channelId);
      }, this.updateTimeout);

    } catch (error) {
      console.error(`[AUTO-UPDATE] Erro ao atualizar mensagens para ${channelId}:`, error);
      this.updateQueue.delete(channelId);
    }
  }

  // Atualizar mensagens de approval
  async updateApprovalMessages(approval, ticketState) {
    try {
      // Atualizar approval no banco com dados do ticket state
      const updatedApproval = await this.client.db.updateApprovalFields(approval.approvalId, {
        casino: ticketState.casino || approval.casino,
        prize: ticketState.prize || approval.prize,
        bcGameId: ticketState.bcGameId || approval.bcGameId,
        ltcAddress: ticketState.ltcAddress || approval.ltcAddress
      });

      if (!updatedApproval) {
        console.log(`[AUTO-UPDATE] Falha ao atualizar approval ${approval.approvalId}`);
        return;
      }

      // Buscar approval atualizada
      const finalApproval = await this.client.db.getApproval(approval.approvalId);
      
      // Atualizar mensagem no Discord
      if (finalApproval.discordMessageId) {
        await this.updateDiscordMessage(finalApproval);
      }

      // Atualizar mensagem no Telegram
      if (finalApproval.telegramMessageId) {
        await this.updateTelegramMessage(finalApproval);
      }

      console.log(`[AUTO-UPDATE] Mensagens atualizadas com sucesso para approval ${approval.approvalId}`);

    } catch (error) {
      console.error(`[AUTO-UPDATE] Erro ao atualizar mensagens de approval:`, error);
    }
  }

  // Atualizar mensagem no Discord
  async updateDiscordMessage(approval) {
    try {
      const approveChannel = await this.client.channels.fetch(CHANNELS.APPROVE);
      const discordMessage = await approveChannel.messages.fetch(approval.discordMessageId);
      
      const updatedEmbed = EmbedFactory.approvalFinal(
        approval.casino,
        approval.prize,
        approval.userTag,
        approval.ticketNumber,
        approval.ltcAddress,
        approval.bcGameId,
        approval.isVerified,
        approval.bcGameProfileImage
      );
      
      const components = ComponentFactory.approvalButtons(approval.approvalId, approval.ticketChannelId);
      
      await discordMessage.edit({
        embeds: [updatedEmbed],
        components: [components]
      });
      
      console.log(`[AUTO-UPDATE] Mensagem Discord atualizada para approval ${approval.approvalId} usando discordMessageId: ${approval.discordMessageId}`);
      
    } catch (error) {
      console.error(`[AUTO-UPDATE] Erro ao atualizar mensagem Discord:`, error);
    }
  }

  // Atualizar mensagem no Telegram
  async updateTelegramMessage(approval) {
    try {
      const telegramService = require('./telegram');
      await telegramService.updateApprovalMessage(approval);
      console.log(`[AUTO-UPDATE] Mensagem Telegram atualizada para approval ${approval.approvalId} usando telegramMessageId: ${approval.telegramMessageId}`);
      
    } catch (error) {
      console.error(`[AUTO-UPDATE] Erro ao atualizar mensagem Telegram:`, error);
    }
  }

  // Hook para ser chamado sempre que ticket state mudar
  async onTicketStateChange(channelId, ticketState) {
    console.log(`[AUTO-UPDATE] Ticket state mudou para ${channelId}, iniciando atualização automática...`);
    await this.updateTicketMessages(channelId, ticketState);
  }

  // Hook para ser chamado sempre que approval mudar
  async onApprovalChange(approvalId) {
    try {
      const approval = await this.client.db.getApproval(approvalId);
      if (approval) {
        console.log(`[AUTO-UPDATE] Approval ${approvalId} mudou, iniciando atualização automática...`);
        await this.updateApprovalMessages(approval, null);
      }
    } catch (error) {
      console.error(`[AUTO-UPDATE] Erro ao processar mudança de approval:`, error);
    }
  }
}

module.exports = AutoMessageUpdater; 