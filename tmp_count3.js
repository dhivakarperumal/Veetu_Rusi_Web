const fs = require('fs');
const text = fs.readFileSync('backend/src/controllers/superadminController.js', 'utf8');
const fnStart = text.indexOf('exports.createDeliveryPartner = async (req, res) =>');
const paramsMatch = text.slice(fnStart).match(/const params = \[([\s\S]*?)\];/);
const colsMatch = text.slice(fnStart).match(/const cols = `([\s\S]*?)`;/);
if (!paramsMatch || !colsMatch) throw new Error('Missing blocks');
const normalize = (str) => {
  let s = str.replace(/\/\/.*/g, '').replace(/\|\|.*$/g, '').replace(/\?.*:/g, '').trim();
  s = s.replace(/^b\./, '').replace(/^\(|\)/g, '').replace(/\s+.*$/g, '').replace(/['"`]/g, '');  if (s === 'hashedPw') s = 'password';  return s;
};
const params = paramsMatch[1].split(/,(?=\s*[^\s])/).map(s => s.trim()).filter(Boolean);
const paramsNorm = params.map(normalize);
const colsTemplate = colsMatch[1];
const colsFunc = new Function('approved_by_id','approved_by_user_id','approved_by_name','approved_by_email','return `' + colsTemplate.replace(/`/g, '\\`') + '`;');
const cols = colsFunc(null,'x','x','x').split(',').map(s => s.trim()).filter(Boolean);
const colsNorm = cols.map(normalize);
console.log('params', params.length, 'cols', cols.length);
for (let i = 0; i < 40; i++) {
  const p = params[i] || '';
  const c = cols[i] || '';
  const pn = paramsNorm[i] || '';
  const cn = colsNorm[i] || '';
  console.log(i+1, JSON.stringify(p), '->', JSON.stringify(pn), '|', JSON.stringify(c), '->', JSON.stringify(cn), pn===cn ? 'OK' : '');
}
console.log('--- mismatch ---');
for (let i = 0; i < Math.max(params.length, cols.length); i++) {
  const p = params[i] || '';
  const c = cols[i] || '';
  const pn = paramsNorm[i] || '';
  const cn = colsNorm[i] || '';
  if (pn !== cn) {
    console.log('DIFF', i+1, JSON.stringify(p), '->', JSON.stringify(pn), 'col:', JSON.stringify(c), '->', JSON.stringify(cn));
    break;
  }
}
console.log('params tail', params.slice(-20));
console.log('cols tail', cols.slice(-20));
