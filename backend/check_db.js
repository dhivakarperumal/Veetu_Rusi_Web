const pool = require('./src/config/db');

async function check() {
  try {
    const [chefs] = await pool.execute('SELECT id, user_id, name, created_by FROM home_chefs');
    console.log('Chefs:', chefs);
    
    const [dps] = await pool.execute('SELECT id, user_id, name, created_by FROM delivery_partners');
    console.log('Delivery Partners:', dps);

    const [orders] = await pool.execute('SELECT id, status, delivery_partner, chef_user_id, franchise_user_id FROM user_food_order_table ORDER BY id DESC LIMIT 5');
    console.log('Recent Orders:', orders);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
