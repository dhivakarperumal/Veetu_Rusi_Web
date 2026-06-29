const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veetu_rusi',
  });

  try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN coupon_id INT DEFAULT NULL'); console.log('Added coupon_id'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL'); console.log('Added coupon_code'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0'); console.log('Added discount_amount'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN final_total DECIMAL(10,2) DEFAULT 0'); console.log('Added final_total'); } catch (e) { console.log(e.message) }
  
  process.exit();
}
test();
