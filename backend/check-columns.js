const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi'
  });

  try {
    const [columns] = await conn.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'home_chefs' ORDER BY ORDINAL_POSITION"
    );
    
    console.log('✓ All columns in home_chefs table:\n');
    columns.forEach((col, i) => {
      console.log(`${(i+1).toString().padStart(3)}. ${col.COLUMN_NAME}`);
    });
  } finally {
    await conn.end();
  }
})();
