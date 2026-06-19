import pathlib
import re
text = pathlib.Path('backend/src/controllers/superadminController.js').read_text()
insert = re.search(r'const insertColumns = \[([\s\S]*?)\]\s*;', text)
values = re.search(r'const values = \[([\s\S]*?)\]\s*;', text)
if not insert or not values:
    print('Missing arrays')
    raise SystemExit(1)
insert_items = re.findall(r"'([^']*)'", insert.group(1))
# split values by newline + comma, but ensure we preserve function call lines
value_lines = [line.strip().rstrip(',') for line in re.split(r'\n', values.group(1)) if line.strip()]
# remove trailing commas and blank lines
# Count by lines, since each line is one value and no line contains more than one top-level value except maybe comments
value_items = value_lines
print('insert_count', len(insert_items))
print('value_count', len(value_items))
for i,(a,b) in enumerate(zip(insert_items[-10:], value_items[-10:]), start=max(1,len(insert_items)-9)):
    print(i, a, '=>', b)
if len(insert_items)!=len(value_items):
    print('mismatch')
    print('insert last lines:', insert_items[-5:])
    print('value last lines:', value_items[-5:])
