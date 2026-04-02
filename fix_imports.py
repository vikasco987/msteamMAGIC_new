import os
import re

root_dir = r"c:\Users\VIKASH\msteamMAGIC\src"
patterns = [
    (re.compile(r"['\"]\.\.\/.*lib/prisma['\"]"), '"@/lib/prisma"'),
    (re.compile(r"['\"]\.\.\/.*lib/colorUtils['\"]"), '"@/lib/colorUtils"')
]

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in patterns:
                new_content = pattern.sub(replacement, new_content)
            
            if new_content != content:
                print(f"Updating {path}")
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
