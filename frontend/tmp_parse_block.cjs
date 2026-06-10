const { readFileSync } = require('fs');
const parser = require('@babel/parser');
const code = readFileSync('src/Admin/Pages/HomeChefManagement.jsx', 'utf8').split(/\r?\n/);
const start = 776; // 0-based index for line 777
const end = 1867; // exclusive
let block = code.slice(start, end).join('\n');
block = block.trim();
if (block.startsWith('{') && block.endsWith('}')) {
  block = block.slice(1, -1);
}
const wrapped = `const x = (<>{${block}}</>);`;
try {
  parser.parse(wrapped, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  console.log('parsed ok');
} catch (err) {
  console.error(err.message);
  if (err.loc) {
    console.error('line', err.loc.line, 'column', err.loc.column);
    const lines = wrapped.split(/\r?\n/);
    const idx = err.loc.line - 1;
    const start = Math.max(0, idx - 3);
    const end = Math.min(lines.length, idx + 3);
    console.error('context:');
    for (let i = start; i < end; i++) {
      console.error(`${i + 1}: ${lines[i]}`);
    }
  }
}
