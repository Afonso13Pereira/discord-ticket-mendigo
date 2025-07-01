const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let promos = {};

function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    promos = db.getPromotions();
  }
}

function create(name, endISO, casino, color, emoji) {
  initDatabase();
  const id = randomUUID().slice(0, 8);
  const promo = { name, end: endISO, casino, color, emoji, active: true, created: Date.now() };
  
  promos[id] = promo;
  db.savePromotion(id, promo);
  
  return id;
}

function close(id) {
  initDatabase();
  if (promos[id]) {
    promos[id].active = false;
    db.savePromotion(id, promos[id]);
  }
}

function refreshExpired() {
  initDatabase();
  const now = Date.now();
  let changed = false;
  
  for (const [id, p] of Object.entries(promos)) {
    if (p.active && now > new Date(p.end).getTime()) {
      p.active = false;
      db.savePromotion(id, p);
      changed = true;
    }
  }
  
  return changed;
}

function list() {
  refreshExpired();
  return Object.entries(promos).sort((a, b) => b[1].created - a[1].created);
}

// Initialize on module load
initDatabase();

module.exports = { promos, create, close, list, refreshExpired };