const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    console.log('Disabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');

    console.log('Dropping home_chefs table...');
    try {
      await conn.execute('DROP TABLE IF EXISTS home_chefs');
      console.log('✓ home_chefs table dropped');
    } catch (err) {
      console.log('Note:', err.message);
    }

    console.log('\nSkipping recreation of home_chefs table (intentionally removed)');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
