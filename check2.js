const pool = require('./backend/src/config/db');
async function test() {
  try {
    const [rows] = await pool.execute('SELECT created_by FROM delivery_partners WHERE user_id = ? OR id = ? LIMIT 1', ['DEL-6829f568-a19a-46ce-aa48-838209659b35', 'DEL-6829f568-a19a-46ce-aa48-838209659b35']);
    console.log(rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
