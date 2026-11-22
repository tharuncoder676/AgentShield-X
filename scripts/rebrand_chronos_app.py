import os

replacements = {
    'companion/index.js': [
        ('See My Nūs', 'See My Chronos'),
        ("label: 'My Nūs'", "label: 'My Chronos'"),
        ("label: 'Quit Nūs'", "label: 'Quit Chronos'"),
        ('`Nūs Companion,', '`Chronos Companion,'),
        ('Send feedback to Pranav...', 'Send feedback to AgentShield-X team...')
    ],
    'companion/home/index.html': [
        ('A newer Nūs Companion is out.', 'A newer Chronos Companion is out.'),
        ('aria-label="News from Nūs"', 'aria-label="News from Chronos"'),
        ('Nūs sends anonymous usage stats (', 'Chronos local telemetry active ('),
        ('Nūs Desktop', 'Chronos Desktop'),
        ('Nūs Companion', 'Chronos Companion'),
        ('My Nūs', 'My Chronos')
    ],
    'companion/home/home.js': [
        ("mynus: 'My Nūs'", "mynus: 'My Chronos'"),
        ("'Nūs Companion '", "'Chronos Companion '"),
        ("'Nūs restarts in about a minute.", "'Chronos restarts in about a minute."),
        ("Offline. Nūs keeps you signed in", "Offline. Chronos keeps you signed in"),
        ("until Nūs quits.", "until Chronos quits."),
        ("My Nūs", "My Chronos")
    ],
    'companion/renderer/index.html': [
        ('Ask Nūs anything', 'Ask Chronos anything'),
        ('The Nūs Knot', 'The Chronos Knot'),
        ('aria-label="Nūs controls"', 'aria-label="Chronos controls"'),
        ('<strong id="knot-status-title">Nūs idle</strong>', '<strong id="knot-status-title">Chronos idle</strong>'),
        ('title="Connected to your Nūs desktop"', 'title="Connected to Chronos Desktop"'),
        ('>Nūs</span>', '>Chronos</span>'),
        ('Nūs Companion', 'Chronos Companion')
    ],
    'companion/renderer/knot-menu.js': [
        ("['menu-quit', 'Quit Nūs', true]", "['menu-quit', 'Quit Chronos', true]")
    ],
    'src/main-companion.js': [
        ("session.title || 'Nūs Companion session'", "session.title || 'Chronos Desktop session'"),
        ("title: 'Nūs Companion could not save'", "title: 'Chronos Desktop could not save'")
    ]
}

base = os.path.abspath(r'chronos_app/resources/app_unpacked')
for rel_path, pairs in replacements.items():
    full_path = os.path.join(base, rel_path.replace('/', os.sep))
    if not os.path.exists(full_path):
        print(f'Missing: {full_path}')
        continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    changed = 0
    for old, new in pairs:
        if old in content:
            content = content.replace(old, new)
            changed += 1
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {rel_path}: {changed} replacements applied.')

print('Rebranding complete.')
