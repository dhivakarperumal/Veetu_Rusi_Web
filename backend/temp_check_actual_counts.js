const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const executePos = funcText.indexOf('await pool.execute(');
const sqStart = funcText.indexOf('`', executePos);
const sqEnd = funcText.indexOf('`', sqStart + 1);
const query = funcText.slice(sqStart + 1, sqEnd);
const valuesStart = query.indexOf('VALUES (');
const valuesText = query.slice(valuesStart + 'VALUES ('.length, query.lastIndexOf(')'));
const placeholderCount = (valuesText.match(/\?/g)||[]).length;
const valuesArrayStart = funcText.indexOf('[', sqEnd);
let depth=0, idx=valuesArrayStart, arrayEnd=-1;
for(; idx<funcText.length; idx++){ if(funcText[idx]=='[') depth++; else if(funcText[idx]==']'){ depth--; if(depth===0){ arrayEnd=idx; break; }}}
const valuesArrayText = funcText.slice(valuesArrayStart+1, arrayEnd);
const entries = [];
let cur='';
let nested=0;
for(let i=0;i<valuesArrayText.length;i++){ const c=valuesArrayText[i]; if(c==',' && nested===0){ entries.push(cur.trim()); cur=''; continue; } cur += c; if(c=='(') nested++; else if(c==')') nested--; }
if(cur.trim()) entries.push(cur.trim());
console.log('valuesText tail:', valuesText.slice(-200).replace(/\n/g,' '));
console.log('values count', entries.length);
console.log('placeholderCount', placeholderCount);
console.log('last 20 values', entries.slice(-20));
