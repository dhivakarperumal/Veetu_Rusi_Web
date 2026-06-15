const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'veetu_rusi';
const DB_PORT = process.env.DB_PORT || 3306;

async function dropFranchiseColumns() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });

  console.log('Connected to database...');

  try {
    // List of columns to drop
    const columnsToDrop = [
      'user_id',
      'gst_certificate_url',
      'fssai_license_url',
      'shop_license_url',
      'vehicle_rc_url',
      'driving_license_url',
      'created_by_phone',
      'website_url',
      'whatsapp_number',
      'gst_number',
      'business_registration_number',
      'commission_percentage'
    ];

    // Drop each column if it exists
    for (const column of columnsToDrop) {
      try {
        await connection.execute(`ALTER TABLE \`franchise_owners\` DROP COLUMN \`${column}\``);
        console.log(`✓ Dropped column: ${column}`);
      } catch (err) {
        if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`✓ Column ${column} does not exist (skipped)`);
        } else {
          console.error(`✗ Error dropping ${column}:`, err.message);
        }
      }
    }

    console.log('\nAll specified columns have been processed.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

dropFranchiseColumns();
