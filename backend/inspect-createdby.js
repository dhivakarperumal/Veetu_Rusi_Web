const pool = require('./src/config/db');

(async () => {
  try {
    console.log('Fetching sample home_chefs rows...');
    const [rows] = await pool.execute('SELECT id, chef_id, created_by_id, created_by_user_id, created_by_name, created_by_email, created_by_phone, name, mobile FROM home_chefs LIMIT 10');
    console.table(rows);

    if (rows.length > 0) {
      const id = rows[0].created_by_id;
      console.log('\nChecking users row for created_by_id =', id);
      const [urows] = await pool.execute('SELECT id, user_id, full_name, email, mobile_number FROM users WHERE id = ?', [id]);
      console.table(urows);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();