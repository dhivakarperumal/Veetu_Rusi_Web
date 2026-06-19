from pathlib import Path
import re
path = Path('backend/src/controllers/superadminController.js')
text = path.read_text(encoding='latin-1')
insert = re.search(r'const insertColumns = \[([\s\S]*?)\];', text)
values = re.search(r'const values = \[([\s\S]*?)\];', text)
print('insert found', bool(insert))
print('values found', bool(values))
if insert:
    print('insert len', len(insert.group(1)))
    print(insert.group(1)[:400])
    print('---')
if values:
    print('values len', len(values.group(1)))
    print(values.group(1)[:400])
