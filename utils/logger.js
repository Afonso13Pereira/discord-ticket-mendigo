// utils/logger.js
class Logger {
  static info(message, context = '') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = context ? `[${context}]` : '[INFO]';
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  static success(message, context = '') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = context ? `[${context}]` : '[SUCCESS]';
    console.log(`${timestamp} ${prefix} ✅ ${message}`);
  }

  static error(message, context = '') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = context ? `[${context}]` : '[ERROR]';
    console.log(`${timestamp} ${prefix} ❌ ${message}`);
  }

  static warning(message, context = '') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = context ? `[${context}]` : '[WARNING]';
    console.log(`${timestamp} ${prefix} ⚠️ ${message}`);
  }

  // Logs específicos para tickets
  static ticket(message, ticketNumber = '') {
    const prefix = ticketNumber ? `[TICKET #${ticketNumber}]` : '[TICKET]';
    this.info(message, prefix);
  }

  // Logs específicos para Telegram
  static telegram(message) {
    this.info(message, 'TELEGRAM');
  }

  // Logs específicos para banco de dados
  static database(message) {
    this.info(message, 'DB');
  }

  // Logs específicos para edição
  static edit(message) {
    this.info(message, 'EDIT');
  }
}

module.exports = Logger; 