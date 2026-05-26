const pool = require('./src/config/db');

(async () => {
  try {
    const [admins] = await pool.execute("SELECT id, user_id, full_name AS name, email, mobile_number AS phone FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    if (!admins.length) {
      console.log('No admin user found to backfill.');
      process.exit(0);
    }
    const admin = admins[0];
    console.log('Using admin:', admin.email || admin.name || admin.id);

    const tables = ['delivery_partners', 'home_chefs', 'franchise_owners'];
    for (const t of tables) {
      const [res] = await pool.execute(
        `UPDATE ${t} SET created_by_id = ?, created_by_user_id = ?, created_by_name = ?, created_by_email = ?, created_by_phone = ? WHERE created_by_id IS NULL OR created_by_id = ''`,
        [admin.id, admin.user_id || null, admin.name || 'System Admin', admin.email || null, admin.phone || null]
      );
      console.log(`Updated ${res.affectedRows} rows in ${t}`);
    }

    console.log('Backfill complete');
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
})();