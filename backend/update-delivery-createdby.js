const pool = require('./src/config/db');
(async ()=>{
  try{
    const [admins] = await pool.execute("SELECT id,user_id,full_name,email,mobile_number FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    if(!admins.length) { console.error('No admin found'); process.exit(1); }
    const admin = admins[0];
    console.log('Using admin:', admin.email || admin.full_name || admin.id);

    const [res] = await pool.execute(
      `UPDATE delivery_partners
       SET created_by_id = COALESCE(created_by_id, ?),
           created_by_user_id = COALESCE(created_by_user_id, ?),
           created_by_name = COALESCE(created_by_name, ?),
           created_by_email = COALESCE(created_by_email, ?),
           created_by_phone = COALESCE(created_by_phone, ?)
       WHERE id IN (SELECT id FROM (SELECT id FROM delivery_partners WHERE created_by_user_id IS NULL OR created_by_name IS NULL OR created_by_email IS NULL) AS t)`,
      [admin.id, admin.user_id || null, admin.full_name || 'System Admin', admin.email || null, admin.mobile_number || null]
    );

    console.log('Updated rows:', res.affectedRows);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();