const pool = require('./backend/src/config/db');

async function alterTable() {
  try {
    await pool.execute('ALTER TABLE `Chef_cart` MODIFY COLUMN `image` LONGTEXT');
    console.log("Successfully altered Chef_cart image column to LONGTEXT");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}

alterTable();
