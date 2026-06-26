const pool = require('./backend/src/config/db');
async function test() {
  try {
    const [rows] = await pool.execute('SELECT created_by FROM delivery_partners WHERE user_id = ? OR id = ? OR delivery_partner_code = ? LIMIT 1', ['dp_sample_001', 'dp_sample_001', 'dp_sample_001']);
    console.log('Sample DP created_by:', rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
