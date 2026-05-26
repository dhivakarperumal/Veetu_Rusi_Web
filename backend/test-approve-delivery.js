const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');
const pool = require('./src/config/db');
require('dotenv').config();
(async ()=>{
  try{
    const [rows] = await pool.execute("SELECT id,user_id,full_name,email,mobile_number FROM users WHERE email = 'admin@gmail.com' LIMIT 1");
    if(!rows.length) return console.error('Admin not found');
    const admin = rows[0];
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign({ id: admin.id, user_id: admin.user_id, full_name: admin.full_name, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    console.log('TOKEN', token);

    const partnerId = process.argv[2] || 75;
    const res = await fetch(`http://localhost:5000/api/superadmin/delivery-partners/${partnerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'Approved' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();