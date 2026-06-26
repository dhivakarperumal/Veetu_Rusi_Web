const pool = require('./backend/src/config/db');
async function test() {
  const [orders] = await pool.execute("SELECT o.id, o.order_id, o.chef_id, o.chef_user_id, o.franchise_user_id, c.created_by as chef_creator FROM user_food_order_table o LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id) WHERE o.status = 'Searching Delivery Partner'");
  console.log('Orders:', orders);
  const [dps] = await pool.execute('SELECT id, user_id, delivery_partner_code, created_by FROM delivery_partners');
  console.log('Delivery Partners:', dps);
  process.exit(0);
}
test();
