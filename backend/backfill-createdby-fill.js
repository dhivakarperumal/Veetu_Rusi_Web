const pool = require('./src/config/db');

(async () => {
  try {
    console.log('Starting backfill of created_by_user_id and created_by_name...');

    const tables = ['home_chefs', 'delivery_partners', 'franchise_owners'];
    for (const t of tables) {
      const [res] = await pool.execute(
        `UPDATE ${t} h
         JOIN users u ON u.id = h.created_by_id
         SET h.created_by_user_id = COALESCE(h.created_by_user_id, u.user_id),
             h.created_by_name = COALESCE(h.created_by_name, u.full_name),
             h.created_by_email = COALESCE(h.created_by_email, u.email),
             h.created_by_phone = COALESCE(h.created_by_phone, u.mobile_number)
         WHERE h.created_by_id IS NOT NULL AND (h.created_by_user_id IS NULL OR h.created_by_name IS NULL)`
      );
      console.log(`Table ${t}: ${res.affectedRows} rows updated`);
    }

    console.log('Backfill fill complete');
    process.exit(0);
  } catch (err) {
    console.error('Backfill fill error:', err);
    process.exit(1);
  }
})();