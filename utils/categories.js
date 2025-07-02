const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let cats = {};
let initialized = false;

async function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    
    // Wait for database connection and load categories
    const waitForConnection = () => {
      return new Promise((resolve) => {
        const checkConnection = async () => {
          if (db.connected) {
            try {
              cats = await db.getCategories();
              initialized = true;
              console.log(`✅ Loaded ${Object.keys(cats).length} categories from database`);
              resolve();
            } catch (error) {
              console.error('Error loading categories:', error);
              setTimeout(checkConnection, 1000);
            }
          } else {
            setTimeout(checkConnection, 500);
          }
        };
        checkConnection();
      });
    };
    
    await waitForConnection();
  }
}

async function create(name, color, emoji) {
  await ensureInitialized();
  const id = randomUUID().slice(0, 8);
  const category = { name, color, emoji, active: true, created: Date.now() };
  
  cats[id] = category;
  await db.saveCategory(id, category);
  
  console.log(`✅ Created category: ${name} (ID: ${id})`);
  return id;
}

async function close(id) {
  await ensureInitialized();
  if (cats[id]) {
    cats[id].active = false;
    await db.saveCategory(id, cats[id]);
    console.log(`✅ Closed category: ${cats[id].name} (ID: ${id})`);
  }
}

async function list() {
  await ensureInitialized();
  return Object.entries(cats).sort((a, b) => b[1].created - a[1].created);
}

async function ensureInitialized() {
  if (!initialized) {
    await initDatabase();
  }
}

async function refreshCategories() {
  if (db && db.connected) {
    try {
      cats = await db.getCategories();
      console.log(`🔄 Refreshed ${Object.keys(cats).length} categories from database`);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  }
}

// Initialize on module load
initDatabase();

module.exports = { cats, create, close, list, refreshCategories, ensureInitialized };