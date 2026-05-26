const mysql = require('mysql2/promise');
(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 1,
    });
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SHOW CREATE TABLE franchise_category');
    console.log(rows[0]['Create Table']);
    const [idx] = await conn.query('SHOW INDEX FROM franchise_category');
    console.log('indexes', idx.map(r => ({ Key_name: r.Key_name, Column_name: r.Column_name, Non_unique: r.Non_unique, Seq_in_index: r.Seq_in_index })));
    const [sample] = await conn.query('SELECT id, catId, franchise_user_id FROM franchise_category ORDER BY id DESC LIMIT 10');
    console.log('sample', sample);
    conn.release();
    await pool.end();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
