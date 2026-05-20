const mysql = require('mysql2/promise');
require('dotenv').config();

const newColumns = [
  "verification_status VARCHAR(50) DEFAULT 'Pending'",
  "aadhaar_url VARCHAR(255)",
  "pan_url VARCHAR(255)",
  "gst_certificate_url VARCHAR(255)",
  "shop_license_url VARCHAR(255)",
  "restaurant_photos_urls TEXT",
  "kitchen_photos_urls TEXT",
  "signature_url VARCHAR(255)",
  "door_number VARCHAR(50)",
  "street_name VARCHAR(255)",
  "area_name VARCHAR(255)",
  "landmark VARCHAR(255)",
  "city VARCHAR(150)",
  "district VARCHAR(150)",
  "state VARCHAR(150)",
  "pincode VARCHAR(20)",
  "latitude VARCHAR(50)",
  "longitude VARCHAR(50)",
  "map_link TEXT",
  "opening_time VARCHAR(50)",
  "closing_time VARCHAR(50)",
  "working_days VARCHAR(255)",
  "holiday_details TEXT",
  "is_24_hours TINYINT(1) DEFAULT 0",
  "peak_hours VARCHAR(255)",
  "username VARCHAR(255)",
  "password VARCHAR(255)",
  "role VARCHAR(50) DEFAULT 'Restaurant Admin'",
  "otp_verified TINYINT(1) DEFAULT 0",
  "email_verified TINYINT(1) DEFAULT 0",
  "alt_mobile VARCHAR(50)",
  "whatsapp_number VARCHAR(50)",
  "website_url VARCHAR(255)",
  "customer_support VARCHAR(50)",
  "restaurant_type VARCHAR(100) DEFAULT 'Both'",
  "cuisine_type VARCHAR(255) DEFAULT 'Multi Cuisine'",
  "description TEXT",
  "opening_date DATE",
  "logo_url VARCHAR(255)",
  "banner_url VARCHAR(255)",
  "gallery_urls TEXT",
];

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi',
    port: process.env.DB_PORT || 3306,
  });

  console.log('Connected to database');

  for (const col of newColumns) {
    const colName = col.split(' ')[0];
    try {
      await connection.execute(`ALTER TABLE restaurants ADD COLUMN ${col}`);
      console.log(`✓ Added column: ${colName}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`→ Already exists: ${colName}`);
      } else {
        console.error(`✗ Error adding ${colName}:`, err.message);
      }
    }
  }

  console.log('\nMigration complete!');
  process.exit(0);
})();
