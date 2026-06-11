const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    // Get indexes for home_chefs table
    const [indexes] = await conn.execute("SHOW INDEXES FROM home_chefs");
    
    console.log('✓ Unique constraints on home_chefs table:');
    console.log('════════════════════════════════════════════════════════════');
    
    const uniqueIndexes = indexes.filter(idx => idx.Key_name !== 'PRIMARY' && idx.Non_unique === 0);
    
    if (uniqueIndexes.length > 0) {
      uniqueIndexes.forEach(idx => {
        console.log(`  ✓ ${idx.Key_name}: ${idx.Column_name} (UNIQUE)`);
      });
    } else {
      console.log('  ✗ No unique constraints found');
    }

    console.log('════════════════════════════════════════════════════════════');

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
