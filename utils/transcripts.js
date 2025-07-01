const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

class TranscriptManager {
  constructor(db) {
    this.db = db;
  }

  async generateTranscript(channel, ticketState) {
    try {
      // Fetch all messages from the channel
      const messages = [];
      let lastMessageId = null;
      
      while (true) {
        const options = { limit: 100 };
        if (lastMessageId) options.before = lastMessageId;
        
        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;
        
        messages.push(...batch.values());
        lastMessageId = batch.last().id;
      }

      // Sort messages by creation time (oldest first)
      messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      // Generate transcript content
      const transcript = this.formatTranscript(channel, messages, ticketState);
      
      // Save to database with 2-week expiration
      const transcriptId = await this.db.saveTranscript(
        channel.id,
        channel.name,
        ticketState.ownerTag,
        transcript,
        14 // 14 days expiration
      );

      return transcriptId;
    } catch (error) {
      console.error('Error generating transcript:', error);
      throw error;
    }
  }

  formatTranscript(channel, messages, ticketState) {
    const header = [
      '═══════════════════════════════════════',
      '           TRANSCRIPT DO TICKET',
      '═══════════════════════════════════════',
      '',
      `📋 Canal: #${channel.name}`,
      `👤 Usuário: ${ticketState.ownerTag}`,
      `📅 Data de Criação: ${new Date(channel.createdTimestamp).toLocaleString('pt-PT')}`,
      `📊 Total de Mensagens: ${messages.length}`,
      '',
      '═══════════════════════════════════════',
      ''
    ].join('\n');

    const messageContent = messages.map(msg => {
      const timestamp = new Date(msg.createdTimestamp).toLocaleString('pt-PT');
      const author = msg.author.bot ? `🤖 ${msg.author.username}` : `👤 ${msg.author.username}`;
      
      let content = `[${timestamp}] ${author}:\n`;
      
      if (msg.content) {
        content += `   ${msg.content}\n`;
      }
      
      if (msg.attachments.size > 0) {
        msg.attachments.forEach(attachment => {
          content += `   📎 Anexo: ${attachment.name} (${attachment.url})\n`;
        });
      }
      
      if (msg.embeds.length > 0) {
        msg.embeds.forEach(embed => {
          if (embed.title) content += `   📋 Embed: ${embed.title}\n`;
          if (embed.description) content += `   📝 ${embed.description.substring(0, 100)}...\n`;
        });
      }
      
      return content;
    }).join('\n');

    const footer = [
      '',
      '═══════════════════════════════════════',
      '           FIM DO TRANSCRIPT',
      `📅 Gerado em: ${new Date().toLocaleString('pt-PT')}`,
      '🔒 Este transcript expira em 2 semanas',
      '═══════════════════════════════════════'
    ].join('\n');

    return header + messageContent + footer;
  }

  async getTranscript(transcriptId) {
    return await this.db.getTranscript(transcriptId);
  }

  async deleteExpiredTranscripts() {
    return await this.db.cleanupExpiredTranscripts();
  }
}

module.exports = TranscriptManager;