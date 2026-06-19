const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'backend/src/controllers/superadminController.js');
const text = fs.readFileSync(filePath, 'utf8');
const insertMatch = text.match(/const insertColumns = \[([\s\S]*?)\];/);
const valuesMatch = text.match(/const values = \[([\s\S]*?)\];/);
if (!insertMatch || !valuesMatch) {
  console.error('Did not find insertColumns or values arrays');
  process.exit(1);
}
const splitItems = (txt) => txt.split(/,\s*\n/).map(x => x.trim()).filter(Boolean);
const insertItems = splitItems(insertMatch[1]).map(x => x.replace(/^['"]|['"]$/g, '').trim());
const valueItems = splitItems(valuesMatch[1]).map(x => x.trim());
console.log('insertColumns', insertItems.length);
console.log('values', valueItems.length);
if (insertItems.length !== valueItems.length) {
  console.log('mismatch');
  const max = Math.max(insertItems.length, valueItems.length);
  for (let i = 0; i < max; i++) {
    console.log(i + 1, insertItems[i] || '<MISSING>', '=>', valueItems[i] || '<MISSING>');
  }
}
else {
  console.log('match');
}
