const pool = require('./src/config/db');

async function check() {
  try {
    const [users] = await pool.execute('SELECT id, user_id, username, role FROM users WHERE role = "delivery_partner"');
    console.log('Users:', users);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
