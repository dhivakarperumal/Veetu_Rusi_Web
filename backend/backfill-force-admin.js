const pool = require('./src/config/db');

(async () => {
  try {
    console.log('Resolving default admin...');
    const [admins] = await pool.execute("SELECT id, user_id, full_name, email, mobile_number FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    if (!admins.length) {
      console.error('No admin user found; aborting.');
      process.exit(1);
    }
    const admin = admins[0];
    console.log('Using admin:', admin.email || admin.full_name || admin.id);

    const tables = ['home_chefs','delivery_partners','franchise_owners'];
    for (const t of tables) {
      // 1) For rows where creator id is set but no corresponding user exists -> set to admin
      const [res1] = await pool.execute(
        `UPDATE ${t} h
         LEFT JOIN users u ON u.id = h.created_by_id
         SET h.created_by_id = ?, h.created_by_user_id = COALESCE(h.created_by_user_id, ?), h.created_by_name = COALESCE(h.created_by_name, ?), h.created_by_email = COALESCE(h.created_by_email, ?), h.created_by_phone = COALESCE(h.created_by_phone, ?)
         WHERE h.created_by_id IS NOT NULL AND u.id IS NULL`,
        [admin.id, admin.user_id || null, admin.full_name || 'System Admin', admin.email || null, admin.mobile_number || null]
      );

      // 2) For rows where creator fields are NULL -> set to admin
      const [res2] = await pool.execute(
        `UPDATE ${t}
         SET created_by_id = COALESCE(created_by_id, ?), created_by_user_id = COALESCE(created_by_user_id, ?), created_by_name = COALESCE(created_by_name, ?), created_by_email = COALESCE(created_by_email, ?), created_by_phone = COALESCE(created_by_phone, ?)
         WHERE (created_by_user_id IS NULL OR created_by_name IS NULL OR created_by_email IS NULL)`,
        [admin.id, admin.user_id || null, admin.full_name || 'System Admin', admin.email || null, admin.mobile_number || null]
      );

      console.log(`${t}: fixed missing/mismatched creators: replaced ${res1.affectedRows} stale ids, filled ${res2.affectedRows} empty creators`);
    }

    console.log('Force backfill complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during force backfill:', err);
    process.exit(1);
  }
})();