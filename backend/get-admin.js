const pool = require('./src/config/db');
(async ()=>{
  try{
    const [rows] = await pool.execute("SELECT id, user_id, full_name, email, mobile_number FROM users WHERE email = 'admin@gmail.com' LIMIT 1");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();