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
              console.log(`✅ Loaded ${Object.keys(cats).length} categories from database:`, Object.keys(cats));
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
  console.log(`📋 Current categories in memory:`, Object.keys(cats));
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
  // CORREÇÃO: Garantir que temos as categorias mais recentes
  await refreshCategories();
  
  console.log(`📋 list() called. Categories in memory:`, Object.keys(cats));
  const result = Object.entries(cats).sort((a, b) => b[1].created - a[1].created);
  console.log(`📋 list() returning ${result.length} categories`);
  return result;
}

async function ensureInitialized() {
  if (!initialized) {
    console.log('🔄 Categories not initialized, initializing...');
    await initDatabase();
  }
}

async function refreshCategories() {
  if (db && db.connected) {
    try {
      const freshCats = await db.getCategories();
      cats = freshCats;
      console.log(`🔄 Refreshed ${Object.keys(cats).length} categories from database:`, Object.keys(cats));
      
      // Log active categories
      const activeCats = Object.entries(cats).filter(([id, cat]) => cat.active);
      console.log(`📋 Active categories:`, activeCats.map(([id, cat]) => `${cat.name} (${id})`));
      
      return cats;
    } catch (error) {
      console.error('Error refreshing categories:', error);
      return cats;
    }
  }
  return cats;
}

// Force refresh function for debugging
async function forceRefresh() {
  if (db && db.connected) {
    cats = await db.getCategories();
    console.log(`🔄 FORCE refreshed categories:`, Object.keys(cats));
    return cats;
  }
  return cats;
}

// Initialize on module load
initDatabase();

module.exports = { cats, create, close, list, refreshCategories, ensureInitialized, forceRefresh };