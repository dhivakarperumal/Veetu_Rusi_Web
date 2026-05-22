const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'src', 'controllers', 'productController.js'), 'utf8');
const insertIdx = src.indexOf('INSERT INTO products (');
const afterInsert = src.slice(insertIdx + 'INSERT INTO products ('.length);
let depth = 1; let idx = 0;
for (; idx < afterInsert.length; idx++){
  const ch = afterInsert[idx];
  if (ch === '(') depth++;
  else if (ch === ')') { depth--; if (depth === 0) break; }
}
const colsText = afterInsert.slice(0, idx);
const cols = colsText.split(',').map(s=>s.trim()).filter(Boolean);
const rest = afterInsert.slice(idx+1);
const valuesPos = rest.indexOf('VALUES (');
const valuesSectionStart = valuesPos + 'VALUES ('.length;
depth = 1; idx = valuesSectionStart;
for (; idx < rest.length; idx++){
  const ch = rest[idx];
  if (ch === '(') depth++;
  else if (ch === ')') { depth--; if (depth === 0) break; }
}
const valuesText = rest.slice(valuesSectionStart, idx);
// Count question marks
const qCount = (valuesText.match(/\?/g) || []).length;
console.log('\nVALUES full text:\n', valuesText);
console.log('\nQUESTION MARK POSITIONS:\n');
let idxQ = -1; let qIdx = 0;
while ((idxQ = valuesText.indexOf('?', idxQ+1)) !== -1) {
  console.log('?', ++qIdx, 'context:', valuesText.slice(Math.max(0, idxQ-20), idxQ+20).replace(/\n/g,' '));
}
// locate param array by finding the template literal that contains the INSERT
const sqlBacktickStart = src.lastIndexOf('`', insertIdx);
if (sqlBacktickStart === -1) { console.error('Cannot find opening backtick for SQL'); process.exit(1); }
const sqlBacktickEnd = src.indexOf('`', sqlBacktickStart+1);
if (sqlBacktickEnd === -1) { console.error('Cannot find closing backtick for SQL'); process.exit(1); }
const afterSql = src.slice(sqlBacktickEnd+1);
// find the first array literal after the SQL (parameters)
const arrStart = afterSql.indexOf('[');
const arrEnd = afterSql.indexOf(']');
if (arrStart === -1 || arrEnd === -1) { console.error('Cannot find parameter array after SQL'); }
const arrText = afterSql.slice(arrStart+1, arrEnd);
const arrLines = arrText.split('\n').map(l => l.trim()).filter(l => l.length>0);
const arrJoined = arrLines.join(' ');
const paramItems = arrJoined.split(',').map(s=>s.trim()).filter(Boolean);
console.log('\ncols count', cols.length);
cols.forEach((c,i)=>console.log(i+1, c));
console.log('\nplaceholders (question marks) in VALUES:', qCount);
console.log('\nparam array item count:', paramItems.length);
paramItems.forEach((p,i)=>console.log(i+1, p.replace(/\s+/g,' ')));
