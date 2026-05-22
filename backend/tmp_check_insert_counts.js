const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'controllers', 'productController.js');
const src = fs.readFileSync(file, 'utf8');
const match = src.match(/INSERT INTO products \(([^)]+)\) VALUES \(([^)]+)\)/s);
if (!match) { console.error('INSERT pattern not found'); process.exit(1); }
const cols = match[1].split(',').map(s=>s.trim()).filter(Boolean);
const vals = match[2];
const questionCount = (vals.match(/\?/g) || []).length;
console.log('columnsCount:', cols.length);
console.log('placeholdersCount:', questionCount);
// Now find the array of values in code after the SQL, naive approach
const arrMatch = src.match(/\),\s*\[([\s\S]*?)\]\s*\)/m);
if (arrMatch) {
  const arrContent = arrMatch[1];
  // split top-level commas (naive) by lines
  const items = arrContent.split(/,\n|,\s*/).map(s=>s.trim()).filter(s=>s.length>0);
  console.log('valuesArrayCount (approx):', items.length);
} else {
  console.log('Could not find values array block');
}
