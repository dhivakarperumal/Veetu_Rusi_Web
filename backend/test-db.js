const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veetu_rusi',
  });

  const [rows] = await pool.execute(`
    SELECT id, code, start_date, expiry_date, NOW() as current_db_time,
           (start_date <= NOW()) as is_started
    FROM coupons
  `);
  
  console.log(rows);
  process.exit();
}
test();
