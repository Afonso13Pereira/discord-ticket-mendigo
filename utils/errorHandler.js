const { EmbedBuilder } = require('discord.js');
const { CHANNELS, COLORS, EMOJIS } = require('../config/constants');
const MESSAGES = require('../config/messages');

class ErrorHandler {
  static interactionCooldowns = new Map(); // Track interaction cooldowns
  static COOLDOWN_TIME = 2000; // 2 seconds cooldown between same user interactions
  
  constructor(client) {
    this.client = client;
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // Discord.js error handlers
    this.client.on('error', (error) => {
      console.error('🚨 Discord Client Error:', error);
      this.sendErrorToSupport(error, 'Discord Client Error');
    });

    this.client.on('warn', (info) => {
      console.warn('⚠️ Discord Client Warning:', info);
      this.sendWarningToSupport(info, 'Discord Client Warning');
    });

    this.client.on('shardError', (error, shardId) => {
      console.error(`🚨 Shard ${shardId} Error:`, error);
      this.sendErrorToSupport(error, `Shard ${shardId} Error`);
    });

    // Process error handlers
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.sendErrorToSupport(error, 'Uncaught Exception', true);
      // NÃO fazer process.exit() - continuar funcionando
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Promise Rejection:', reason);
      this.sendErrorToSupport(reason, 'Unhandled Promise Rejection', true);
    });

    // Graceful shutdown handlers
    process.on('SIGINT', () => {
      console.log('🔄 Received SIGINT, shutting down gracefully...');
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      image.png('🔄 Received SIGTERM, shutting down gracefully...');
      this.gracefulShutdown();
    });

    console.log('✅ Error handlers initialized');
  }

  async sendErrorToSupport(error, context = 'Unknown', isCritical = false) {
    try {
      if (!this.client.isReady()) {
        console.error('❌ Client not ready, cannot send error to support');
        return;
      }

      const errosChannel = await this.client.channels.fetch(CHANNELS.ERROS).catch(() => null);
      if (!errosChannel || !errosChannel.send) {
        console.error('❌ ERROS_CHANNEL_ID not found, invalid, or not a text channel');
        return;
      }

      const errorMessage = error?.stack || error?.message || String(error);
      const timestamp = new Date().toLocaleString('pt-PT');
      
      // Truncate very long error messages
      const truncatedError = errorMessage.length > 1800 
        ? errorMessage.substring(0, 1800) + '...\n[TRUNCATED]'
        : errorMessage;

      const embed = new EmbedBuilder()
        .setColor(isCritical ? COLORS.DANGER : COLORS.WARNING)
        .setTitle(`${isCritical ? '🚨' : '⚠️'} ${isCritical ? 'ERRO CRÍTICO' : 'Erro do Sistema'}`)
        .setDescription(`\`\`\`javascript\n${truncatedError}\`\`\``)
        .addFields(
          { name: '📍 Contexto', value: context, inline: true },
          { name: '🕐 Timestamp', value: timestamp, inline: true },
          { name: '🔧 Severidade', value: isCritical ? 'CRÍTICA' : 'Normal', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Sistema de Monitorização de Erros' });

      await errosChannel.send({ 
        embeds: [embed],
        content: isCritical ? '@here **ERRO CRÍTICO DETECTADO**' : undefined
      });

      console.log(`✅ Error sent to support: ${context}`);
    } catch (sendError) {
      console.error('❌ Failed to send error to support:', sendError);
    }
  }

  async sendWarningToSupport(warning, context = 'Unknown') {
    try {
      if (!this.client.isReady()) return;

      const errosChannel = await this.client.channels.fetch(CHANNELS.ERROS).catch(() => null);
      if (!errosChannel || !errosChannel.send) return;

      const timestamp = new Date().toLocaleString('pt-PT');
      
      const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('⚠️ Aviso do Sistema')
        .setDescription(`\`\`\`\n${warning}\`\`\``)
        .addFields(
          { name: '📍 Contexto', value: context, inline: true },
          { name: '🕐 Timestamp', value: timestamp, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Sistema de Monitorização' });

      await errosChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Failed to send warning to support:', error);
    }
  }

  async safeExecuteCommand(interaction, command) {
    try {
      await command.execute(interaction, this.client);
    } catch (error) {
      console.error(`🚨 Command Error [${command.data?.name || 'unknown'}]:`, error);
      
      // Send error to support
      await this.sendErrorToSupport(error, `Command: ${command.data?.name || 'unknown'}`);
      
      // Respond to user with friendly message
      const errorEmbed = new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setTitle(`${EMOJIS.ERROR} Erro Interno`)
        .setDescription([
          'Ocorreu um erro interno no sistema.',
          '',
          '🛡️ **A equipa técnica foi notificada**',
          '🔄 **Tente novamente em alguns momentos**',
          '💬 **Se persistir, contacte o suporte**'
        ].join('\n'))
        .setTimestamp()
        .setFooter({ text: 'Sistema de Recuperação de Erros' });

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
      } catch (replyError) {
        console.error('❌ Failed to send error message to user:', replyError);
      }
    }
  }

  async safeExecuteEvent(eventName, eventHandler, ...args) {
    try {
      await eventHandler(...args);
    } catch (error) {
      console.error(`🚨 Event Error [${eventName}]:`, error);
      await this.sendErrorToSupport(error, `Event: ${eventName}`);
    }
  }

  static async safeExecuteInteraction(interaction, client) {
    try {
      // Check if user is on cooldown for this interaction
      const cooldownKey = `${interaction.user.id}_${interaction.customId || interaction.commandName}`;
      const now = Date.now();
      const lastInteraction = this.interactionCooldowns.get(cooldownKey);
      
      if (lastInteraction && (now - lastInteraction) < this.COOLDOWN_TIME) {
        console.log(`⏰ Cooldown active for user ${interaction.user.tag} (${interaction.customId || interaction.commandName})`);
        
        // Try to acknowledge the interaction to prevent errors
        try {
          if (interaction.isRepliable()) {
            await interaction.reply({
              content: '⏰ Por favor, aguarde um momento antes de tentar novamente.',
              ephemeral: true
            });
          } else if (interaction.isDeferred()) {
            await interaction.editReply({
              content: '⏰ Por favor, aguarde um momento antes de tentar novamente.'
            });
          }
        } catch (ackError) {
          console.log('Could not acknowledge cooldown interaction:', ackError.message);
        }
        return;
      }
      
      // Update cooldown
      this.interactionCooldowns.set(cooldownKey, now);
      
      // Clean up old cooldowns (older than 1 hour)
      if (this.interactionCooldowns.size > 1000) {
        const oneHourAgo = now - (60 * 60 * 1000);
        for (const [key, timestamp] of this.interactionCooldowns.entries()) {
          if (timestamp < oneHourAgo) {
            this.interactionCooldowns.delete(key);
          }
        }
      }
      
      // Check if interaction is still valid
      if (!interaction.isRepliable() && !interaction.isDeferred()) {
        console.log(`⚠️ Interaction ${interaction.id} is no longer valid`);
        return;
      }
      
      // Execute the interaction
      await this.executeInteraction(interaction, client);
      
    } catch (error) {
      await this.handleInteractionError(interaction, error);
    }
  }
  
  static async executeInteraction(interaction, client) {
    try {
      // Handle different interaction types
      if (interaction.isChatInputCommand()) {
        await this.handleCommand(interaction, client);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction, client);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleSelectMenu(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction, client);
      } else if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction, client);
      } else {
        console.log(`Unknown interaction type: ${interaction.type}`);
      }
    } catch (error) {
      console.error('Error executing interaction:', error);
      await this.handleInteractionError(interaction, error);
    }
  }
  
  static async handleInteractionError(interaction, error) {
    console.error(`❌ Interaction error for ${interaction.user.tag}:`, error);
    
    // Handle specific Discord API errors
    if (error.code === 10062) {
      console.log(`⚠️ Interaction ${interaction.id} expired (code 10062)`);
      return; // Don't try to respond to expired interactions
    }
    
    if (error.code === 50035) {
      console.log(`⚠️ Invalid form body error (code 50035):`, error.message);
      // This is the emoji error we saw earlier
      return;
    }
    
    // Try to send error message to user
    try {
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao processar a sua solicitação. Por favor, tente novamente.',
          ephemeral: true
        });
      } else if (interaction.isDeferred() && !interaction.replied) {
        await interaction.editReply({
          content: '❌ Ocorreu um erro ao processar a sua solicitação. Por favor, tente novamente.'
        });
      }
    } catch (responseError) {
      console.log('Could not send error response:', responseError.message);
    }
  }

  static async handleCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
      await this.safeExecuteCommand(interaction, command);
    }
  }
  
  static async handleButton(interaction, client) {
    const { execute } = require('../events/interactionCreate');
    await this.safeExecuteEvent('interactionCreate', execute, interaction, client);
  }
  
  static async handleSelectMenu(interaction, client) {
    const { execute } = require('../events/interactionCreate');
    await this.safeExecuteEvent('interactionCreate', execute, interaction, client);
  }
  
  static async handleModalSubmit(interaction, client) {
    const { execute } = require('../events/interactionCreate');
    await this.safeExecuteEvent('interactionCreate', execute, interaction, client);
  }
  
  static async handleAutocomplete(interaction, client) {
    const { execute } = require('../events/interactionCreate');
    await this.safeExecuteEvent('interactionCreate', execute, interaction, client);
  }

  // Helper method to create system error embed
  createSystemErrorEmbed() {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} ${MESSAGES.ERRORS.SYSTEM_ERROR_TITLE}`)
      .setDescription(MESSAGES.ERRORS.SYSTEM_ERROR_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.ERRORS.ERROR_RECOVERY_FOOTER });
  }

  async gracefulShutdown() {
    try {
      console.log('🔄 Starting graceful shutdown...');
      
      // Close database connections
      if (this.client.db) {
        await this.client.db.close();
        // Database connections closed
      }
      
      // Destroy Discord client
      this.client.destroy();
      console.log('✅ Discord client destroyed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Utility method to wrap async functions with error handling
  wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error('🚨 Wrapped function error:', error);
        await this.sendErrorToSupport(error, 'Wrapped Function');
        throw error; // Re-throw if needed
      }
    };
  }

  // Method to log info messages to support (for important events)
  async logToSupport(message, title = 'Informação do Sistema') {
    try {
      if (!this.client.isReady()) return;

      const otherChannel = await this.client.channels.fetch(CHANNELS.OTHER).catch(() => null);
      if (!otherChannel || !otherChannel.send) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle(`${EMOJIS.INFO} ${title}`)
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'Sistema de Logs' });

      await otherChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Failed to send log to support:', error);
    }
  }
}

module.exports = ErrorHandler;