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

  // SuperAdmin Tables
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`restaurants\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
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

  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_id` INT DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_user_id` CHAR(36) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_name` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_email` VARCHAR(255) DEFAULT NULL");
  await connection.execute("ALTER TABLE `home_chefs` ADD COLUMN IF NOT EXISTS `created_by_phone` VARCHAR(50) DEFAULT NULL");

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`delivery_partners\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      partner_id CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
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
      franchise_name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Franchise Owners table created or already exists');

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
