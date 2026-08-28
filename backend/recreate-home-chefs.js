const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    console.log('Dropping home_chefs table...');
    try {
      await conn.execute('DROP TABLE IF EXISTS home_chefs');
      console.log('✓ home_chefs table dropped');
    } catch (err) {
      console.log('✗ Error dropping table:', err.message);
    }

    console.log('\nRecreating home_chefs table with clean schema...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS home_chefs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id VARCHAR(255) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      address TEXT DEFAULT NULL,
      fssai_number VARCHAR(100) DEFAULT NULL,
      aadhaar_url VARCHAR(255) DEFAULT NULL,
      pan_url VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      franchise_id VARCHAR(255) DEFAULT NULL,
      franchise_user_id VARCHAR(255) DEFAULT NULL,
      created_by VARCHAR(255) DEFAULT NULL,
      updated_by VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_user_id (user_id),
      UNIQUE INDEX idx_mobile (mobile),
      UNIQUE INDEX idx_email (email),
      KEY idx_franchise_id (franchise_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await conn.execute(createTableSQL);
    console.log('✓ home_chefs table recreated with clean schema');

    // Verify the table
    const [columns] = await conn.execute('SHOW COLUMNS FROM home_chefs');
    console.log(`\n✓ Table created with ${columns.length} columns`);

    // Check unique indexes
    const [indexes] = await conn.execute("SHOW INDEXES FROM home_chefs WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
    console.log(`✓ Unique constraints applied: ${indexes.map(i => i.Column_name).join(', ')}`);

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
