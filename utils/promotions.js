const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let promos = {};

async function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    // Wait a bit for connection to establish
    setTimeout(async () => {
      promos = await db.getPromotions();
    }, 1000);
  }
}

async function create(name, endISO, casino, color, emoji) {
  await initDatabase();
  const id = randomUUID().slice(0, 8);
  const promo = { name, end: endISO, casino, color, emoji, active: true, created: Date.now() };
  
  promos[id] = promo;
  await db.savePromotion(id, promo);
  
  return id;
}

async function close(id) {
  await initDatabase();
  if (promos[id]) {
    promos[id].active = false;
    await db.savePromotion(id, promos[id]);
  }
}

async function refreshExpired() {
  await initDatabase();
  const now = Date.now();
  let changed = false;
  
  for (const [id, p] of Object.entries(promos)) {
    if (p.active && now > new Date(p.end).getTime()) {
      p.active = false;
      await db.savePromotion(id, p);
      changed = true;
    }
  }
  
  return changed;
}

async function list() {
  await refreshExpired();
  return Object.entries(promos).sort((a, b) => b[1].created - a[1].created);
}

// Initialize on module load
initDatabase();

module.exports = { promos, create, close, list, refreshExpired };