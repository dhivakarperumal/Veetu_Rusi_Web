const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'veetu_rusi',
  });

  try { await pool.execute("ALTER TABLE coupons ADD COLUMN coupon_scope VARCHAR(50) DEFAULT 'all'"); console.log('Added coupon_scope'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE coupons ADD COLUMN applicable_home_chef_ids JSON DEFAULT NULL'); console.log('Added applicable_home_chef_ids'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE coupons ADD COLUMN applicable_product_ids JSON DEFAULT NULL'); console.log('Added applicable_product_ids'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE coupons ADD COLUMN applicable_category_ids JSON DEFAULT NULL'); console.log('Added applicable_category_ids'); } catch (e) { console.log(e.message) }
  try { await pool.execute('ALTER TABLE coupons ADD COLUMN applicable_subcategory_ids JSON DEFAULT NULL'); console.log('Added applicable_subcategory_ids'); } catch (e) { console.log(e.message) }
  
  process.exit();
}
test();
