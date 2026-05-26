const pool = require('./src/config/db');
(async ()=>{
  try{
    const [rows] = await pool.execute("SELECT id, partner_id, created_by_id, created_by_user_id, created_by_name, created_by_email, created_by_phone, name, mobile FROM delivery_partners WHERE created_by_user_id IS NULL OR created_by_name IS NULL OR created_by_email IS NULL LIMIT 200");
    console.table(rows);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();