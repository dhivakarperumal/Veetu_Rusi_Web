const fs = require('fs');

const code = fs.readFileSync('backend/src/controllers/superadminController.js', 'utf8');

// Match the INSERT block for createHomeChef
const createBlock = code.substring(code.indexOf('exports.createHomeChef'), code.indexOf('exports.updateHomeChef'));

const colsMatch = createBlock.match(/INSERT INTO home_chefs \(([\s\S]*?)\) VALUES/);
const cols = colsMatch[1].split(',').map(s=>s.trim()).filter(s=>s.length > 0);

const qsMatch = createBlock.match(/VALUES \(([\s\S]*?)\)`/);
const qs = qsMatch[1].split(',').map(s=>s.trim()).filter(s=>s.length > 0);

// For the values array, we need to match what's inside the square brackets after the query
const valArrayMatch = createBlock.match(/VALUES \([\s\S]*?\)`,\s*\[([\s\S]*?)\]\s*\);/);
let valArrayStr = valArrayMatch[1];
// Count commas in valArrayStr that are NOT inside parentheses (wait, there are no parens or brackets in this array, just ternaries)
// Let's just split by comma and see
// Since there might be commas in ternary strings, but there are none! Wait, cuisine_type || 'South Indian' -> no commas.
// Wait, kitchen_photos.map(f => f.filename).join(',') -> wait, kitchen_photos is passed as a string variable, so no comma in the array itself.
// But wait! Is there a comma in `seating_available === 'true' || seating_available === true ? 1 : 0` ? No.
// Let's count commas in valArrayStr:
let valCommas = (valArrayStr.match(/,/g) || []).length;

console.log('Columns: ' + cols.length);
console.log('Placeholders: ' + qs.length);
console.log('Values array commas: ' + valCommas);
console.log('Values count: ' + (valCommas + 1));
