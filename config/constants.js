// config/constants.js
module.exports = {
  CHANNELS: {
    READY: '1386488872799567902',
    RESULT: '1386489439680987218',
    STAFF: process.env.STAFF_CHANNEL_ID,
    LOGS: process.env.LOGS_CHANNEL_ID,
    TRANSCRIPTS: process.env.TRANSCRIPTS_CHANNEL_ID,
    MOD: process.env.MOD_CHANNEL_ID || '1386488872799567902',
    APPROVE: process.env.APROVE_CHANNEL_ID || '1386489439680987218'
  },

  ROLES: {
    MOD: process.env.MOD_ID || '1386505412718887073'
  },

  COLORS: {
    PRIMARY: 0x5865f2,    // Discord Blurple
    SUCCESS: 0x00d26a,    // Green
    WARNING: 0xfaa61a,    // Orange
    DANGER: 0xed4245,     // Red
    SECONDARY: 0x747f8d,  // Gray
    INFO: 0x00b0f4,       // Light Blue
    GOLD: 0xf1c40f,       // Gold
    PURPLE: 0x9b59b6      // Purple
  },

  EMOJIS: {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    STAR: '⭐',
    GIFT: '🎁',
    ROBOT: '🤖',
    TICKET: '🎫',
    CASINO: '🎰',
    MONEY: '💰',
    DIAMOND: '💎',
    FIRE: '🔥',
    CROWN: '👑',
    SHIELD: '🛡️',
    VIP: '💎',
    QUESTION: '❓',
    THUMBSUP: '👍'
  },

  ICONS: {
    info: 'https://cdn.discordapp.com/attachments/123456789/info.png',
    success: 'https://cdn.discordapp.com/attachments/123456789/success.png',
    warning: 'https://cdn.discordapp.com/attachments/123456789/warning.png',
    error: 'https://cdn.discordapp.com/attachments/123456789/error.png',
    casino: 'https://cdn.discordapp.com/attachments/123456789/casino.png',
    ticket: 'https://cdn.discordapp.com/attachments/123456789/ticket.png'
  },

  IMAGES: {
    welcome: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    celebration: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    loading: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'
  },

  VIP_TYPES: {
    SEMANAL: 'semanal',
    LEADERBOARD: 'leaderboard'
  },

  VIP_CASINOS: [
    { id: 'BCGame', label: 'BC.Game', emoji: '🎲' }
    // Adicionar mais casinos VIP aqui conforme necessário
  ]
};