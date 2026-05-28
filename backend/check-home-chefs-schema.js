const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'veetu_rusi',
      port: process.env.DB_PORT || 3306,
    });
    const [rows] = await conn.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'home_chefs' ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME || 'veetu_rusi']
    );
    console.log(rows.map(r => r.COLUMN_NAME).join(', '));
    await conn.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
