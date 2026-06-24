const pool = require('./backend/src/config/db');

async function test() {
  const [rows] = await pool.execute('SELECT id, user_id, email, role FROM users WHERE id = 1079 OR user_id = "DEL-fc92f227-bc3b-4ed3-b8e8-283a98de9ffb"');
  console.log('users:', rows);
  
  process.exit(0);
}

test();
