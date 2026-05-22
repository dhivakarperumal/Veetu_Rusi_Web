const mysql = require('mysql2/promise');
require('dotenv').config();

async function addChefUniqueCode() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Check if column exists
    const [columns] = await connection.execute(
      "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'home_chefs' AND COLUMN_NAME = 'chef_unique_code'",
      [process.env.DB_NAME || 'veetu_rusi']
    );

    if (columns[0].count === 0) {
      // Add the column
      await connection.execute(`
        ALTER TABLE \`home_chefs\`
        ADD COLUMN \`chef_unique_code\` VARCHAR(100) UNIQUE DEFAULT NULL
      `);
      console.log('✓ chef_unique_code column added to home_chefs table');
    } else {
      console.log('✓ chef_unique_code column already exists');
    }

    // Function to generate unique chef code
    function generateChefUniqueCode() {
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `CHEF-${timestamp}-${randomPart}`;
    }

    // Get existing home chefs without codes
    const [chefs] = await connection.execute(
      'SELECT id, name, email FROM `home_chefs` WHERE chef_unique_code IS NULL'
    );

    // Update each chef with a unique code
    for (const chef of chefs) {
      const uniqueCode = generateChefUniqueCode();
      await connection.execute(
        'UPDATE `home_chefs` SET chef_unique_code = ? WHERE id = ?',
        [uniqueCode, chef.id]
      );
      console.log(`✓ Chef "${chef.name}" (${chef.email}) assigned code: ${uniqueCode}`);
    }

    console.log('\n✓ All home chefs now have unique codes!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addChefUniqueCode();
