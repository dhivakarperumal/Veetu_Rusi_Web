const pool = require('./backend/src/config/db');

async function alterTable() {
  try {
    await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN `franchise_user_id` VARCHAR(100);');
    console.log("Added franchise_user_id");
  } catch(e) { console.error(e.message); }

  try {
    await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN `franchise_user_name` VARCHAR(255);');
    console.log("Added franchise_user_name");
  } catch(e) { console.error(e.message); }

  try {
    await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN `franchise_user_email` VARCHAR(255);');
    console.log("Added franchise_user_email");
  } catch(e) { console.error(e.message); }

  process.exit(0);
}

alterTable();
