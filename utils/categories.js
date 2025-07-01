const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let cats = {};

async function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    // Wait a bit for connection to establish
    setTimeout(async () => {
      cats = await db.getCategories();
    }, 1000);
  }
}

async function create(name, color, emoji) {
  await initDatabase();
  const id = randomUUID().slice(0, 8);
  const category = { name, color, emoji, active: true, created: Date.now() };
  
  cats[id] = category;
  await db.saveCategory(id, category);
  
  return id;
}

async function close(id) {
  await initDatabase();
  if (cats[id]) {
    cats[id].active = false;
    await db.saveCategory(id, cats[id]);
  }
}

async function list() {
  await initDatabase();
  return Object.entries(cats).sort((a, b) => b[1].created - a[1].created);
}

// Initialize on module load
initDatabase();

module.exports = { cats, create, close, list };