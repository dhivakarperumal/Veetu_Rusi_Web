const pool = require('./src/config/db');

async function checkSchema() {
  try {
    const [userCols] = await pool.execute('SHOW COLUMNS FROM users');
    console.log('--- users ---');
    console.log(userCols.map(c => `${c.Field} ${c.Type}`).join('\n'));

    try {
      const [chefCols] = await pool.execute('SHOW COLUMNS FROM home_chefs');
      console.log('\n--- home_chefs ---');
      console.log(chefCols.map(c => `${c.Field} ${c.Type}`).join('\n'));
    } catch(e) {
      console.log('\nhome_chefs table missing or error:', e.message);
    }

    try {
      const [foodCols] = await pool.execute('SHOW COLUMNS FROM chef_food_table');
      console.log('\n--- chef_food_table ---');
      console.log(foodCols.map(c => `${c.Field} ${c.Type}`).join('\n'));
    } catch(e) {
      console.log('\nchef_food_table missing or error:', e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
