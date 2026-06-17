const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const colsStart = text.indexOf('const insertColumns = [');
const colsEnd = text.indexOf('];', colsStart);
const colsText = text.slice(colsStart + 'const insertColumns = ['.length, colsEnd);
const cols = colsText.split(/,(?=(?:[^\'\"]*\'[^\'\"]*\')*[^\'\"]*$)/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
const valuesStart = text.indexOf('  [', colsEnd);
const valuesEnd = text.indexOf(']', valuesStart);
const valuesText = text.slice(valuesStart + 1, valuesEnd);
const values = valuesText.split(/,(?=(?:[^\'\"]*\'[^\'\"]*\')*[^\'\"]*$)/).map(s => s.trim()).filter(Boolean);
console.log('columns', cols.length, cols.slice(-10));
console.log('values', values.length, values.slice(-10));
const missingValues = cols.filter((c, i) => values[i] === undefined);
console.log('missing values for columns', missingValues);
for (let i = 0; i < Math.min(cols.length, values.length); i++) {
  if (cols[i] && values[i] && cols[i].startsWith('franchise') && values[i] !== values[i]) {}
}
