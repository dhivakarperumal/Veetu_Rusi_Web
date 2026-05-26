const pool = require('./src/config/db');
(async ()=>{
  try{
    const [admins] = await pool.execute("SELECT id,user_id,full_name,email FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    if(!admins.length) return console.log('No admin found to backfill');
    const admin = admins[0];
    const [res] = await pool.execute(
      `UPDATE delivery_partners SET approved_by_id = COALESCE(approved_by_id, ?), approved_by_user_id = COALESCE(approved_by_user_id, ?), approved_by_name = COALESCE(approved_by_name, ?), approved_by_email = COALESCE(approved_by_email, ?), approval_date = COALESCE(approval_date, NOW()) WHERE status = 'Approved' AND (approved_by_name IS NULL OR approved_by_email IS NULL)`,
      [admin.id, admin.user_id || null, admin.full_name || 'System Admin', admin.email || null]
    );
    console.log('Rows updated:', res.affectedRows);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();