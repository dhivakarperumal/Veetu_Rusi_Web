const pool = require('./backend/src/config/db');
async function test() {
  const [rows] = await pool.execute('SELECT id, user_id, created_by FROM delivery_partners WHERE user_id = ? OR id = ? OR delivery_partner_code = ? LIMIT 1', [17, 17, 17]);
  console.log('Result for int 17:', rows);
  process.exit(0);
}
test();
