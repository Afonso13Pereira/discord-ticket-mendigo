const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.db = new Database(path.join(__dirname, '..', 'bot.db'));
    this.initTables();
  }

  initTables() {
    // Tabela para estados de tickets
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_states (
        channel_id TEXT PRIMARY KEY,
        owner_tag TEXT NOT NULL,
        gw_type TEXT,
        casino TEXT,
        step INTEGER DEFAULT 0,
        await_confirm BOOLEAN DEFAULT FALSE,
        await_proof BOOLEAN DEFAULT FALSE,
        prize TEXT,
        telegram_code TEXT,
        telegram_has_img BOOLEAN DEFAULT FALSE,
        step4_has_img BOOLEAN DEFAULT FALSE,
        step4_has_addr BOOLEAN DEFAULT FALSE,
        ltc_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela para promoções
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS promotions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        end_date TEXT NOT NULL,
        casino TEXT NOT NULL,
        color TEXT DEFAULT 'grey',
        emoji TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela para categorias
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT 'grey',
        emoji TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela para logs de ações
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT,
        user_id TEXT,
        action TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // === TICKET STATES ===
  saveTicketState(channelId, state) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ticket_states (
        channel_id, owner_tag, gw_type, casino, step, await_confirm, 
        await_proof, prize, telegram_code, telegram_has_img, 
        step4_has_img, step4_has_addr, ltc_address, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      channelId,
      state.ownerTag || null,
      state.gwType || null,
      state.casino || null,
      state.step || 0,
      state.awaitConfirm || false,
      state.awaitProof || false,
      state.prize || null,
      state.telegramCode || null,
      state.telegramHasImg || false,
      state.step4HasImg || false,
      state.step4HasAddr || false,
      state.ltcAddress || null
    );
  }

  getTicketState(channelId) {
    const stmt = this.db.prepare('SELECT * FROM ticket_states WHERE channel_id = ?');
    const row = stmt.get(channelId);
    
    if (!row) return null;
    
    return {
      ownerTag: row.owner_tag,
      gwType: row.gw_type,
      casino: row.casino,
      step: row.step,
      awaitConfirm: row.await_confirm,
      awaitProof: row.await_proof,
      prize: row.prize,
      telegramCode: row.telegram_code,
      telegramHasImg: row.telegram_has_img,
      step4HasImg: row.step4_has_img,
      step4HasAddr: row.step4_has_addr,
      ltcAddress: row.ltc_address
    };
  }

  deleteTicketState(channelId) {
    const stmt = this.db.prepare('DELETE FROM ticket_states WHERE channel_id = ?');
    stmt.run(channelId);
  }

  getAllTicketStates() {
    const stmt = this.db.prepare('SELECT * FROM ticket_states');
    const rows = stmt.all();
    
    const states = new Map();
    rows.forEach(row => {
      states.set(row.channel_id, {
        ownerTag: row.owner_tag,
        gwType: row.gw_type,
        casino: row.casino,
        step: row.step,
        awaitConfirm: row.await_confirm,
        awaitProof: row.await_proof,
        prize: row.prize,
        telegramCode: row.telegram_code,
        telegramHasImg: row.telegram_has_img,
        step4HasImg: row.step4_has_img,
        step4HasAddr: row.step4_has_addr,
        ltcAddress: row.ltc_address
      });
    });
    
    return states;
  }

  // === PROMOTIONS ===
  savePromotion(id, promo) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO promotions (id, name, end_date, casino, color, emoji, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, promo.name, promo.end, promo.casino, promo.color || 'grey', promo.emoji, promo.active);
  }

  getPromotions() {
    const stmt = this.db.prepare('SELECT * FROM promotions');
    const rows = stmt.all();
    
    const promos = {};
    rows.forEach(row => {
      promos[row.id] = {
        name: row.name,
        end: row.end_date,
        casino: row.casino,
        color: row.color,
        emoji: row.emoji,
        active: row.active,
        created: new Date(row.created_at).getTime()
      };
    });
    
    return promos;
  }

  // === CATEGORIES ===
  saveCategory(id, category) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, color, emoji, active)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, category.name, category.color || 'grey', category.emoji, category.active);
  }

  getCategories() {
    const stmt = this.db.prepare('SELECT * FROM categories');
    const rows = stmt.all();
    
    const cats = {};
    rows.forEach(row => {
      cats[row.id] = {
        name: row.name,
        color: row.color,
        emoji: row.emoji,
        active: row.active,
        created: new Date(row.created_at).getTime()
      };
    });
    
    return cats;
  }

  // === LOGS ===
  logAction(channelId, userId, action, details = null) {
    const stmt = this.db.prepare(`
      INSERT INTO action_logs (channel_id, user_id, action, details)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(channelId, userId, action, details);
  }

  // === CLEANUP ===
  cleanupOldTickets(daysOld = 7) {
    const stmt = this.db.prepare(`
      DELETE FROM ticket_states 
      WHERE created_at < datetime('now', '-${daysOld} days')
    `);
    
    return stmt.run().changes;
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;