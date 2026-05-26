const pool = require('./src/config/db');

(async () => {
  try {
    console.log('Backfilling created_by fields from created_by_email...');
    const tables = ['home_chefs', 'delivery_partners', 'franchise_owners'];
    for (const t of tables) {
      const [res] = await pool.execute(
        `UPDATE ${t} h
         JOIN users u ON u.email = h.created_by_email
         SET h.created_by_user_id = COALESCE(h.created_by_user_id, u.user_id),
             h.created_by_name = COALESCE(h.created_by_name, u.full_name),
             h.created_by_id = COALESCE(h.created_by_id, u.id),
             h.created_by_phone = COALESCE(h.created_by_phone, u.mobile_number)
         WHERE h.created_by_email IS NOT NULL AND (h.created_by_user_id IS NULL OR h.created_by_name IS NULL)`
      );
      console.log(`${t}: ${res.affectedRows} rows updated`);
    }
    console.log('Backfill by email complete');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();