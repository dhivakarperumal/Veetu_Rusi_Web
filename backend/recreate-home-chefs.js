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
      user_id VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      address TEXT,
      fssai_number VARCHAR(100),
      aadhaar_url VARCHAR(255),
      pan_url VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      father_husband_name VARCHAR(255),
      gender VARCHAR(20),
      date_of_birth DATE,
      age INT,
      profile_photo VARCHAR(255),
      cover_banner VARCHAR(255),
      alt_mobile VARCHAR(50),
      whatsapp_number VARCHAR(50),
      emergency_contact VARCHAR(50),
      door_number VARCHAR(50),
      street_name VARCHAR(255),
      area_name VARCHAR(255),
      landmark VARCHAR(255),
      city VARCHAR(150),
      district VARCHAR(150),
      state VARCHAR(150),
      pincode VARCHAR(20),
      latitude VARCHAR(50),
      longitude VARCHAR(50),
      map_link TEXT,
      
      kitchen_name VARCHAR(255),
      kitchen_address TEXT,
      kitchen_type VARCHAR(100),
      kitchen_photos TEXT,
      kitchen_videos TEXT,
      seating_available TINYINT(1),
      dining_available TINYINT(1),
      takeaway_available TINYINT(1),
      delivery_available TINYINT(1),
      
      specialty_food VARCHAR(255),
      cuisine_type VARCHAR(255),
      signature_dish VARCHAR(255),
      veg_nonveg VARCHAR(50),
      experience_years INT,
      cooking_style VARCHAR(255),
      preparation_time VARCHAR(100),
      daily_order_capacity INT,
      available_days VARCHAR(255),
      opening_time VARCHAR(50),
      closing_time VARCHAR(50),
      holiday_schedule TEXT,
      busy_hours VARCHAR(255),
      instant_order TINYINT(1),
      pre_order TINYINT(1),
      
      aadhaar_number VARCHAR(50) UNIQUE,
      pan_number VARCHAR(50) UNIQUE,
      gst_number VARCHAR(50),
      bank_account_number VARCHAR(100),
      ifsc_code VARCHAR(50),
      account_holder_name VARCHAR(255),
      upi_id VARCHAR(100),
      
      aadhaar_front_url VARCHAR(255),
      aadhaar_back_url VARCHAR(255),
      pan_card_url VARCHAR(255),
      fssai_certificate_url VARCHAR(255),
      gst_certificate_url VARCHAR(255),
      signature_url VARCHAR(255),
      selfie_verification_url VARCHAR(255),
      
      username VARCHAR(255),
      password VARCHAR(255),
      otp_verified TINYINT(1),
      email_verified TINYINT(1),
      last_login DATETIME,
      device_details TEXT,
      login_status VARCHAR(50),
      verification_status VARCHAR(50),
      approval_status VARCHAR(50),
      approved_by_admin VARCHAR(255),
      approval_date DATE,
      rejection_reason TEXT,
      block_reason TEXT,
      
      franchise_id VARCHAR(100),
      franchise_user_id VARCHAR(255),
      
      instagram_url VARCHAR(255),
      facebook_url VARCHAR(255),
      youtube_url VARCHAR(255),
      website_url VARCHAR(255),
      fssai_available VARCHAR(50),
      gst_available VARCHAR(50),
      delivery_radius VARCHAR(50),
      preorder_available TINYINT(1),
      cutoff_time TEXT,
      about_me LONGTEXT,
      cooking_story LONGTEXT,
      why_choose_me LONGTEXT,
      languages_known VARCHAR(255),
      
      kitchen_photo1 VARCHAR(255),
      kitchen_photo2 VARCHAR(255),
      kitchen_photo3 VARCHAR(255),
      cooking_area_photo VARCHAR(255),
      storage_area_photo VARCHAR(255),
      
      created_by VARCHAR(255),
      updated_by VARCHAR(255),
      
      UNIQUE INDEX idx_user_id (user_id),
      UNIQUE INDEX idx_mobile (mobile),
      UNIQUE INDEX idx_email (email),
      UNIQUE INDEX idx_aadhaar_number (aadhaar_number),
      UNIQUE INDEX idx_pan_number (pan_number),
      
      KEY idx_franchise_id (franchise_id),
      KEY idx_approval_status (approval_status)
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
