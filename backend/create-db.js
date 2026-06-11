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

async function addColumnIfNotExists(connection, table, column, definition) {
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [DB_NAME, table, column]
  );
  if (rows[0].count === 0) {
    try {
      await connection.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Added ${column} to ${table}`);
    } catch (err) {
      console.warn(`Could not add column ${column} to ${table}: ${err.message}`);
      // Don't throw - leave migration to manual fix if row size limits are reached
    }
  }
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
      user_id VARCHAR(255) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      profile_image VARCHAR(255) DEFAULT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COLLATE=utf8mb4_unicode_ci;
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
      await connection.execute("ALTER TABLE `users` MODIFY `user_id` VARCHAR(255) NOT NULL"); 
    } catch (e) {}
  } catch (err) {
    console.log('User alter tables:', err.message);
  }

  // SuperAdmin Tables
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`restaurants\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id VARCHAR(255) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(255) DEFAULT NULL,
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
  await connection.execute("ALTER TABLE `restaurants` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(255) DEFAULT NULL");

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
      chef_id VARCHAR(255) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(255) DEFAULT NULL,
      chef_unique_code VARCHAR(100) UNIQUE DEFAULT NULL,
      created_by_id INT DEFAULT NULL,
      created_by_user_id VARCHAR(255) DEFAULT NULL,
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
      father_husband_name VARCHAR(255) DEFAULT NULL,
      gender VARCHAR(50) DEFAULT NULL,
      date_of_birth DATE DEFAULT NULL,
      age INT DEFAULT NULL,
      profile_photo VARCHAR(255) DEFAULT NULL,
      cover_banner VARCHAR(255) DEFAULT NULL,
      alt_mobile VARCHAR(50) DEFAULT NULL,
      whatsapp_number VARCHAR(50) DEFAULT NULL,
      emergency_contact VARCHAR(50) DEFAULT NULL,
      door_number VARCHAR(50) DEFAULT NULL,
      street_name VARCHAR(255) DEFAULT NULL,
      area_name VARCHAR(255) DEFAULT NULL,
      landmark VARCHAR(255) DEFAULT NULL,
      city VARCHAR(150) DEFAULT NULL,
      district VARCHAR(150) DEFAULT NULL,
      state VARCHAR(150) DEFAULT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      latitude VARCHAR(50) DEFAULT NULL,
      longitude VARCHAR(50) DEFAULT NULL,
      map_link TEXT DEFAULT NULL,
      kitchen_name VARCHAR(255) DEFAULT NULL,
      kitchen_address VARCHAR(255) DEFAULT NULL,
      kitchen_type VARCHAR(255) DEFAULT NULL,
      kitchen_photos TEXT DEFAULT NULL,
      kitchen_videos TEXT DEFAULT NULL,
      seating_available TINYINT(1) DEFAULT 0,
      dining_available TINYINT(1) DEFAULT 0,
      takeaway_available TINYINT(1) DEFAULT 0,
      delivery_available TINYINT(1) DEFAULT 0,
      specialty_food VARCHAR(255) DEFAULT NULL,
      cuisine_type VARCHAR(255) DEFAULT NULL,
      signature_dish VARCHAR(255) DEFAULT NULL,
      veg_nonveg VARCHAR(50) DEFAULT NULL,
      experience_years INT DEFAULT NULL,
      cooking_style VARCHAR(255) DEFAULT NULL,
      preparation_time VARCHAR(255) DEFAULT NULL,
      daily_order_capacity INT DEFAULT NULL,
      available_days VARCHAR(255) DEFAULT NULL,
      opening_time VARCHAR(50) DEFAULT NULL,
      closing_time VARCHAR(50) DEFAULT NULL,
      holiday_schedule VARCHAR(255) DEFAULT NULL,
      busy_hours VARCHAR(255) DEFAULT NULL,
      instant_order TINYINT(1) DEFAULT 0,
      pre_order TINYINT(1) DEFAULT 0,
      aadhaar_number VARCHAR(100) DEFAULT NULL,
      pan_number VARCHAR(100) DEFAULT NULL,
      gst_number VARCHAR(100) DEFAULT NULL,
      bank_account_number VARCHAR(255) DEFAULT NULL,
      ifsc_code VARCHAR(50) DEFAULT NULL,
      account_holder_name VARCHAR(255) DEFAULT NULL,
      upi_id VARCHAR(255) DEFAULT NULL,
      username VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      otp_verified TINYINT(1) DEFAULT 0,
      email_verified TINYINT(1) DEFAULT 0,
      last_login DATETIME DEFAULT NULL,
      device_details TEXT DEFAULT NULL,
      login_status VARCHAR(50) DEFAULT 'Active',
      verification_status VARCHAR(50) DEFAULT 'Pending',
      approval_status VARCHAR(50) DEFAULT 'Pending',
      approved_by_admin VARCHAR(255) DEFAULT NULL,
      approval_date DATETIME DEFAULT NULL,
      rejection_reason TEXT DEFAULT NULL,
      block_reason TEXT DEFAULT NULL,
      aadhaar_front_url VARCHAR(255) DEFAULT NULL,
      aadhaar_back_url VARCHAR(255) DEFAULT NULL,
      pan_card_url VARCHAR(255) DEFAULT NULL,
      fssai_certificate_url VARCHAR(255) DEFAULT NULL,
      gst_certificate_url VARCHAR(255) DEFAULT NULL,
      kitchen_photo1 VARCHAR(255) DEFAULT NULL,
      kitchen_photo2 VARCHAR(255) DEFAULT NULL,
      kitchen_photo3 VARCHAR(255) DEFAULT NULL,
      cooking_area_photo VARCHAR(255) DEFAULT NULL,
      storage_area_photo VARCHAR(255) DEFAULT NULL,
      signature_url VARCHAR(255) DEFAULT NULL,
      selfie_verification_url VARCHAR(255) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Home Chefs table created or already exists');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS dealers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dealer_id VARCHAR(255) UNIQUE,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      rating DECIMAL(3,1) DEFAULT 0,
      orders INT DEFAULT 0,
      image LONGTEXT,
      details LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Dealers table created or already exists');
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

  await addColumnIfNotExists(connection, 'home_chefs', 'user_id', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(connection, 'home_chefs', 'created_by_id', 'INT DEFAULT NULL');
  try {
    await connection.execute("ALTER TABLE `home_chefs` MODIFY COLUMN `created_by_user_id` VARCHAR(255) DEFAULT NULL");
  } catch (err) {
    // Column may not exist yet, so we add it below.
  }

  await addColumnIfNotExists(connection, 'home_chefs', 'created_by_user_id', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(connection, 'home_chefs', 'created_by_name', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(connection, 'home_chefs', 'created_by_email', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(connection, 'home_chefs', 'created_by_phone', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists(connection, 'home_chefs', 'franchise_id', 'VARCHAR(255) DEFAULT NULL');
  const homeChefColumns = [
    ['franchise_user_id', 'VARCHAR(255) DEFAULT NULL'],
    ['father_husband_name', 'VARCHAR(255) DEFAULT NULL'],
    ['gender', 'VARCHAR(50) DEFAULT NULL'],
    ['date_of_birth', 'DATE DEFAULT NULL'],
    ['age', 'INT DEFAULT NULL'],
    ['profile_photo', 'VARCHAR(255) DEFAULT NULL'],
    ['cover_banner', 'VARCHAR(255) DEFAULT NULL'],
    ['alt_mobile', 'VARCHAR(50) DEFAULT NULL'],
    ['whatsapp_number', 'VARCHAR(50) DEFAULT NULL'],
  ];
  for (const [column, definition] of homeChefColumns) {
    await addColumnIfNotExists(connection, 'home_chefs', column, definition);
  }
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `emergency_contact` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `door_number` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `street_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `area_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `landmark` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `city` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `district` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `state` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pincode` VARCHAR(20) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `latitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `longitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `map_link` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_address` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photos` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_videos` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `seating_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `dining_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `takeaway_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `delivery_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `specialty_food` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cuisine_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `signature_dish` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `veg_nonveg` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `experience_years` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cooking_style` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `preparation_time` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `daily_order_capacity` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `available_days` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `opening_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `closing_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `holiday_schedule` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `busy_hours` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `instant_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pre_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `aadhaar_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pan_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gst_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `bank_account_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `account_holder_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `upi_id` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `otp_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `last_login` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `device_details` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `login_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approved_by_admin` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_date` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `block_reason` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `age` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `profile_photo` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cover_banner` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `alt_mobile` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `whatsapp_number` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `emergency_contact` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `door_number` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `street_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `area_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `landmark` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `city` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `district` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `state` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pincode` VARCHAR(20) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `latitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `longitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `map_link` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_address` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photos` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_videos` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `seating_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `dining_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `takeaway_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `delivery_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `specialty_food` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cuisine_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `signature_dish` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `veg_nonveg` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `experience_years` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cooking_style` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `preparation_time` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `daily_order_capacity` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `available_days` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `opening_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `closing_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `holiday_schedule` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `busy_hours` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `instant_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pre_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `aadhaar_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pan_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gst_number` VARCHAR(100) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `bank_account_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `account_holder_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `upi_id` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `otp_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `last_login` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `device_details` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `login_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approved_by_admin` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_date` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `block_reason` TEXT DEFAULT NULL");

  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `age` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `profile_photo` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cover_banner` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `alt_mobile` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `whatsapp_number` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `emergency_contact` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `door_number` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `street_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `area_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `landmark` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `city` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `district` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `state` VARCHAR(150) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pincode` VARCHAR(20) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `latitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `longitude` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `map_link` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_address` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photos` LONGTEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_videos` LONGTEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `seating_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `dining_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `takeaway_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `delivery_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `specialty_food` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cuisine_type` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `signature_dish` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `veg_nonveg` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `experience_years` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cooking_style` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `preparation_time` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `daily_order_capacity` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `available_days` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `opening_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `closing_time` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `holiday_schedule` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `busy_hours` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `instant_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pre_order` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `aadhaar_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pan_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gst_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `bank_account_number` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `account_holder_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `upi_id` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `last_login` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `device_details` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approved_by_admin` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `approval_date` DATETIME DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `block_reason` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `aadhaar_front_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `aadhaar_back_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `pan_card_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `fssai_certificate_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gst_certificate_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photo1` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photo2` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `kitchen_photo3` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cooking_area_photo` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `storage_area_photo` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `signature_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `selfie_verification_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `instagram_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `facebook_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `youtube_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `website_url` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `fssai_available` VARCHAR(50) DEFAULT 'No'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `gst_available` VARCHAR(50) DEFAULT 'No'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `delivery_radius` VARCHAR(50) DEFAULT '5 KM'");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `preorder_available` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cutoff_time` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `about_me` LONGTEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `cooking_story` LONGTEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `why_choose_me` LONGTEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `languages_known` VARCHAR(255) DEFAULT NULL");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS franchise_category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      catId VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      subcategory LONGTEXT,
      images LONGTEXT,
      franchise_user_id VARCHAR(255),
      franchise_id INT,
      created_by_user_id VARCHAR(255),
      created_by_email VARCHAR(255),
      created_by_name VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(catId, franchise_user_id),
      INDEX(franchise_user_id),
      INDEX(franchise_id),
      INDEX(created_by_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Franchise category table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS chef_category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      catId VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      subcategory LONGTEXT,
      images LONGTEXT,
      chef_user_id VARCHAR(255),
      chef_id VARCHAR(255),
      chef_name VARCHAR(255),
      chef_phone VARCHAR(50),
      chef_email VARCHAR(255),
      franchise_user_id VARCHAR(255),
      franchise_id INT,
      franchise_name VARCHAR(255),
      franchise_email VARCHAR(255),
      franchise_phone VARCHAR(50),
      created_by_user_id VARCHAR(255),
      created_by_email VARCHAR(255),
      created_by_name VARCHAR(255),
      created_by_phone VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(catId, chef_user_id),
      INDEX(chef_user_id),
      INDEX(chef_id),
      INDEX(franchise_user_id),
      INDEX(franchise_id),
      INDEX(created_by_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Chef category table created or already exists');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS cheffoodcategorytable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      catId VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category_image VARCHAR(255),
      images LONGTEXT,
      subcategory LONGTEXT,
      chef_user_id VARCHAR(255),
      chef_id VARCHAR(255),
      chef_name VARCHAR(255),
      chef_phone VARCHAR(50),
      chef_email VARCHAR(255),
      franchise_user_id VARCHAR(255),
      franchise_id INT,
      franchise_name VARCHAR(255),
      franchise_email VARCHAR(255),
      franchise_phone VARCHAR(50),
      created_by_user_id VARCHAR(255),
      created_by_email VARCHAR(255),
      created_by_name VARCHAR(255),
      created_by_phone VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(catId, chef_user_id),
      INDEX(chef_user_id),
      INDEX(chef_id),
      INDEX(franchise_user_id),
      INDEX(franchise_id),
      INDEX(created_by_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Chef food category table created or already exists');

  try { await connection.execute('ALTER TABLE chef_category DROP INDEX catId'); } catch (err) {
    // Ignore if the old single-column catId unique index does not exist.
  }
  try { await connection.execute('ALTER TABLE chef_category ADD UNIQUE INDEX catId_chef_user_id (catId, chef_user_id)'); } catch (err) {
    // Ignore if the composite unique index already exists.
  }
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN chef_user_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN chef_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN chef_name VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN chef_phone VARCHAR(50)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN chef_email VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN franchise_user_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN franchise_id INT'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN franchise_name VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN franchise_email VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN franchise_phone VARCHAR(50)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN created_by_user_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN created_by_email VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN created_by_name VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE chef_category ADD COLUMN created_by_phone VARCHAR(50)'); } catch {}

  try { await connection.execute('ALTER TABLE franchise_category DROP INDEX catId'); } catch (err) {
    // Ignore if the old single-column catId unique index does not exist.
  }
  try { await connection.execute('ALTER TABLE franchise_category ADD UNIQUE INDEX catId_franchise_user_id (catId, franchise_user_id)'); } catch (err) {
    // Ignore if the composite unique index already exists.
  }
  
  try { await connection.execute('ALTER TABLE franchise_category ADD COLUMN franchise_user_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD COLUMN franchise_id INT'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD COLUMN created_by_user_id VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD COLUMN created_by_email VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD COLUMN created_by_name VARCHAR(255)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD INDEX(franchise_user_id)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD INDEX(franchise_id)'); } catch {}
  try { await connection.execute('ALTER TABLE franchise_category ADD INDEX(created_by_user_id)'); } catch {}

  try {
    const [categoryCount] = await connection.execute('SELECT COUNT(*) AS count FROM franchise_category');
    if (categoryCount[0].count === 0) {
      const categoriesPath = path.join(__dirname, 'src', 'data', 'categories.json');
      const raw = await fs.readFile(categoriesPath, 'utf8');
      const categoriesData = JSON.parse(raw);
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        for (const category of categoriesData) {
          await connection.execute(
            'INSERT INTO franchise_category (catId, name, description, subcategory, images, created_by_user_id, created_by_email, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              category.catId || `CAT${category.id}`,
              category.name || category.cname || '',
              category.description || null,
              JSON.stringify(category.subcategory || []),
              JSON.stringify(category.images || []),
              null,
              'admin@system.com',
              'System Admin'
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
      partner_id VARCHAR(255) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id VARCHAR(255) DEFAULT NULL,
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
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `delivery_partner_user_id` VARCHAR(255) DEFAULT NULL");
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
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `father_husband_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(50) DEFAULT 'Male'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `age` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `profile_photo` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `cover_photo` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `marital_status` VARCHAR(50) DEFAULT 'Single'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `blood_group` VARCHAR(10)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `alt_mobile` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `whatsapp_number` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `emergency_contact` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `door_number` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `street_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `area_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `landmark` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `city` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `district` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pincode` VARCHAR(20)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `country` VARCHAR(100) DEFAULT 'India'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `latitude` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `longitude` VARCHAR(50)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `map_link` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `username` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `password` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `otp_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `device_id` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `login_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `account_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `rc_book_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_number` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_expiry_date` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pollution_certificate_number` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_front_photo` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `vehicle_back_photo` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `rc_book_image` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `insurance_document_image` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_holder_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_expiry_date` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_front_image` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_back_image` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `driving_experience` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `aadhaar_front_url` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `aadhaar_back_url` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `pan_card_url` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `selfie_verification_url` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `police_verification_certificate` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `background_verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `kyc_verification_status` VARCHAR(50) DEFAULT 'Pending'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `bank_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `account_holder_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `bank_account_number` VARCHAR(255)");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50)");

  // Add unique indexes for delivery_partner identity fields
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_user_id (user_id)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_email (email)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_vehicle_number (vehicle_number)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_license_number (license_number)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_aadhaar_number (aadhaar_number)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_pan_number (pan_number)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_rc_book_number (rc_book_number)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE `delivery_partners` ADD UNIQUE INDEX idx_delivery_partners_bank_account_number (bank_account_number)"); } catch (e) {}
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `branch_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `upi_id` TEXT");
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
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `working_days` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `shift_timing` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `current_location` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `current_address` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `permanent_address` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `live_location` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `emergency_contact_name` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `emergency_contact_relationship` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `emergency_contact_mobile` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `available_areas` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `available_time_morning` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `available_time_afternoon` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `available_time_evening` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `available_time_night` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `face_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `location_verified` TINYINT(1) DEFAULT 0");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `selfie_with_vehicle` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `selfie_with_aadhaar` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `license_issue_date` DATE DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `break_time_status` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `assigned_delivery_area` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `delivery_radius` DECIMAL(8,2) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `preferred_delivery_zone` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ROW_FORMAT=DYNAMIC");
  const deliveryPartnerTextColumns = [
    'father_husband_name', 'profile_photo', 'cover_photo', 'door_number', 'street_name', 'area_name', 'landmark',
    'map_link', 'username', 'password', 'device_id', 'rc_book_number', 'insurance_number', 'pollution_certificate_number',
    'vehicle_front_photo', 'vehicle_back_photo', 'rc_book_image', 'insurance_document_image', 'license_holder_name',
    'license_front_image', 'license_back_image', 'driving_experience', 'aadhaar_front_url', 'aadhaar_back_url', 'pan_card_url',
    'selfie_verification_url', 'police_verification_certificate', 'bank_name', 'account_holder_name', 'bank_account_number',
    'branch_name', 'upi_id', 'availability_schedule', 'working_days', 'shift_timing', 'current_location', 'current_address',
    'permanent_address', 'live_location', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_mobile',
    'available_areas', 'assigned_delivery_area', 'preferred_delivery_zone', 'city_coverage', 'area_coverage', 'break_time_status',
    'selfie_with_vehicle', 'selfie_with_aadhaar', 'preferred_distance'
  ];
  for (const col of deliveryPartnerTextColumns) {
    try {
      await connection.execute(`ALTER TABLE \`delivery_partners\` MODIFY \`${col}\` TEXT`);
    } catch (e) {
      // ignore if the column does not exist or cannot be modified
    }
  }
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `preferred_distance` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `city_coverage` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `area_coverage` TEXT");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `zone_status` VARCHAR(50) DEFAULT 'Active'");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_user_id` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_name` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_email` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `created_by_phone` VARCHAR(50) DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_user_id` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_name` TEXT DEFAULT NULL");
  await connection.execute("ALTER TABLE `delivery_partners` ADD COLUMN IF NOT EXISTS `approved_by_email` TEXT DEFAULT NULL");
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
      franchise_id VARCHAR(255) NOT NULL UNIQUE DEFAULT (UUID()),
      franch_user_id VARCHAR(255) DEFAULT NULL,
      user_id VARCHAR(255) DEFAULT NULL,
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
      role VARCHAR(50) DEFAULT 'Admin',
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
      created_by_user_id VARCHAR(255) DEFAULT NULL,
      created_by_name VARCHAR(255) DEFAULT NULL,
      created_by_email VARCHAR(255) DEFAULT NULL,
      created_by_phone VARCHAR(50) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Franchise Owners table created or already exists');

  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `franchise_owners` ADD COLUMN IF NOT EXISTS `created_by_user_id` VARCHAR(255) DEFAULT NULL");
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
      ADD COLUMN IF NOT EXISTS \`logo_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`banner_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`business_registration_number\` VARCHAR(100),
      ADD COLUMN IF NOT EXISTS \`gst_number\` VARCHAR(100),
      ADD COLUMN IF NOT EXISTS \`pan_number\` VARCHAR(100),
      ADD COLUMN IF NOT EXISTS \`start_date\` DATE,
      ADD COLUMN IF NOT EXISTS \`expiry_date\` DATE,
      ADD COLUMN IF NOT EXISTS \`alt_mobile\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`whatsapp_number\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`website_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`emergency_contact_number\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`door_number\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`street_name\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`area\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`landmark\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`district\` VARCHAR(150),
      ADD COLUMN IF NOT EXISTS \`pincode\` VARCHAR(20),
      ADD COLUMN IF NOT EXISTS \`latitude\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`longitude\` VARCHAR(50),
      ADD COLUMN IF NOT EXISTS \`map_link\` TEXT,
      ADD COLUMN IF NOT EXISTS \`username\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`role\` VARCHAR(50) DEFAULT 'Admin',
      ADD COLUMN IF NOT EXISTS \`otp_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS \`email_verified\` TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS \`login_status\` VARCHAR(50) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS \`aadhaar_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`pan_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`gst_certificate_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`fssai_license_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`shop_license_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`vehicle_rc_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`driving_license_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`bank_passbook_url\` VARCHAR(255),
      ADD COLUMN IF NOT EXISTS \`signature_url\` VARCHAR(255)
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

  // Add login_password column if it doesn't exist
  const loginPwColumns = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'franchise_owners' AND COLUMN_NAME = 'login_password'",
    [DB_NAME]
  );

  if (loginPwColumns[0].count === 0) {
    await connection.execute(`ALTER TABLE \`franchise_owners\` ADD COLUMN \`login_password\` VARCHAR(255)`);
    console.log('Added login_password column to franchise_owners table');
  }

  // Add all missing franchise columns
  const missingColumns = [
    { name: 'business_registration_number', type: 'VARCHAR(255)' },
    { name: 'gst_number', type: 'VARCHAR(100)' },
    { name: 'pan_number', type: 'VARCHAR(100)' },
    { name: 'start_date', type: 'DATE' },
    { name: 'expiry_date', type: 'DATE' },
    { name: 'alt_mobile', type: 'VARCHAR(50)' },
    { name: 'whatsapp_number', type: 'VARCHAR(50)' },
    { name: 'website_url', type: 'VARCHAR(255)' },
    { name: 'emergency_contact_number', type: 'VARCHAR(50)' },
    { name: 'door_number', type: 'VARCHAR(50)' },
    { name: 'street_name', type: 'VARCHAR(255)' },
    { name: 'area', type: 'VARCHAR(255)' },
    { name: 'landmark', type: 'VARCHAR(255)' },
    { name: 'district', type: 'VARCHAR(150)' },
    { name: 'logo_url', type: 'VARCHAR(255)' },
    { name: 'banner_url', type: 'VARCHAR(255)' }
  ];

  for (const col of missingColumns) {
    const colCheck = await connection.execute(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'franchise_owners' AND COLUMN_NAME = ?`,
      [DB_NAME, col.name]
    );
    if (colCheck[0].count === 0) {
      await connection.execute(`ALTER TABLE \`franchise_owners\` ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`Added ${col.name} column to franchise_owners table`);
    }
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
    CREATE TABLE IF NOT EXISTS \`areas\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      pincode VARCHAR(20) NOT NULL UNIQUE,
      created_by INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Areas table created or already exists');
  await connection.execute(`ALTER TABLE areas ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Active';`);

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

  // Insert home chefs
  await connection.execute(`
    INSERT INTO \`home_chefs\` (name, mobile, email, address, fssai_number, status)
    VALUES 
      ('Anandhi Rao', '9876543213', 'anandhi.rao@gmail.com', '42 Green Park Lane, Madurai, Tamil Nadu 625001', '22345678901234', 'Approved'),
      ('Kavitha Sharma', '9876543214', 'kavitha.sharma@gmail.com', '15 Silk Street, Salem, Tamil Nadu 636001', '22345678905555', 'Pending')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);
  
  console.log('Home Chefs created successfully');

  await connection.execute(`
    INSERT INTO \`delivery_partners\` (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status)
    SELECT ?,?,?,?,?,?,? FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM \`delivery_partners\` WHERE mobile = ?)
  `, ['Karthik Kumar', '9876543215', 'Bike', 'TN-37-AB-1234', 'DL-1234567', '1234-5678-9012', 'Approved', '9876543215']);

  await connection.execute(`
    INSERT INTO \`delivery_partners\` (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status)
    SELECT ?,?,?,?,?,?,? FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM \`delivery_partners\` WHERE mobile = ?)
  `, ['Suresh Raina', '9876543216', 'Bike', 'TN-01-XY-9876', 'DL-7654321', '9876-5432-1098', 'Pending', '9876543216']);

  await connection.execute(`
    INSERT INTO \`delivery_partners\` (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status)
    SELECT ?,?,?,?,?,?,? FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM \`delivery_partners\` WHERE mobile = ?)
  `, ['Test Delivery Partner', '9876543217', 'Bike', 'TN-07-ZZ-1234', 'DL-9999999', '1122-3344-5566', 'Pending', '9876543217']);

  await connection.execute(`
    INSERT INTO \`delivery_partners\` (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status)
    SELECT ?,?,?,?,?,?,? FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM \`delivery_partners\` WHERE mobile = ?)
  `, ['Delivery Partner 1', '9876543218', 'Bike', 'TN-09-AA-5678', 'DL-8888888', '2233-4455-6677', 'Pending', '9876543218']);

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
