const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = text.slice(funcStart, funcEnd === -1 ? undefined : funcEnd);
const executePos = funcText.indexOf('await pool.execute(');
if (executePos === -1) throw new Error('execute not found');
const quoteStart = funcText.indexOf('`', executePos);
const quoteEnd = funcText.indexOf('`', quoteStart + 1);
const query = funcText.slice(quoteStart + 1, quoteEnd);
const queryPlaceholders = (query.match(/\?/g) || []).length;
const valuesArrayStart = funcText.indexOf('[', quoteEnd);
let depth = 0;
let i = valuesArrayStart;
let valuesEnd = -1;
for (; i < funcText.length; i++) {
  const ch = funcText[i];
  if (ch === '[') depth++;
  else if (ch === ']') {
    depth--;
    if (depth === 0) { valuesEnd = i; break; }
  }
}
if (valuesEnd === -1) throw new Error('values end not found');
const valuesText = funcText.slice(valuesArrayStart + 1, valuesEnd);
const values = valuesText.split(/,(?![^\(]*\))/).map(v => v.trim()).filter(Boolean);
console.log('queryPlaceholders', queryPlaceholders);
console.log('values length', values.length);
console.log('last values', values.slice(-10));
