const pool = require('./src/config/db');

(async () => {
  try {
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND TABLE_SCHEMA=DATABASE() ORDER BY ORDINAL_POSITION");
    console.log('count:', cols.length);
  } catch (e) {
    console.error('Query failed:', e.message || e);
  } finally {
    process.exit(0);
  }
})();
