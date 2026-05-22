const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestHomeChef() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Function to generate unique chef code
    function generateChefUniqueCode() {
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `CHEF-${timestamp}-${randomPart}`;
    }

    // Generate unique codes
    const chefCode1 = generateChefUniqueCode();
    const chefCode2 = generateChefUniqueCode();

    // Insert test data with complete information
    await connection.execute(`
      INSERT INTO \`home_chefs\` 
      (chef_id, chef_unique_code, name, mobile, email, address, fssai_number, status, created_at)
      VALUES 
      (UUID(), ?, 'Anandhi Rao', '9876543213', 'anandhi.rao@gmail.com', '42 Green Park Lane, Madurai, Tamil Nadu 625001', '22345678901234', 'Approved', NOW()),
      (UUID(), ?, 'Kavitha Sharma', '9876543214', 'kavitha.sharma@gmail.com', '15 Silk Street, Salem, Tamil Nadu 636001', '22345678905555', 'Pending', NOW())
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        status = VALUES(status),
        updated_at = NOW()
    `, [chefCode1, chefCode2]);

    console.log('\n✓ Test Home Chefs Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHEF 1 - COMPLETE USER DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: Anandhi Rao`);
    console.log(`Chef Unique Code: ${chefCode1}`);
    console.log(`Mobile: 9876543213`);
    console.log(`Email: anandhi.rao@gmail.com`);
    console.log(`Address: 42 Green Park Lane, Madurai, Tamil Nadu 625001`);
    console.log(`FSSAI Number: 22345678901234`);
    console.log(`Status: Approved`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHEF 2 - COMPLETE USER DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: Kavitha Sharma`);
    console.log(`Chef Unique Code: ${chefCode2}`);
    console.log(`Mobile: 9876543214`);
    console.log(`Email: kavitha.sharma@gmail.com`);
    console.log(`Address: 15 Silk Street, Salem, Tamil Nadu 636001`);
    console.log(`FSSAI Number: 22345678905555`);
    console.log(`Status: Pending`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify insertion
    const [result] = await connection.execute(
      'SELECT id, chef_id, chef_unique_code, name, email, mobile, status FROM `home_chefs` WHERE email IN (?, ?)',
      ['anandhi.rao@gmail.com', 'kavitha.sharma@gmail.com']
    );

    console.log('✓ Database Verification:');
    result.forEach((row, index) => {
      console.log(`\n  Chef ${index + 1}:`);
      console.log(`    ID: ${row.id}`);
      console.log(`    Chef ID: ${row.chef_id}`);
      console.log(`    Unique Code: ${row.chef_unique_code}`);
      console.log(`    Name: ${row.name}`);
      console.log(`    Email: ${row.email}`);
      console.log(`    Mobile: ${row.mobile}`);
      console.log(`    Status: ${row.status}`);
    });

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

insertTestHomeChef();
