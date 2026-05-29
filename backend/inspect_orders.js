const pool = require('./src/config/db');
(async () => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM user_food_order_table');
    console.log('count', rows[0].cnt);
    const [sample] = await pool.execute('SELECT * FROM user_food_order_table LIMIT 5');
    console.log('sample', sample.map(r => ({
      id: r.id,
      order_id: r.order_id,
      user_id: r.user_id,
      created_by_user_id: r.created_by_user_id,
      ordered_by_user_id: r.ordered_by_user_id,
      franchise_user_id: r.franchise_user_id,
      franchise_id: r.franchise_id,
      ordered_by_name: r.ordered_by_name,
      ordered_by_email: r.ordered_by_email,
      ordered_by_phone: r.ordered_by_phone
    })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
