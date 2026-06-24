const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veeturusi_db'
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS home_chef_categorys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        CatId VARCHAR(50) NOT NULL,
        c_name VARCHAR(255) NOT NULL,
        discripti TEXT,
        image LONGTEXT,
        subcategory LONGTEXT,
        category_type ENUM('Food', 'food products') DEFAULT 'Food',
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(CatId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table home_chef_categorys created successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

createTable();
