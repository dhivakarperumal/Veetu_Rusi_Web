const fs = require('fs');
const path = 'backend/src/controllers/superadminController.js';
const text = fs.readFileSync(path, 'utf8');
const fnStart = text.indexOf('exports.createDeliveryPartner = async (req, res) =>');
const paramsStart = text.indexOf('const params = [', fnStart);
const paramsEnd = text.indexOf('];', paramsStart) + 2;
const paramsLiteral = text.slice(paramsStart + 'const params = '.length, paramsEnd - 1);
function countTopLevelItems(str) {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;
  let count = 1;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inBacktick) {
      if (ch === '`') inBacktick = false;
      continue;
    }
    if (ch === "'") { inSingle = true; continue; }
    if (ch === '"') { inDouble = true; continue; }
    if (ch === '`') { inBacktick = true; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) count++;
  }
  return count;
}
const paramsCount = countTopLevelItems(paramsLiteral);
const colsStart = text.indexOf('const cols = `', paramsEnd);
const colsEnd = text.indexOf('`;', colsStart);
const colsLiteral = text.slice(colsStart + 'const cols = '.length, colsEnd + 1);
function countCols(approvedById) {
  const approved_by_id = approvedById;
  const approved_by_user_id = 'x';
  const approved_by_name = 'x';
  const approved_by_email = 'x';
  const cols = eval(colsLiteral);
  return cols.split(',').map(c => c.trim()).filter(Boolean).length;
}
console.log('params length:', paramsCount);
console.log('cols length when approved_by_id=null:', countCols(null));
console.log('cols length when approved_by_id=1:', countCols(1));
console.log('cols last 10 when null:', eval(colsLiteral).split(',').map(c=>c.trim()).filter(Boolean).slice(-10));
console.log('cols first 10 when null:', eval(colsLiteral).split(',').map(c=>c.trim()).filter(Boolean).slice(0,10));
