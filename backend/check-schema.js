const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    const [cols] = await conn.execute('SHOW COLUMNS FROM home_chefs');
    console.log('\n✓ home_chefs table columns:');
    console.log('═'.repeat(60));
    cols.forEach(c => {
      console.log(`  ${c.Field.padEnd(30)} | ${c.Type.padEnd(20)} | ${c.Null}`);
    });
    console.log('═'.repeat(60));

    // Check for specific columns
    const colNames = cols.map(c => c.Field);
    const removed = ['chef_id', 'chef_unique_code', 'created_by_phone'];
    const added = ['franchise_id', 'created_by', 'updated_by'];

    console.log('\n✓ Removed columns check:');
    removed.forEach(col => {
      const exists = colNames.includes(col);
      console.log(`  ${exists ? '✗' : '✓'} ${col}`);
    });

    console.log('\n✓ Added columns check:');
    added.forEach(col => {
      const exists = colNames.includes(col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
    });

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
