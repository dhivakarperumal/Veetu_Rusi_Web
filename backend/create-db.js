const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'veetu_rusi';
const DB_PORT = process.env.DB_PORT || 3306;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createDatabaseAndTables() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });

  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  console.log(`Database ${DB_NAME} created or already exists`);

  await connection.changeUser({ database: DB_NAME });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) DEFAULT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      active TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Users table created or already exists');

  const [columns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'",
    [DB_NAME]
  );

  if (columns[0].count === 0) {
    await connection.execute(`
      ALTER TABLE \`users\`
      ADD COLUMN \`user_id\` CHAR(36) NOT NULL UNIQUE DEFAULT (UUID())
    `);
    await connection.execute(`
      UPDATE \`users\`
      SET user_id = UUID()
      WHERE user_id IS NULL OR user_id = ''
    `);
    console.log('Added user_id UUID column to existing users table');
  }

  const [phoneColumns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'",
    [DB_NAME]
  );

  if (phoneColumns[0].count === 0) {
    await connection.execute(`
      ALTER TABLE \`users\`
      ADD COLUMN \`phone\` VARCHAR(50) DEFAULT NULL
    `);
    console.log('Added phone column to existing users table');
  }

  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin@123';
  const hashedPassword = hashPassword(adminPassword);

  await connection.execute(
    `INSERT INTO \`users\` (name, email, password, role)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password = VALUES(password),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP`,
    ['Admin', adminEmail, hashedPassword, 'admin']
  );
  console.log(`Admin user created or updated: ${adminEmail}`);

  const superadminEmail = 'superadmin@gmail.com';
  const superadminPassword = 'superadmin@123';
  const hashedSuperPassword = hashPassword(superadminPassword);

  await connection.execute(
    `INSERT INTO \`users\` (name, email, password, role)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password = VALUES(password),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP`,
    ['SuperAdmin', superadminEmail, hashedSuperPassword, 'superadmin']
  );
  console.log(`SuperAdmin user created or updated: ${superadminEmail}`);

  await connection.end();
}

createDatabaseAndTables().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
