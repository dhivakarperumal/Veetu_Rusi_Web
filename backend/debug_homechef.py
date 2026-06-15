from pathlib import Path
import re
p = Path('src/controllers/superadminController.js')
text = p.read_text(encoding='utf-8')
start = text.index("const sql = `INSERT INTO home_chefs (")
end = text.index(") VALUES (${Array(104).fill('?').join(', ')})`", start) + len(") VALUES (${Array(104).fill('?').join(', ')})`")
block = text[start:end]
cols_match = re.search(r'INSERT INTO home_chefs \(([^)]*)\)', block, re.S)
cols = [c.strip() for c in cols_match.group(1).split(',')] if cols_match else []
params_start = text.index('const params = [', end)
params_end = text.index('];', params_start) + 2
params_block = text[params_start:params_end]

def count_params(src):
    src = src[src.index('[')+1:src.rindex(']')]
    depth = 0
    count = 0
    for c in src:
        if c in '([{':
            depth += 1
        elif c in ')]}':
            depth -= 1
        elif c == ',' and depth == 0:
            count += 1
    return count + (1 if src.strip() else 0)

print('columns', len(cols))
print('placeholders', block.count('?'))
print('params', count_params(params_block))
