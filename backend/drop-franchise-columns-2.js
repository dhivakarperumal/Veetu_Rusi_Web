const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function dropColumns() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const columnsToDelete = [
      'user_id',
      'created_by_phone',
      'pan_unique',
      'latitude',
      'longitude',
      'emergency_contact_number'
    ];

    for (const column of columnsToDelete) {
      try {
        await connection.execute(`ALTER TABLE franchise_owners DROP COLUMN \`${column}\``);
        console.log(`✓ Dropped column: ${column}`);
      } catch (error) {
        if (error.message.includes('Unknown column')) {
          console.log(`ℹ Column [${column}] does not exist (skipped)`);
        } else {
          console.error(`✗ Error dropping column ${column}:`, error.message);
        }
      }
    }

    console.log('\n✓ Migration complete');
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

dropColumns();
