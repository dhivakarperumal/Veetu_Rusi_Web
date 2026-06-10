from pathlib import Path
import re
path = Path('src/Admin/Pages/HomeChefManagement.jsx')
lines = path.read_text().splitlines()
start = 776
end = 1867
text = '\n'.join(lines[start:end]).strip()
if text.startswith('{') and text.endswith('}'):
    text = text[1:-1]
pattern = re.compile(r'<(/?)([A-Za-z_][A-Za-z0-9_]*)([^>]*)>')
self_closing = re.compile(r'/\s*>$')
stack = []
for idx, line in enumerate(text.splitlines(), start+1):
    for m in pattern.finditer(line):
        closing = m.group(1) == '/'
        tag = m.group(2)
        attrs = m.group(3)
        if not closing:
            if self_closing.search(m.group(0)) or tag in ['input','img','br','hr','meta','link','area','base','col','embed','param','source','track','wbr']:
                continue
            stack.append((tag, idx, m.group(0)))
        else:
            if stack and stack[-1][0] == tag:
                stack.pop()
            else:
                print('unexpected close', tag, 'line', idx, 'stack top', stack[-1] if stack else None)
print('remaining stack', len(stack))
for item in stack[-20:]:
    print(item)
