const fs = require('fs');
const text = fs.readFileSync('src/controllers/superadminController.js', 'utf8');
const funcStart = text.indexOf('exports.createHomeChef');
const funcEnd = text.indexOf('exports.updateHomeChef', funcStart);
const funcText = funcEnd === -1 ? text.slice(funcStart) : text.slice(funcStart, funcEnd);
const execPos = funcText.indexOf('await pool.execute(');
const start = funcText.indexOf('`', execPos);
const end = funcText.indexOf('`', start + 1);
const query = funcText.slice(start + 1, end);
console.log('Query length', query.length);
let count = 0;
for (let i = 0; i < query.length; i++) {
  if (query[i] === '?') {
    count++;
    if (count > 70) {
      console.log('?', count, 'pos', i, 'context', query.slice(Math.max(0, i-40), Math.min(query.length, i+40)).replace(/\n/g,' '));
    }
  }
}
console.log('total ?', count);
