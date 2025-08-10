// Script de teste para verificar o sistema de categorias
const { cats, create, close, list, refreshCategories, ensureInitialized, forceRefresh, getCategoriesFromDB } = require('./utils/categories');

async function testCategories() {
  console.log('🧪 Testando sistema de categorias...\n');
  
  try {
    // 1. Verificar inicialização
    console.log('1️⃣ Inicializando sistema...');
    await ensureInitialized();
    console.log('✅ Sistema inicializado');
    
    // 2. Verificar categorias atuais
    console.log('\n2️⃣ Categorias atuais na memória:');
    console.log('Categorias:', Object.keys(cats));
    console.log('Total:', Object.keys(cats).length);
    
    // 3. Forçar refresh
    console.log('\n3️⃣ Forçando refresh das categorias...');
    await forceRefresh();
    console.log('✅ Refresh concluído');
    
    // 4. Verificar categorias após refresh
    console.log('\n4️⃣ Categorias após refresh:');
    console.log('Categorias:', Object.keys(cats));
    console.log('Total:', Object.keys(cats).length);
    
    // 5. Listar todas as categorias
    console.log('\n5️⃣ Listando todas as categorias:');
    const categoryList = await list();
    console.log('Total de categorias:', categoryList.length);
    
    categoryList.forEach(([id, cat]) => {
      console.log(`  - ${cat.name} (${id}): active=${cat.active}, emoji=${cat.emoji || 'Sem emoji'}`);
    });
    
    // 6. Verificar base de dados diretamente
    console.log('\n6️⃣ Verificando base de dados diretamente...');
    const dbCats = await getCategoriesFromDB();
    console.log('Categorias na DB:', Object.keys(dbCats));
    console.log('Total na DB:', Object.keys(dbCats).length);
    
    // 7. Comparar memória vs DB
    console.log('\n7️⃣ Comparando memória vs base de dados:');
    const memoryIds = Object.keys(cats);
    const dbIds = Object.keys(dbCats);
    
    console.log('IDs na memória:', memoryIds);
    console.log('IDs na DB:', dbIds);
    
    const missingInMemory = dbIds.filter(id => !memoryIds.includes(id));
    const missingInDB = memoryIds.filter(id => !dbIds.includes(id));
    
    if (missingInMemory.length > 0) {
      console.log('⚠️ IDs faltando na memória:', missingInMemory);
    }
    
    if (missingInDB.length > 0) {
      console.log('⚠️ IDs faltando na DB:', missingInDB);
    }
    
    if (missingInMemory.length === 0 && missingInDB.length === 0) {
      console.log('✅ Memória e base de dados estão sincronizadas');
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste se o arquivo for executado diretamente
if (require.main === module) {
  testCategories().then(() => {
    console.log('\n🏁 Teste finalizado');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { testCategories }; 