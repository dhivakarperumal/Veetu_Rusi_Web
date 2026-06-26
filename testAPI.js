const pool = require('./backend/src/config/db');

async function run() {
  try {
    // Mimic API logic for Delivery Partner 17 (Archana P?)
    const deliveryBoyId = 17;

    const [dpRows] = await pool.execute(
      'SELECT created_by FROM delivery_partners WHERE user_id = ? OR id = ? OR delivery_partner_code = ? LIMIT 1',
      [deliveryBoyId, deliveryBoyId, deliveryBoyId]
    );

    let franchiseAdminId = null;
    if (dpRows.length > 0 && dpRows[0].created_by) {
      franchiseAdminId = dpRows[0].created_by;
    }

    console.log(`[orders/available] User: ${deliveryBoyId}, Found FranchiseAdminId: ${franchiseAdminId}`);

    let query = `
      SELECT o.id, o.order_id, c.created_by as c_created, o.franchise_user_id as o_fran
      FROM user_food_order_table o
      LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id)
      WHERE o.status = 'Searching Delivery Partner'
        AND (o.delivery_partner IS NULL OR o.delivery_partner = '')
    `;
    const params = [];

    if (franchiseAdminId) {
      query += ` AND (c.created_by = ? OR o.franchise_user_id = ?)`;
      params.push(franchiseAdminId, franchiseAdminId);
    } else {
      query += ` AND c.created_by IS NULL AND o.franchise_user_id IS NULL`;
    }

    query += ` ORDER BY o.ordered_at DESC`;

    const [rows] = await pool.execute(query, params);
    console.log('Resulting Orders:', rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
run();
