const pool = require('./src/config/db');
(async ()=>{
  try{
    const [rows] = await pool.execute("SELECT id, name, vehicle_type, vehicle_number, vehicle_brand FROM delivery_partners LIMIT 20");
    console.table(rows);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();