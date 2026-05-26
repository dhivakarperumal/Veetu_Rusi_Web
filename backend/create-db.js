const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
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
      user_id VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      profile_image VARCHAR(255) DEFAULT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Users table created or already exists');

  // To support seamless updates of existing schemas:
  try {
    await connection.execute("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `full_name` VARCHAR(255) NOT NULL");
    await connection.execute("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `mobile_number` VARCHAR(50) DEFAULT NULL");
    await connection.execute("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `profile_image` VARCHAR(255) DEFAULT NULL");
    await connection.execute("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `status` VARCHAR(50) NOT NULL DEFAULT 'Active'");
    // Rename existing columns if they exist (ignoring errors if they don't or already renamed)
    try { await connection.execute("ALTER TABLE `users` CHANGE `name` `full_name` VARCHAR(255) NOT NULL"); } catch (e) {}
    try { await connection.execute("ALTER TABLE `users` CHANGE `phone` `mobile_number` VARCHAR(50) DEFAULT NULL"); } catch (e) {}
    try { await connection.execute("ALTER TABLE `users` CHANGE `active` `status` VARCHAR(50) NOT NULL DEFAULT 'Active'"); } catch (e) {}
    try { 
      await connection.execute("ALTER TABLE `users` MODIFY `user_id` VARCHAR(100) NOT NULL"); 
    } catch (e) {}
  } catch (err) {
    console.log('User alter tables:', err.message);
  }

  // SuperAdmin Tables
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`restaurants\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(100) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      gst_number VARCHAR(100),
      fssai_number VARCHAR(100),
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      address TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      
      restaurant_type VARCHAR(100) DEFAULT 'Both',
      cuisine_type VARCHAR(255) DEFAULT 'Multi Cuisine',
      description TEXT,
      opening_date DATE,
      logo_url VARCHAR(255),
      banner_url VARCHAR(255),
      gallery_urls TEXT,
      
      alt_mobile VARCHAR(50),
      whatsapp_number VARCHAR(50),
      website_url VARCHAR(255),
      customer_support VARCHAR(50),
      
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
      
      opening_time VARCHAR(50),
      closing_time VARCHAR(50),
      working_days VARCHAR(255),
      holiday_details TEXT,
      is_24_hours TINYINT(1) DEFAULT 0,
      peak_hours VARCHAR(255),
      
      username VARCHAR(255),
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'Restaurant Admin',
      otp_verified TINYINT(1) DEFAULT 0,
      email_verified TINYINT(1) DEFAULT 0,
      verification_status VARCHAR(50) DEFAULT 'Pending',
      aadhaar_url VARCHAR(255),
      pan_url VARCHAR(255),
      gst_certificate_url VARCHAR(255),
      shop_license_url VARCHAR(255),
      restaurant_photos_urls TEXT,
      kitchen_photos_urls TEXT,
      signature_url VARCHAR(255),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Restaurants table created or already exists');

  // Add user_id column to existing restaurants table
  await connection.execute("ALTER TABLE `restaurants` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(100) DEFAULT NULL");

  const [restColumns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'restaurants' AND COLUMN_NAME = 'verification_status'",
    [DB_NAME]
  );

  if (restColumns[0].count === 0) {
    await connection.execute(`
      ALTER TABLE \`restaurants\`
      ADD COLUMN \`restaurant_type\` VARCHAR(100) DEFAULT 'Both',
      ADD COLUMN \`cuisine_type\` VARCHAR(255) DEFAULT 'Multi Cuisine',
      ADD COLUMN \`description\` TEXT,
      ADD COLUMN \`opening_date\` DATE,
      ADD COLUMN \`logo_url\` VARCHAR(255),
      ADD COLUMN \`banner_url\` VARCHAR(255),
      ADD COLUMN \`gallery_urls\` TEXT,
      ADD COLUMN \`alt_mobile\` VARCHAR(50),
      ADD COLUMN \`whatsapp_number\` VARCHAR(50),
      ADD COLUMN \`website_url\` VARCHAR(255),
      ADD COLUMN \`customer_support\` VARCHAR(50),
      ADD COLUMN \`door_number\` VARCHAR(50),
      ADD COLUMN \`street_name\` VARCHAR(255),
      ADD COLUMN \`area_name\` VARCHAR(255),
      ADD COLUMN \`landmark\` VARCHAR(255),
      ADD COLUMN \`city\` VARCHAR(150),
      ADD COLUMN \`district\` VARCHAR(150),
      ADD COLUMN \`state\` VARCHAR(150),
      ADD COLUMN \`pincode\` VARCHAR(20),
      ADD COLUMN \`latitude\` VARCHAR(50),
      ADD COLUMN \`longitude\` VARCHAR(50),
      ADD COLUMN \`map_link\` TEXT,
      ADD COLUMN \`opening_time\` VARCHAR(50),
      ADD COLUMN \`closing_time\` VARCHAR(50),
      ADD COLUMN \`working_days\` VARCHAR(255),
      ADD COLUMN \`holiday_details\` TEXT,
      ADD COLUMN \`is_24_hours\` TINYINT(1) DEFAULT 0,
      ADD COLUMN \`peak_hours\` VARCHAR(255),
      ADD COLUMN \`username\` VARCHAR(255),
      ADD COLUMN \`password\` VARCHAR(255),
      ADD COLUMN \`role\` VARCHAR(50) DEFAULT 'Restaurant Admin',
      ADD COLUMN \`otp_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN \`email_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN \`verification_status\` VARCHAR(50) DEFAULT 'Pending',
      ADD COLUMN \`aadhaar_url\` VARCHAR(255),
      ADD COLUMN \`pan_url\` VARCHAR(255),
      ADD COLUMN \`gst_certificate_url\` VARCHAR(255),
      ADD COLUMN \`shop_license_url\` VARCHAR(255),
      ADD COLUMN \`restaurant_photos_urls\` TEXT,
      ADD COLUMN \`kitchen_photos_urls\` TEXT,
      ADD COLUMN \`signature_url\` VARCHAR(255)
    `);
    console.log('Added all new fields to the existing restaurants table');
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`home_chefs\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chef_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(100) DEFAULT NULL,
      chef_unique_code VARCHAR(100) UNIQUE DEFAULT NULL,
      created_by_id INT DEFAULT NULL,
      created_by_user_id CHAR(36) DEFAULT NULL,
      created_by_name VARCHAR(255) DEFAULT NULL,
      created_by_email VARCHAR(255) DEFAULT NULL,
      created_by_phone VARCHAR(50) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      address TEXT NOT NULL,
      fssai_number VARCHAR(100),
      aadhaar_url VARCHAR(255),
      pan_url VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Home Chefs table created or already exists');

  // Add chef_unique_code column if it doesn't exist
  try {
    const [codeColumns] = await connection.execute(
      "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'home_chefs' AND COLUMN_NAME = 'chef_unique_code'",
      [DB_NAME]
    );
    if (codeColumns[0].count === 0) {
      await connection.execute(`
        ALTER TABLE \`home_chefs\`
        ADD COLUMN \`chef_unique_code\` VARCHAR(100) NOT NULL UNIQUE DEFAULT NULL
      `);
      console.log('Added chef_unique_code column to home_chefs table');
    }
  } catch (err) {
    console.log('chef_unique_code column already exists');
  }

  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_user_id` CHAR(36) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_email` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_phone` VARCHAR(50) DEFAULT NULL");

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`categories\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      catId VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      subcategory LONGTEXT,
      images LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Categories table created or already exists');

  try {
    const [categoryCount] = await connection.execute('SELECT COUNT(*) AS count FROM categories');
    if (categoryCount[0].count === 0) {
      const categoriesPath = path.join(__dirname, 'src', 'data', 'categories.json');
      const raw = await fs.readFile(categoriesPath, 'utf8');
      const categoriesData = JSON.parse(raw);
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        for (const category of categoriesData) {
          await connection.execute(
            'INSERT INTO categories (catId, name, description, subcategory, images) VALUES (?, ?, ?, ?, ?)',
            [
              category.catId || `CAT${category.id}`,
              category.name || category.cname || '',
              category.description || null,
              JSON.stringify(category.subcategory || []),
              JSON.stringify(category.images || [])
            ]
          );
        }
        console.log('Seeded categories into database from JSON data');
      }
    }
  } catch (seedError) {
    console.warn('Could not seed categories:', seedError.message || seedError);
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`delivery_partners\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      partner_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(100) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      vehicle_type VARCHAR(100) NOT NULL,
      vehicle_number VARCHAR(100) NOT NULL,
      license_number VARCHAR(100) NOT NULL,
      aadhaar_number VARCHAR(100) NOT NULL,
      total_deliveries INT DEFAULT 0,
      earnings DECIMAL(10,2) DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Delivery Partners table created or already exists');

  // Ensure legacy or older DBs have the newer columns used by the application
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `email` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_brand` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_model` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_color` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pan_number` VARCHAR(100)");
  try {
    await connection.execute("ALTER TABLE `delivery_partners` MODIFY `vehicle_type` VARCHAR(100) DEFAULT NULL");
  } catch (e) {}
  try {
    await connection.execute("ALTER TABLE `delivery_partners` MODIFY `vehicle_number` VARCHAR(100) DEFAULT NULL");
  } catch (e) {}
  try {
    await connection.execute("ALTER TABLE `delivery_partners` MODIFY `license_number` VARCHAR(100) DEFAULT NULL");
  } catch (e) {}
  try {
    await connection.execute("ALTER TABLE `delivery_partners` MODIFY `aadhaar_number` VARCHAR(100) DEFAULT NULL");
  } catch (e) {}
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `delivery_partner_code` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `father_husband_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(50) DEFAULT 'Male'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `age` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `profile_photo` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `cover_photo` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `marital_status` VARCHAR(50) DEFAULT 'Single'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `blood_group` VARCHAR(10)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `alt_mobile` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `whatsapp_number` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `emergency_contact` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `door_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `street_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `area_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `landmark` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `city` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `district` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pincode` VARCHAR(20)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `country` VARCHAR(100) DEFAULT 'India'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `latitude` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `longitude` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `map_link` VARCHAR(512)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `password` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `otp_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `device_id` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `login_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `account_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `rc_book_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_expiry_date` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pollution_certificate_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_front_photo` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_back_photo` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `rc_book_image` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_document_image` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_holder_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_expiry_date` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_front_image` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_back_image` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `driving_experience` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `aadhaar_front_url` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `aadhaar_back_url` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pan_card_url` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `selfie_verification_url` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `police_verification_certificate` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `background_verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `kyc_verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `bank_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `account_holder_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `bank_account_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `branch_name` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `upi_id` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `wallet_balance` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pending_earnings` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `total_earnings` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `daily_earnings` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `weekly_earnings` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `monthly_earnings` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `incentive_amount` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `bonus_amount` DECIMAL(10,2) DEFAULT 0.00");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `online_status` VARCHAR(50) DEFAULT 'Offline'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `availability_schedule` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `working_days` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `shift_timing` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `current_location` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `break_time_status` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `assigned_delivery_area` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `delivery_radius` DECIMAL(8,2) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `preferred_delivery_zone` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `city_coverage` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `area_coverage` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `zone_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_user_id` CHAR(36) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_email` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_phone` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_user_id` CHAR(36) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_email` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approval_date` DATETIME DEFAULT NULL");

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`orders\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      restaurant_or_chef VARCHAR(255) NOT NULL,
      delivery_partner VARCHAR(255),
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      ordered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Orders table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`payouts\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      transaction_id VARCHAR(255),
      payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Payouts table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`franchise_owners\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      franchise_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      franch_user_id CHAR(36) DEFAULT NULL,
      user_id VARCHAR(100) DEFAULT NULL,
      franchise_name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      pincode VARCHAR(20),
      latitude VARCHAR(50),
      longitude VARCHAR(50),
      map_link TEXT,
      username VARCHAR(255),
      role VARCHAR(50) DEFAULT 'Franchise Admin',
      otp_verified TINYINT(1) DEFAULT 0,
      email_verified TINYINT(1) DEFAULT 0,
      login_status VARCHAR(50) DEFAULT 'Active',
      aadhaar_url VARCHAR(255),
      pan_url VARCHAR(255),
      gst_certificate_url VARCHAR(255),
      fssai_license_url VARCHAR(255),
      shop_license_url VARCHAR(255),
      vehicle_rc_url VARCHAR(255),
      driving_license_url VARCHAR(255),
      bank_passbook_url VARCHAR(255),
      signature_url VARCHAR(255),
      created_by_id INT DEFAULT NULL,
      created_by_user_id VARCHAR(100) DEFAULT NULL,
      created_by_name VARCHAR(255) DEFAULT NULL,
      created_by_email VARCHAR(255) DEFAULT NULL,
      created_by_phone VARCHAR(50) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Franchise Owners table created or already exists');

  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_user_id` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_email` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_phone` VARCHAR(50) DEFAULT NULL");

  const [franColumns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'franchise_owners' AND COLUMN_NAME = 'logo_url'",
    [DB_NAME]
  );

  if (franColumns[0].count === 0) {
    await connection.execute(`
      ALTER TABLE \`franchise_owners\`
      ADD COLUMN \`logo_url\` VARCHAR(255),
      ADD COLUMN \`banner_url\` VARCHAR(255),
      ADD COLUMN \`business_registration_number\` VARCHAR(100),
      ADD COLUMN \`gst_number\` VARCHAR(100),
      ADD COLUMN \`pan_number\` VARCHAR(100),
      ADD COLUMN \`start_date\` DATE,
      ADD COLUMN \`expiry_date\` DATE,
      ADD COLUMN \`alt_mobile\` VARCHAR(50),
      ADD COLUMN \`whatsapp_number\` VARCHAR(50),
      ADD COLUMN \`website_url\` VARCHAR(255),
      ADD COLUMN \`emergency_contact_number\` VARCHAR(50),
      ADD COLUMN \`door_number\` VARCHAR(50),
      ADD COLUMN \`street_name\` VARCHAR(255),
      ADD COLUMN \`area\` VARCHAR(255),
      ADD COLUMN \`landmark\` VARCHAR(255),
      ADD COLUMN \`district\` VARCHAR(150),
      ADD COLUMN \`pincode\` VARCHAR(20),
      ADD COLUMN \`latitude\` VARCHAR(50),
      ADD COLUMN \`longitude\` VARCHAR(50),
      ADD COLUMN \`map_link\` TEXT,
      ADD COLUMN \`username\` VARCHAR(255),
      ADD COLUMN \`role\` VARCHAR(50) DEFAULT 'Franchise Admin',
      ADD COLUMN \`otp_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN \`email_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN \`login_status\` VARCHAR(50) DEFAULT 'Active',
      ADD COLUMN \`aadhaar_url\` VARCHAR(255),
      ADD COLUMN \`pan_url\` VARCHAR(255),
      ADD COLUMN \`gst_certificate_url\` VARCHAR(255),
      ADD COLUMN \`fssai_license_url\` VARCHAR(255),
      ADD COLUMN \`shop_license_url\` VARCHAR(255),
      ADD COLUMN \`vehicle_rc_url\` VARCHAR(255),
      ADD COLUMN \`driving_license_url\` VARCHAR(255),
      ADD COLUMN \`bank_passbook_url\` VARCHAR(255),
      ADD COLUMN \`signature_url\` VARCHAR(255)
    `);
    console.log('Added all new fields to the existing franchise_owners table');
  }

  const [territoryColumns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'franchise_owners' AND COLUMN_NAME = 'territory_pincodes'",
    [DB_NAME]
  );

  if (territoryColumns[0].count === 0) {
    await connection.execute(`ALTER TABLE \`franchise_owners\` ADD COLUMN \`territory_pincodes\` TEXT`);
    console.log('Added territory_pincodes column to franchise_owners table');
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`commissions\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(100) NOT NULL UNIQUE,
      commission_value DECIMAL(10,2) NOT NULL,
      is_percentage TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Commissions table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`banners\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      banner_title VARCHAR(255) NOT NULL,
      banner_image VARCHAR(255) NOT NULL,
      redirect_url VARCHAR(255),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Banners table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`notifications\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Notifications table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`preorders\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chef_id INT NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      delivery_date DATE NOT NULL,
      special_requests TEXT,
      price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      customer_email VARCHAR(255),
      customer_phone VARCHAR(20),
      ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (chef_id) REFERENCES home_chefs(id) ON DELETE CASCADE,
      INDEX idx_chef_id (chef_id),
      INDEX idx_status (status),
      INDEX idx_delivery_date (delivery_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Preorders table created or already exists');

  // Seed default SuperAdmin data
  await connection.execute(`
    INSERT INTO \`commissions\` (type, commission_value, is_percentage)
    VALUES 
      ('Restaurant', 15.00, 1),
      ('Home Chef', 10.00, 1),
      ('Delivery Partner', 5.00, 1),
      ('Franchise', 2.50, 1)
    ON DUPLICATE KEY UPDATE commission_value = VALUES(commission_value);
  `);

  await connection.execute(`
    INSERT INTO \`restaurants\` (name, owner_name, gst_number, fssai_number, mobile, email, address, status)
    VALUES 
      ('Annapoorna Veg', 'Ramachandran', '33AAAAA1111A1Z1', '12345678901234', '9876543211', 'annapoorna@gmail.com', 'Coimbatore, Tamil Nadu', 'Approved'),
      ('Sree Gupta Bhavan', 'Gupta Lal', '33BBBBB2222B2Z2', '12345678905555', '9876543212', 'gupta@gmail.com', 'Chennai, Tamil Nadu', 'Pending')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  // Function to generate unique chef code
  function generateChefUniqueCode() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CHEF-${timestamp}-${randomPart}`;
  }

  // Insert home chefs with auto-generated unique codes
  const chefCode1 = generateChefUniqueCode();
  const chefCode2 = generateChefUniqueCode();

  await connection.execute(`
    INSERT INTO \`home_chefs\` (name, mobile, email, address, fssai_number, chef_unique_code, status)
    VALUES 
      ('Anandhi Rao', '9876543213', 'anandhi.rao@gmail.com', '42 Green Park Lane, Madurai, Tamil Nadu 625001', '22345678901234', ?, 'Approved'),
      ('Kavitha Sharma', '9876543214', 'kavitha.sharma@gmail.com', '15 Silk Street, Salem, Tamil Nadu 636001', '22345678905555', ?, 'Pending')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `, [chefCode1, chefCode2]);
  
  console.log('Home Chefs created with auto-generated codes:');
  console.log(`Chef 1 - Anandhi Rao: ${chefCode1}`);
  console.log(`Chef 2 - Kavitha Sharma: ${chefCode2}`);

  await connection.execute(`
    INSERT INTO \`delivery_partners\` (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status)
    VALUES 
      ('Karthik Kumar', '9876543215', 'Bike', 'TN-37-AB-1234', 'DL-1234567', '1234-5678-9012', 'Approved'),
      ('Suresh Raina', '9876543216', 'Bike', 'TN-01-XY-9876', 'DL-7654321', '9876-5432-1098', 'Pending')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  await connection.execute(`
    INSERT INTO \`orders\` (order_id, customer_name, restaurant_or_chef, delivery_partner, amount, payment_method, status)
    VALUES 
      ('VR-1001', 'Dhivakar P', 'Annapoorna Veg', 'Karthik Kumar', 450.00, 'UPI', 'Delivered'),
      ('VR-1002', 'Nisha R', 'Saraswathis Kitchen', 'Suresh Raina', 320.00, 'COD', 'Accepted')
    ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name);
  `);


  const { generateRoleId } = require('./src/utils/idGenerator');

  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin@123';
  const hashedPassword = hashPassword(adminPassword);

  await connection.execute(
    `INSERT INTO \`users\` (user_id, full_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        password = VALUES(password),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP`,
    [generateRoleId('admin'), 'Admin', adminEmail, hashedPassword, 'admin']
  );
  console.log(`Admin user created or updated: ${adminEmail}`);

  const superadminEmail = 'superadmin@gmail.com';
  const superadminPassword = 'superadmin@123';
  const hashedSuperPassword = hashPassword(superadminPassword);

  await connection.execute(
    `INSERT INTO \`users\` (user_id, full_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        password = VALUES(password),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP`,
    [generateRoleId('superadmin'), 'SuperAdmin', superadminEmail, hashedSuperPassword, 'superadmin']
  );
  console.log(`SuperAdmin user created or updated: ${superadminEmail}`);

  await connection.end();
}

if (require.main === module) {
  createDatabaseAndTables().catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
}

module.exports = createDatabaseAndTables;
