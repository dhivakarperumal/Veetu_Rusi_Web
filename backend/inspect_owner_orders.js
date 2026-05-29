const pool = require('./src/config/db');
(async () => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, order_id, user_id, created_by_user_id, franchise_user_id, franchise_id, ordered_by_name, ordered_by_email, ordered_by_phone FROM user_food_order_table WHERE ordered_by_email = 'thenuga@gmail.com' OR ordered_by_name = 'Thenuga' OR ordered_by_email = 'deva@gmail.com' OR ordered_by_email = 'sakthivel@gmail.com'"
    );
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
