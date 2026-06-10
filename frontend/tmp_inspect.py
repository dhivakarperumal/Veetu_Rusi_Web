from pathlib import Path
import re
path = Path('src/Admin/Pages/HomeChefManagement.jsx')
lines = path.read_text().splitlines()
start = 776
end = 1867
text = '\n'.join(lines[start:end]).strip()
print('start line content:', lines[start])
print('end line content:', lines[end-1])
print('first 10 lines:')
for idx, line in enumerate(text.splitlines()[:10], start + 1):
    print(idx, line)
pattern = re.compile(r'<(/?)([A-Za-z_][A-Za-z0-9_]*)([^>]*)>')
for idx, line in enumerate(text.splitlines()[:40], start + 1):
    for m in pattern.finditer(line):
        print(idx, m.group(0))
