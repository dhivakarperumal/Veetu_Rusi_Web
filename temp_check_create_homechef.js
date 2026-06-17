const fs = require('fs');
const text = fs.readFileSync('./backend/src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
if (funcStart === -1) {
  console.error('createHomeChef not found');
  process.exit(1);
}
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const queryPos = funcText.indexOf('await pool.execute(');
if (queryPos === -1) {
  console.error('pool.execute not found in createHomeChef');
  process.exit(1);
}
const quoteStart = funcText.indexOf('`', queryPos);
const quoteEnd = funcText.indexOf('`', quoteStart + 1);
const query = funcText.slice(quoteStart + 1, quoteEnd);
const placeholders = (query.match(/\?/g) || []).length;
const valuesClauseStart = query.indexOf('VALUES (');
const valuesClauseEnd = query.indexOf(')', valuesClauseStart);
const valuesClause = query.slice(valuesClauseStart, valuesClauseEnd + 1);
const valuesPlaceholders = (valuesClause.match(/\?/g) || []).length;
console.log('query placeholders', placeholders);
console.log('values placeholders', valuesPlaceholders);
const valuesArrayStart = funcText.indexOf('[', quoteEnd);
let depth = 0;
let valuesArrayEnd = -1;
for (let i = valuesArrayStart; i < funcText.length; i++) {
  const ch = funcText[i];
  if (ch === '[') depth++;
  if (ch === ']') {
    depth--;
    if (depth === 0) {
      valuesArrayEnd = i;
      break;
    }
  }
}
if (valuesArrayEnd === -1) {
  console.error('values array end not found');
  process.exit(1);
}
const valuesText = funcText.slice(valuesArrayStart + 1, valuesArrayEnd);
const values = valuesText.split(/,(?=(?:[^'"\\]*(['"])(?:\\.|[^'"\\])*\1)*[^'"\\]*$)/).map(v => v.trim()).filter(Boolean);
console.log('values count', values.length);
console.log('last values:', values.slice(-15));
