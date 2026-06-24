const pool = require('./src/config/db');

async function testQuery() {
  try {
    const lat = 13.0827;
    const lon = 80.2707;
    const searchRadius = 10;
    
    let query = `SELECT cf.*, u.full_name as chef_name, ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( hc.latitude ) ) * cos( radians( hc.longitude ) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians( hc.latitude ) ) ) ) AS distance FROM chef_food_table cf LEFT JOIN users u ON cf.created_by = u.user_id LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id WHERE 1=1 HAVING (distance <= ${searchRadius} OR distance IS NULL) ORDER BY distance ASC, cf.created_at DESC`;
    
    const [rows] = await pool.execute(query);
    console.log(`Returned ${rows.length} rows with lat/lon and distance IS NULL allowed`);
    process.exit(0);
  } catch(e) {
    console.error('Error executing query:', e.message);
    process.exit(1);
  }
}
testQuery();
