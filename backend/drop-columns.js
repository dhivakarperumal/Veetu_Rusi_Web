const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    const drops = [
      'created_by_id',
      'created_by_user_id',
      'created_by_name',
      'created_by_email',
      'created_by_phone'
    ];

    console.log('Dropping columns from home_chefs...');
    for (const col of drops) {
      try {
        await conn.execute(`ALTER TABLE home_chefs DROP COLUMN ${col}`);
        console.log(`  ✓ Dropped: ${col}`);
      } catch (err) {
        console.log(`  ✗ Failed to drop ${col}: ${err.message}`);
      }
    }

    // Verify the columns were dropped
    const [cols] = await conn.execute('SHOW COLUMNS FROM home_chefs');
    const remaining = drops.filter(col => cols.some(c => c.Field === col));
    
    if (remaining.length > 0) {
      console.log(`\n✗ Columns still exist: ${remaining.join(', ')}`);
    } else {
      console.log(`\n✓ All columns successfully removed!`);
    }

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
