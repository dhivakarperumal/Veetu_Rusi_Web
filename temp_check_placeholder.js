const fs = require('fs');
const text = fs.readFileSync('./backend/src/controllers/superadminController.js', 'utf8');
const insertStart = text.indexOf('INSERT INTO home_chefs');
if (insertStart === -1) {
  console.error('INSERT NOT FOUND');
  process.exit(1);
}
const queryStart = text.indexOf('`', insertStart);
const queryEnd = text.indexOf('`', queryStart + 1);
const query = text.slice(queryStart + 1, queryEnd);
const placeholderCount = (query.match(/\?/g) || []).length;
const valuesStart = text.indexOf('[', queryEnd);
const valuesEnd = text.indexOf(']', valuesStart);
const valuesText = text.slice(valuesStart + 1, valuesEnd);
const valuesCount = (valuesText.match(/,/g) || []).length + 1;
console.log('placeholders', placeholderCount);
console.log('values count', valuesCount);
console.log('values snippet', valuesText.slice(0, 400));
