import os
import re

base = os.path.abspath('chronos_app/resources/app_unpacked')

replacements = [
    # Founders & names
    (r'\bPranav Desu\b', 'Tharunkumar.S'),
    (r'\bPranav\b', 'Tharunkumar'),
    (r'\bpranav\b', 'tharunkumar'),
    (r'\bpotlakai/nus-desktop\b', 'tharunkuamrjeee/agentshield-x'),
    (r'\bpotlakai\.github\.io/nus\b', 'tharunkuamrjeee.github.io/agentshield-x'),
    (r'\bpotlakai\b', 'tharunkuamrjeee'),
    
    # Emails
    (r'lee@nus\.edu', 'tharunkuamrjeee@gmail.com'),
    (r'pranav@potlakai\.com', 'tharunkuamrjeee@gmail.com'),
    (r'desu@potlakai\.com', 'tharunkuamrjeee@gmail.com'),
    
    # User-facing Knot references
    (r'The Knot\b', 'Chronos'),
    (r'the Knot\b', 'Chronos'),
    (r'the knot\b', 'Chronos'),
    (r'with my Knot\b', 'with Chronos'),
    (r'Move Knot to', 'Move Chronos to'),
    (r'Knot display', 'Chronos display'),
    (r'Knot-mark', 'Chronos mark'),
    (r'Knot mark', 'Chronos mark'),
    (r'free Knot', 'Chronos overlay'),
]

count = 0
for root, dirs, files in os.walk(base):
    if 'node_modules' in root:
        continue
    for f in files:
        if f.endswith(('.js', '.html', '.css', '.json', '.md', '.txt')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
            
            modified = content
            for pat, repl in replacements:
                modified = re.sub(pat, repl, modified)
            
            if modified != content:
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(modified)
                count += 1
                print(f'Rebranded: {os.path.relpath(p, base)}')

print(f'Total files updated: {count}')
