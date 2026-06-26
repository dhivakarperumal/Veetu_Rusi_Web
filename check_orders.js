const pool = require('./backend/src/config/db');
async function test() {
  const [orders] = await pool.execute("SELECT id, order_id, status, delivery_partner, franchise_user_id FROM user_food_order_table WHERE status = 'Searching Delivery Partner'");
  console.log(orders);
  process.exit(0);
}
test();
