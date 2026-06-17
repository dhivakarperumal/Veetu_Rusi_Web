const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const executePos = funcText.indexOf('await pool.execute(');
const quoteStart = funcText.indexOf('`', executePos);
const quoteEnd = funcText.indexOf('`', quoteStart + 1);
const query = funcText.slice(quoteStart + 1, quoteEnd);
const insertStart = query.indexOf('INSERT INTO home_chefs (');
const valuesStart = query.indexOf(') VALUES (', insertStart);
const colsText = query.slice(insertStart + 'INSERT INTO home_chefs ('.length, valuesStart).trim();
const cols = colsText.split(/,\s*(?=[^\)]*(?:\(|$))/).map(s => s.trim()).filter(Boolean);
const valuesText = query.slice(valuesStart + ') VALUES ('.length, query.lastIndexOf(')'));
const values = [];
let current = '';
let depth = 0;
for (let i = 0; i < valuesText.length; i++) {
  const ch = valuesText[i];
  if (ch === ',' && depth === 0) {
    values.push(current.trim());
    current = '';
    continue;
  }
  current += ch;
  if (ch === '(') depth++;
  if (ch === ')') depth--;
}
if (current.trim()) values.push(current.trim());
console.log('cols count', cols.length);
console.log('values count', values.length);
console.log('last values', values.slice(-15));
console.log('last cols', cols.slice(-15));
console.log('third from end values', values.slice(-20));
for (let i = 0; i < Math.max(cols.length, values.length); i++) {
  if (i < cols.length && i < values.length) {
    const v = values[i];
    if (v !== '?') {
      console.log('at', i, 'col', cols[i], 'value', v);
    }
  } else if (i < cols.length) {
    console.log('missing value for col', i, cols[i]);
  } else {
    console.log('extra value at', i, values[i]);
  }
}
