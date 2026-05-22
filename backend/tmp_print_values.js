const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'controllers', 'productController.js');
const src = fs.readFileSync(file, 'utf8');
const match = src.match(/INSERT INTO products \(([^)]+)\) VALUES \(([^)]+)\)/s);
if (!match) { console.error('INSERT pattern not found'); process.exit(1); }
console.log('COLUMNS:\n', match[1]);
console.log('\nVALUES TEMPLATE:\n', match[2]);
console.log('\nQUESTION COUNT:', (match[2].match(/\?/g)||[]).length);
