const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'backend/src/controllers/superadminController.js');
const text = fs.readFileSync(filePath, 'utf8');
const insertStart = text.indexOf('const insertColumns = [');
const insertEnd = text.indexOf('];', insertStart);
const valuesStart = text.indexOf('const values = [', insertEnd);
const valuesEnd = text.indexOf('];', valuesStart);
const insertText = text.slice(insertStart + 'const insertColumns = ['.length, insertEnd);
const valuesText = text.slice(valuesStart + 'const values = ['.length, valuesEnd);
const parseSingleQuoted = (str) => {
  const matches = [];
  const regex = /'([^']*)'/g;
  let m;
  while ((m = regex.exec(str))) {
    matches.push(m[1]);
  }
  return matches;
};
const parseValues = (str) => {
  const result = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (!inSingle && ch === '"' && str[i-1] !== '\\') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inDouble && ch === "'" && str[i-1] !== '\\') {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{' || ch === '(') depth++;
      if (ch === ']' || ch === '}' || ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        if (current.trim()) result.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
};
const insertItems = parseSingleQuoted(insertText);
const valuesItems = parseValues(valuesText).map(x => x.replace(/,$/, '').trim());
console.log('insert count', insertItems.length);
console.log('values count', valuesItems.length);
if (insertItems.length !== valuesItems.length) {
  console.log('mismatch');
  const max = Math.max(insertItems.length, valuesItems.length);
  for (let i = 0; i < max; i++) {
    console.log(i + 1, insertItems[i] || '<MISSING>', '=>', valuesItems[i] || '<MISSING>');
  }
} else {
  console.log('match');
}
