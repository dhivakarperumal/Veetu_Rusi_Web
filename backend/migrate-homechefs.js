const mysql = require('mysql2/promise');
require('dotenv').config();

const newColumns = [
  "chef_unique_code VARCHAR(100)",
  "father_husband_name VARCHAR(255)",
  "gender VARCHAR(20)",
  "date_of_birth DATE",
  "age INT",
  "profile_photo VARCHAR(255)",
  "cover_banner VARCHAR(255)",
  "alt_mobile VARCHAR(50)",
  "whatsapp_number VARCHAR(50)",
  "emergency_contact VARCHAR(50)",
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
  "kitchen_name VARCHAR(255)",
  "kitchen_address TEXT",
  "kitchen_type VARCHAR(100) DEFAULT 'Home Kitchen'",
  "kitchen_photos TEXT",
  "kitchen_videos TEXT",
  "seating_available TINYINT(1) DEFAULT 0",
  "dining_available TINYINT(1) DEFAULT 0",
  "takeaway_available TINYINT(1) DEFAULT 0",
  "delivery_available TINYINT(1) DEFAULT 0",
  "specialty_food VARCHAR(255)",
  "cuisine_type VARCHAR(255) DEFAULT 'South Indian'",
  "signature_dish VARCHAR(255)",
  "veg_nonveg VARCHAR(50) DEFAULT 'Veg'",
  "experience_years INT",
  "cooking_style VARCHAR(255)",
  "preparation_time VARCHAR(100)",
  "daily_order_capacity INT",
  "available_days VARCHAR(255)",
  "opening_time VARCHAR(50)",
  "closing_time VARCHAR(50)",
  "holiday_schedule TEXT",
  "busy_hours VARCHAR(255)",
  "instant_order TINYINT(1) DEFAULT 0",
  "pre_order TINYINT(1) DEFAULT 0",
  "aadhaar_number VARCHAR(50)",
  "pan_number VARCHAR(50)",
  "gst_number VARCHAR(50)",
  "bank_account_number VARCHAR(100)",
  "ifsc_code VARCHAR(50)",
  "account_holder_name VARCHAR(255)",
  "upi_id VARCHAR(100)",
  "aadhaar_front_url VARCHAR(255)",
  "aadhaar_back_url VARCHAR(255)",
  "pan_card_url VARCHAR(255)",
  "fssai_certificate_url VARCHAR(255)",
  "gst_certificate_url VARCHAR(255)",
  "signature_url VARCHAR(255)",
  "selfie_verification_url VARCHAR(255)",
  "username VARCHAR(255)",
  "password VARCHAR(255)",
  "otp_verified TINYINT(1) DEFAULT 0",
  "email_verified TINYINT(1) DEFAULT 0",
  "last_login DATETIME",
  "device_details TEXT",
  "login_status VARCHAR(50) DEFAULT 'Active'",
  "verification_status VARCHAR(50) DEFAULT 'Pending'",
  "approval_status VARCHAR(50) DEFAULT 'Pending'",
  "approved_by_admin VARCHAR(255)",
  "approval_date DATE",
  "rejection_reason TEXT",
  "block_reason TEXT"
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

  try {
    await connection.execute('ALTER TABLE home_chefs MODIFY COLUMN address TEXT NULL');
    console.log('✓ Made address column nullable');
  } catch (err) {
    console.error('✗ Error making address nullable:', err.message);
  }

  for (const col of newColumns) {
    const colName = col.split(' ')[0];
    try {
      await connection.execute(`ALTER TABLE home_chefs ADD COLUMN ${col}`);
      console.log(`✓ Added column: ${colName}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`→ Already exists: ${colName}`);
      } else {
        console.error(`✗ Error adding ${colName}:`, err.message);
      }
    }
  }

  console.log('\nHome Chefs Migration complete!');
  process.exit(0);
})();
