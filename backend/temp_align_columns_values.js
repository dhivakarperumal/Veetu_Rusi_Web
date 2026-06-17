const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const executePos = funcText.indexOf('await pool.execute(');
const qStart = funcText.indexOf('`', executePos);
const qEnd = funcText.indexOf('`', qStart + 1);
const query = funcText.slice(qStart + 1, qEnd);
const colsStart = query.indexOf('INSERT INTO home_chefs (') + 'INSERT INTO home_chefs ('.length;
const colsEnd = query.indexOf(') VALUES', colsStart);
const colsText = query.slice(colsStart, colsEnd).trim();
const cols = colsText.split(/,\s*/).map(s=>s.trim()).filter(Boolean);
const valsStart = funcText.indexOf('[', qEnd);
let depth = 0; let i = valsStart; let valsEnd = -1;
for (; i < funcText.length; i++) {
  const c = funcText[i];
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth===0) { valsEnd = i; break; }}
}
const valsText = funcText.slice(valsStart+1, valsEnd);
const vals = [];
let curr='';
let nest=0;
for (let j = 0; j < valsText.length; j++) {
  const ch = valsText[j];
  if (ch === ',' && nest === 0) { vals.push(curr.trim()); curr=''; continue; }
  curr += ch;
  if (ch === '(') nest++;
  else if (ch === ')') nest--;
}
if (curr.trim()) vals.push(curr.trim());
console.log('cols', cols.length, 'vals', vals.length);
for (let idx = 0; idx < Math.max(cols.length, vals.length); idx++) {
  const c = cols[idx]; const v = vals[idx];
  if (c === undefined) console.log('extra value', idx, v);
  else if (v === undefined) console.log('missing value for', idx, c);
  else if (c && v) {
    console.log(idx, c, '=>', v);
  }
}
