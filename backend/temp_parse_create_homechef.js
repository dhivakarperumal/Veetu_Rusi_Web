const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
if (funcStart === -1) {
  console.error('createHomeChef not found');
  process.exit(1);
}
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const execPos = funcText.indexOf('await pool.execute(');
const queryStart = funcText.indexOf('`', execPos);
const queryEnd = funcText.indexOf('`', queryStart + 1);
const query = funcText.slice(queryStart + 1, queryEnd);
console.log('---SQL QUERY---');
console.log(query);
const valuesStart = query.indexOf(') VALUES (');
const cols = query.slice('INSERT INTO home_chefs ('.length, valuesStart).trim().split(/,\s*/).map(s => s.trim()).filter(Boolean);
const valuesPart = query.slice(valuesStart + ') VALUES ('.length, query.lastIndexOf(')'));
const placeholders = (valuesPart.match(/\?/g) || []).length;
console.log('columns count', cols.length);
console.log('placeholders count', placeholders);
console.log('columns tail', cols.slice(-15));
console.log('---VALUES ARRAY---');
const arrayStart = funcText.indexOf('[', queryEnd);
let depth = 0;
let arrayEnd = -1;
for (let i = arrayStart; i < funcText.length; i++) {
  if (funcText[i] === '[') depth++;
  else if (funcText[i] === ']') {
    depth--;
    if (depth === 0) { arrayEnd = i; break; }
  }
}
if (arrayEnd === -1) { console.error('array end not found'); process.exit(1); }
const arrayText = funcText.slice(arrayStart + 1, arrayEnd);
const entries = arrayText.split(/,(?![^()]*\))/).map(s => s.trim()).filter(Boolean);
console.log('values count', entries.length);
console.log('values tail', entries.slice(-20));
