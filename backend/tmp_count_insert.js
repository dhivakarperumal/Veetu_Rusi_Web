const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'src', 'controllers', 'productController.js'), 'utf8');
const insertIdx = src.indexOf('INSERT INTO products (');
if (insertIdx === -1) { console.error('INSERT not found'); process.exit(1); }
const afterInsert = src.slice(insertIdx + 'INSERT INTO products ('.length);
// helper to extract balanced parentheses content
function extractBalanced(s, startIdx=0) {
  let depth = 0;
  let i = startIdx;
  for (; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return { content: s.slice(startIdx+1, i), end: i };
    }
  }
  return null;
}
// But our afterInsert starts at inside parentheses, so find closing ) matching first parenthesis
let depth = 1; let idx = 0;
for (; idx < afterInsert.length; idx++){
  const ch = afterInsert[idx];
  if (ch === '(') depth++;
  else if (ch === ')') { depth--; if (depth === 0) break; }
}
const colsText = afterInsert.slice(0, idx);
const rest = afterInsert.slice(idx+1);
// find VALUES (
const valuesPos = rest.indexOf('VALUES (');
if (valuesPos === -1) { console.error('VALUES not found'); process.exit(1); }
const valuesStart = valuesPos + 'VALUES ('.length - 1; // include opening paren
const valuesSectionStart = valuesPos + 'VALUES ('.length;
// now extract until matching )
depth = 1; idx = valuesSectionStart;
for (; idx < rest.length; idx++){
  const ch = rest[idx];
  if (ch === '(') depth++;
  else if (ch === ')') { depth--; if (depth === 0) break; }
}
const valuesText = rest.slice(valuesSectionStart, idx);
console.log('Columns count (in SQL):', colsText.split(',').map(s=>s.trim()).filter(Boolean).length);
console.log('Placeholders in VALUES text:', (valuesText.match(/\?/g)||[]).length);
console.log('VALUES text snippet:\n', valuesText.slice(0,400));
// find the parameter array after the SQL string - naive: find closing backtick of SQL then comma then array [ ... ]
const sqlBacktickClose = src.indexOf('`', insertIdx);
const sqlEndBacktick = src.indexOf('`', sqlBacktickClose+1);
if (sqlEndBacktick === -1) { console.log('Could not find end of SQL template backtick'); process.exit(0); }
const afterSql = src.slice(sqlEndBacktick+1);
const arrayStart = afterSql.indexOf('[');
const arrayEnd = afterSql.indexOf(']');
const arrayText = afterSql.slice(arrayStart+1, arrayEnd);
const items = arrayText.split(/,\n|,\s*/).map(s=>s.trim()).filter(s=>s.length>0);
console.log('Values array approximate count:', items.length);
console.log('Done');
