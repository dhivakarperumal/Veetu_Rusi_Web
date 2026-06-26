const pool = require('./backend/src/config/db');
async function test() {
  try {
    const [rows] = await pool.execute('SELECT o.id, o.order_id FROM user_food_order_table o LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id) WHERE o.status = "Searching Delivery Partner" AND (o.delivery_partner IS NULL OR o.delivery_partner = "") AND (c.created_by = ? OR o.franchise_user_id = ?)', ['FRAN-93de355f-e250-4584-b264-c110d5bd917a', 'FRAN-93de355f-e250-4584-b264-c110d5bd917a']);
    console.log(rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
