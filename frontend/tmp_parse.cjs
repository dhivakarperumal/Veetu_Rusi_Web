const { readFileSync } = require('fs');
const parser = require('@babel/parser');
const code = readFileSync('src/Admin/Pages/HomeChefManagement.jsx', 'utf8');
try {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  console.log('parsed ok');
} catch (err) {
  console.error(err.message);
  if (err.loc) {
    console.error('line', err.loc.line, 'column', err.loc.column);
  }
}
