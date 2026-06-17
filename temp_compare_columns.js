const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  const text = fs.readFileSync('backend/src/controllers/superadminController.js', 'utf8');
  const insertStart = text.indexOf('INSERT INTO home_chefs (');
  const valuesPos = text.indexOf(') VALUES', insertStart);
  const columnsText = text.slice(insertStart + 'INSERT INTO home_chefs ('.length, valuesPos).trim();
  const columns = columnsText.split(/,\s*(?=[^\)]*(?:\(|$))/).map(s => s.trim()).filter(Boolean);
  console.log('insert columns count', columns.length);
  console.log(columns.slice(0, 10));
  console.log('...', columns.slice(-10));

  const conn = await mysql.createConnection({ host:'localhost', user:'root', password:'', database:'veetu_rusi' });
  const [rows] = await conn.execute('SHOW COLUMNS FROM home_chefs');
  const colNames = rows.map(r => r.Field);
  const missing = columns.filter(col => !colNames.includes(col));
  console.log('missing columns', missing);
  await conn.end();
})();