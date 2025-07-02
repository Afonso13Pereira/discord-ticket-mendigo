const { randomUUID } = require('crypto');
const DatabaseManager = require('./database');

let db = null;
let promos = {};
let initialized = false;

async function initDatabase() {
  if (!db) {
    db = new DatabaseManager();
    
    // Wait for database connection and load promotions
    const waitForConnection = () => {
      return new Promise((resolve) => {
        const checkConnection = async () => {
          if (db.connected) {
            try {
              const freshPromos = await db.getPromotions();
              
              // CORREÇÃO CRÍTICA: Limpar completamente e recarregar
              Object.keys(promos).forEach(key => delete promos[key]);
              Object.assign(promos, freshPromos);
              
              initialized = true;
              console.log(`✅ Loaded ${Object.keys(promos).length} promotions from database`);
              
              resolve();
            } catch (error) {
              console.error('Error loading promotions:', error);
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

async function create(name, endISO, casino, color, emoji) {
  await ensureInitialized();
  const id = randomUUID().slice(0, 8);
  const promo = { name, end: endISO, casino, color, emoji, active: true, created: Date.now() };
  
  // Save to database first
  await db.savePromotion(id, promo);
  
  // Then update memory
  promos[id] = promo;
  
  console.log(`✅ Created promotion: ${name} (ID: ${id})`);
  
  // Force refresh to ensure consistency
  await refreshPromotions();
  
  return id;
}

async function close(id) {
  await ensureInitialized();
  if (promos[id]) {
    promos[id].active = false;
    await db.savePromotion(id, promos[id]);
    console.log(`✅ Closed promotion: ${promos[id].name} (ID: ${id})`);
    
    // Force refresh to ensure consistency
    await refreshPromotions();
  }
}

async function refreshExpired() {
  await ensureInitialized();
  const now = Date.now();
  let changed = false;
  
  for (const [id, p] of Object.entries(promos)) {
    if (p.active && now > new Date(p.end).getTime()) {
      p.active = false;
      await db.savePromotion(id, p);
      changed = true;
      console.log(`⏰ Expired promotion: ${p.name} (ID: ${id})`);
    }
  }
  
  return changed;
}

async function list() {
  await ensureInitialized();
  await refreshPromotions();
  await refreshExpired();
  
  console.log(`🔥 Promotions in memory: ${Object.keys(promos).length}`);
  const result = Object.entries(promos).sort((a, b) => b[1].created - a[1].created);
  return result;
}

async function ensureInitialized() {
  if (!initialized || !db || !db.connected) {
    console.log('🔄 Promotions not initialized or DB not connected, initializing...');
    await initDatabase();
  }
}

async function refreshPromotions() {
  await ensureInitialized();
  
  if (db && db.connected) {
    try {
      console.log('🔄 Refreshing promotions from database...');
      const freshPromos = await db.getPromotions();
      
      console.log(`🔍 Database returned ${Object.keys(freshPromos).length} promotions`);
      
      // CORREÇÃO CRÍTICA: Limpar completamente e recarregar
      Object.keys(promos).forEach(key => delete promos[key]);
      Object.assign(promos, freshPromos);
      
      console.log(`✅ Refreshed ${Object.keys(promos).length} promotions in memory`);
      
      return promos;
    } catch (error) {
      console.error('❌ Error refreshing promotions:', error);
      return promos;
    }
  } else {
    console.log('❌ Database not connected, cannot refresh promotions');
    return promos;
  }
}

// Force refresh function for debugging
async function forceRefresh() {
  console.log('🔄 FORCE REFRESH PROMOTIONS: Starting...');
  
  if (db && db.connected) {
    try {
      const freshPromos = await db.getPromotions();
      console.log(`🔍 FORCE REFRESH: Database has ${Object.keys(freshPromos).length} promotions`);
      
      // Clear and reassign
      Object.keys(promos).forEach(key => delete promos[key]);
      Object.assign(promos, freshPromos);
      
      console.log(`✅ FORCE REFRESH: Memory now has ${Object.keys(promos).length} promotions`);
      return promos;
    } catch (error) {
      console.error('❌ FORCE REFRESH: Error:', error);
      return promos;
    }
  } else {
    console.log('❌ FORCE REFRESH: Database not connected');
    return promos;
  }
}

// Get promotions directly from database (for debugging)
async function getPromotionsFromDB() {
  await ensureInitialized();
  if (db && db.connected) {
    try {
      const dbPromos = await db.getPromotions();
      console.log(`🔍 Direct DB query returned ${Object.keys(dbPromos).length} promotions`);
      return dbPromos;
    } catch (error) {
      console.error('❌ Error getting promotions from DB:', error);
      return {};
    }
  }
  return {};
}

// Initialize on module load
initDatabase();

module.exports = { promos, create, close, list, refreshExpired, refreshPromotions, ensureInitialized, forceRefresh, getPromotionsFromDB };