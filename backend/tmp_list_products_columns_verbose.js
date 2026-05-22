const pool = require('./src/config/db');

(async () => {
  try {
    const [cols] = await pool.execute("SELECT ORDINAL_POSITION,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND TABLE_SCHEMA=DATABASE() ORDER BY ORDINAL_POSITION");
    cols.forEach(c => console.log(c.ORDINAL_POSITION, c.COLUMN_NAME));
    console.log('total:', cols.length);
  } catch (e) {
    console.error('Query failed:', e.message || e);
  } finally {
    process.exit(0);
  }
})();
