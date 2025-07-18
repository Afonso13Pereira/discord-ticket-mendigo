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
              const freshCats = await db.getCategories();
              
              // CORREÇÃO CRÍTICA: Limpar completamente e recarregar
              Object.keys(cats).forEach(key => delete cats[key]);
              Object.assign(cats, freshCats);
              
              initialized = true;
              console.log(`✅ Loaded ${Object.keys(cats).length} categories from database:`, Object.keys(cats));
              
              // Log each category for debugging
              Object.entries(cats).forEach(([id, cat]) => {
                console.log(`  📋 Category: ${cat.name} (${id}) - active: ${cat.active}`);
              });
              
              resolve();
            } catch (error) {
              console.error('Error loading categories:', error);
              setTimeout(checkConnection, 1000);
            }
          } else {
            console.log('⏳ Waiting for database connection...');
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
  
  // Save to database first
  await db.saveCategory(id, category);
  
  // Then update memory
  cats[id] = category;
  
  console.log(`✅ Created category: ${name} (ID: ${id})`);
  console.log(`📋 Current categories in memory:`, Object.keys(cats));
  
  // Force refresh to ensure consistency
  await refreshCategories();
  
      // Note: Ticket message update is handled by the command that calls this function
  
  return id;
}

async function close(id) {
  await ensureInitialized();
  if (cats[id]) {
    cats[id].active = false;
    await db.saveCategory(id, cats[id]);
    console.log(`✅ Closed category: ${cats[id].name} (ID: ${id})`);
    
    // Force refresh to ensure consistency
    await refreshCategories();
    
    // Note: Ticket message update is handled by the command that calls this function
  }
}

async function list() {
  await ensureInitialized();
  await refreshCategories();
  
  console.log(`📋 list() called. Categories in memory:`, Object.keys(cats));
  const result = Object.entries(cats).sort((a, b) => b[1].created - a[1].created);
  console.log(`📋 list() returning ${result.length} categories`);
  return result;
}

async function ensureInitialized() {
  if (!initialized || !db || !db.connected) {
    console.log('🔄 Categories not initialized or DB not connected, initializing...');
    await initDatabase();
  }
}

async function refreshCategories() {
  await ensureInitialized();
  
  if (db && db.connected) {
    try {
      console.log('🔄 Refreshing categories from database...');
      const freshCats = await db.getCategories();
      
      console.log(`🔍 Database returned ${Object.keys(freshCats).length} categories:`, Object.keys(freshCats));
      
      // CORREÇÃO CRÍTICA: Limpar completamente e recarregar
      Object.keys(cats).forEach(key => delete cats[key]);
      Object.assign(cats, freshCats);
      
      console.log(`✅ Refreshed ${Object.keys(cats).length} categories in memory:`, Object.keys(cats));
      
      // Log active categories
      const activeCats = Object.entries(cats).filter(([id, cat]) => cat.active);
      console.log(`📋 Active categories after refresh:`, activeCats.map(([id, cat]) => `${cat.name} (${id})`));
      
      return cats;
    } catch (error) {
      console.error('❌ Error refreshing categories:', error);
      return cats;
    }
  } else {
    console.log('❌ Database not connected, cannot refresh categories');
    return cats;
  }
}

// Force refresh function for debugging
async function forceRefresh() {
  console.log('🔄 FORCE REFRESH: Starting...');
  
  if (db && db.connected) {
    try {
      const freshCats = await db.getCategories();
      console.log(`🔍 FORCE REFRESH: Database has ${Object.keys(freshCats).length} categories`);
      
      // Clear and reassign
      Object.keys(cats).forEach(key => delete cats[key]);
      Object.assign(cats, freshCats);
      
      console.log(`✅ FORCE REFRESH: Memory now has ${Object.keys(cats).length} categories:`, Object.keys(cats));
      return cats;
    } catch (error) {
      console.error('❌ FORCE REFRESH: Error:', error);
      return cats;
    }
  } else {
    console.log('❌ FORCE REFRESH: Database not connected');
    return cats;
  }
}

// Get categories directly from database (for debugging)
async function getCategoriesFromDB() {
  await ensureInitialized();
  if (db && db.connected) {
    try {
      const dbCats = await db.getCategories();
      console.log(`🔍 Direct DB query returned ${Object.keys(dbCats).length} categories:`, Object.keys(dbCats));
      return dbCats;
    } catch (error) {
      console.error('❌ Error getting categories from DB:', error);
      return {};
    }
  }
  return {};
}

// Initialize on module load
initDatabase();

module.exports = { cats, create, close, list, refreshCategories, ensureInitialized, forceRefresh, getCategoriesFromDB };