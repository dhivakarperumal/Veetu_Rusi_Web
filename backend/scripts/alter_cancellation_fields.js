require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi'
  });

  try {
    console.log('Adding cancellation columns to user_food_order_table...');
    // Add columns one by one in case MySQL version doesn't support IF NOT EXISTS on ALTER ADD
    const columns = [
        "ADD COLUMN cancelled_by VARCHAR(50) DEFAULT NULL",
        "ADD COLUMN cancelled_user_id VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN cancellation_reason VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN cancellation_notes TEXT DEFAULT NULL",
        "ADD COLUMN cancelled_at DATETIME DEFAULT NULL",
        "ADD COLUMN previous_status VARCHAR(50) DEFAULT NULL",
        "ADD COLUMN refund_status VARCHAR(50) DEFAULT 'Pending'"
    ];
    
    for (const col of columns) {
        try {
            await connection.execute(`ALTER TABLE user_food_order_table ${col}`);
            console.log(`Successfully executed: ${col}`);
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists, skipping: ${col}`);
            } else {
                throw e;
            }
        }
    }
    
    console.log('Successfully updated table schema.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
