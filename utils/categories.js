const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let cats = {};

function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    cats = db.getCategories();
  }
}

function create(name, color, emoji) {
  initDatabase();
  const id = randomUUID().slice(0, 8);
  const category = { name, color, emoji, active: true, created: Date.now() };
  
  cats[id] = category;
  db.saveCategory(id, category);
  
  return id;
}

function close(id) {
  initDatabase();
  if (cats[id]) {
    cats[id].active = false;
    db.saveCategory(id, cats[id]);
  }
}

function list() {
  initDatabase();
  return Object.entries(cats).sort((a, b) => b[1].created - a[1].created);
}

// Initialize on module load
initDatabase();

module.exports = { cats, create, close, list };