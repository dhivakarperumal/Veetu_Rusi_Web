const pool = require('./src/config/db');

async function alterSchema() {
  try {
    // Add columns to home_chefs
    const queries = [
      "ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS latitude VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS longitude VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(150) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(255) DEFAULT NULL"
    ];

    for (let q of queries) {
      try {
        await pool.execute(q);
        console.log("Success:", q);
      } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log("Already exists:", q);
        } else {
          console.error("Error on query", q, e.message);
        }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

alterSchema();
