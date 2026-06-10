from pathlib import Path
import re
path = Path('src/Admin/Pages/HomeChefManagement.jsx')
lines = path.read_text().splitlines()
start = 776
end = 1867
opencount = 0
closecount = 0
for i, line in enumerate(lines[start:end], start+1):
    if re.search(r'<div(?:\s|>)', line):
        opencount += 1
        print(f'{i}: OPEN div -> {opencount - closecount}')
    if '</div>' in line:
        closecount += line.count('</div>')
        print(f'{i}: CLOSE div -> {opencount - closecount} after')
print('total', opencount, closecount, opencount-closecount)
