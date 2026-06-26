const pool = require('./backend/src/config/db');

async function fixPastOrders() {
  try {
    const [orders] = await pool.execute(`
      SELECT o.id, o.order_id, o.chef_user_id, c.created_by
      FROM user_food_order_table o
      JOIN home_chefs c ON o.chef_user_id = c.user_id
      WHERE o.franchise_user_id IS NULL OR o.franchise_user_id = ''
    `);

    console.log(`Found ${orders.length} orders with missing franchise_user_id.`);

    let updatedCount = 0;
    for (const order of orders) {
      if (order.created_by) {
        await pool.execute(
          'UPDATE user_food_order_table SET franchise_user_id = ? WHERE id = ?',
          [order.created_by, order.id]
        );
        console.log(`Updated Order ${order.order_id} -> franchise_user_id: ${order.created_by}`);
        updatedCount++;
      }
    }
    console.log(`Successfully fixed ${updatedCount} orders.`);
  } catch (err) {
    console.error('Error fixing past orders:', err);
  }
  process.exit(0);
}

fixPastOrders();
