import os
import re
import shutil

base = os.path.abspath('chronos_app/resources/app_unpacked')

# 1. Copy agentshield.ico to all target locations
for dest in [
    os.path.join(base, 'companion', 'home', 'agentshield.ico'),
    os.path.join(base, 'companion', 'renderer', 'agentshield.ico'),
    os.path.join(base, 'icon.ico'),
    os.path.abspath('chronos_app/icon.ico')
]:
    shutil.copyfile('chronos_app/agentshield.ico', dest)
    print(f'Copied ico to {dest}')

# 2. Update companion/src/updates.js
p_updates = os.path.join(base, 'companion', 'src', 'updates.js')
if os.path.exists(p_updates):
    with open(p_updates, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('potlakai/nus-desktop', 'tharunkuamrjeee/agentshield-x')
    with open(p_updates, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated updates.js')

# 3. Update companion/src/channel.js
p_channel = os.path.join(base, 'companion', 'src', 'channel.js')
if os.path.exists(p_channel):
    with open(p_channel, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('https://potlakai.github.io/nus/companion/channel.json', 'https://tharunkuamrjeee.github.io/agentshield-x/companion/channel.json')
    c = c.replace('https://github.com/potlakai/nus-desktop/releases/download/', 'https://github.com/tharunkuamrjeee/agentshield-x/releases/download/')
    c = c.replace('potlakai.github.io', 'tharunkuamrjeee.github.io')
    c = c.replace('potlakai/nus-desktop', 'tharunkuamrjeee/agentshield-x')
    with open(p_channel, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated channel.js')

# 4. Update companion/home/share.js
p_share = os.path.join(base, 'companion', 'home', 'share.js')
if os.path.exists(p_share):
    with open(p_share, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('with my Knot.', 'with Chronos.')
    c = c.replace('POTLAKAI.GITHUB.IO/CHRONOS', 'AGENTSHIELD-X')
    with open(p_share, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated share.js')

# 5. Update companion/home/home.js
p_home_js = os.path.join(base, 'companion', 'home', 'home.js')
if os.path.exists(p_home_js):
    with open(p_home_js, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('Pranav reads every note.', 'Tharunkumar reads every note.')
    c = c.replace('Pranav', 'Tharunkumar')
    with open(p_home_js, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated home.js')

# 6. Update companion/home/index.html
p_home_html = os.path.join(base, 'companion', 'home', 'index.html')
if os.path.exists(p_home_html):
    with open(p_home_html, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('https://github.com/potlakai/nus-desktop/releases', 'https://github.com/tharunkuamrjeee/agentshield-x')
    c = c.replace('Jev decides, Claude or Gemini answers.', 'AgentShield-X Autonomous Security Engine Active.')
    with open(p_home_html, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated home index.html')

# 7. Update companion/index.js
p_index_js = os.path.join(base, 'companion', 'index.js')
if os.path.exists(p_index_js):
    with open(p_index_js, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("'Move Knot to'", "'Move Chronos to'")
    c = c.replace("agentshield-logo.png", "agentshield.ico")
    with open(p_index_js, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated companion index.js')

# 8. Update src/main-companion.js
p_main_comp = os.path.join(base, 'src', 'main-companion.js')
if os.path.exists(p_main_comp):
    with open(p_main_comp, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("agentshield-logo.png", "agentshield.ico")
    c = c.replace('Pranav', 'Tharunkumar')
    with open(p_main_comp, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated main-companion.js')

# 9. Update companion/src/reflex/rules.js
p_rules = os.path.join(base, 'companion', 'src', 'reflex', 'rules.js')
if os.path.exists(p_rules):
    with open(p_rules, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('lee@nus.edu', 'tharunkuamrjeee@gmail.com')
    c = c.replace('|nus|', '|nus|chronos|')
    c = c.replace('|nus)', '|nus|chronos)')
    with open(p_rules, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated reflex/rules.js')

# 10. Update companion/renderer/styles.css to guarantee knot-canvas is hidden and Chronos logo glows
p_css = os.path.join(base, 'companion', 'renderer', 'styles.css')
if os.path.exists(p_css):
    with open(p_css, 'r', encoding='utf-8') as f:
        c = f.read()
    override_css = """
/* --- AGENTSHIELD-X CHRONOS REBRAND OVERRIDES --- */
#knot-canvas { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
.chronos-logo-mark {
  display: block !important;
  width: 44px !important;
  height: 44px !important;
  object-fit: contain !important;
  filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.85)) drop-shadow(0 0 20px rgba(139, 92, 246, 0.4)) !important;
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.25s ease !important;
  margin: auto !important;
}
#orb:hover .chronos-logo-mark {
  transform: scale(1.1) !important;
  filter: drop-shadow(0 0 18px rgba(192, 132, 252, 1)) drop-shadow(0 0 28px rgba(168, 85, 247, 0.6)) !important;
}
#orb.k3d {
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(11, 13, 18, 0.9) 70%) !important;
  border: 1px solid rgba(168, 85, 247, 0.4) !important;
  box-shadow: 0 0 24px rgba(168, 85, 247, 0.35) !important;
  border-radius: 50% !important;
}
"""
    if 'AGENTSHIELD-X CHRONOS REBRAND OVERRIDES' not in c:
        c += '\n' + override_css
        with open(p_css, 'w', encoding='utf-8') as f:
            f.write(c)
        print('Appended brand CSS to styles.css')

# 11. Update package.json
p_pkg = os.path.join(base, 'package.json')
if os.path.exists(p_pkg):
    with open(p_pkg, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('https://github.com/potlakai/nus-desktop.git', 'https://github.com/tharunkuamrjeee/agentshield-x.git')
    c = c.replace('https://github.com/potlakai/nus-desktop', 'https://github.com/tharunkuamrjeee/agentshield-x')
    with open(p_pkg, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated package.json')

print('All patches applied cleanly!')
