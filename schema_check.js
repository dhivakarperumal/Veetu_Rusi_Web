const pool = require('./backend/src/config/db');
async function check() {
  const [cols] = await pool.execute('SHOW COLUMNS FROM franchise_owners');
  console.log('franchise_owners columns:', cols.map(c => c.Field));
  
  const [cols2] = await pool.execute('SHOW COLUMNS FROM home_chefs');
  console.log('home_chefs columns:', cols2.map(c => c.Field));
  
  const [cols3] = await pool.execute('SHOW COLUMNS FROM franchise_products');
  console.log('franchise_products columns:', cols3.map(c => c.Field));
  
  process.exit(0);
}
check();
