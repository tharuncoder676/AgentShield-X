"""
AgentShield-X Master Rebranding Script for Chronos Desktop
Replaces all instances of Nus and Knot with Chronos / AgentShield-X,
replaces logos with official AgentShield-X shield and Chronos logo,
sets window icon to AgentShield-X logo, and updates contact email to tharunkuamrjeee@gmail.com.
"""

import os
import shutil
import re

BASE_DIR = os.path.abspath("chronos_app/resources/app_unpacked")
PUBLIC_DIR = os.path.abspath("apps/console/public")

print(f"[*] Starting comprehensive rebranding in: {BASE_DIR}")

# 1. Copy Brand Assets
# Official AgentShield-X Logo
asx_logo_src = os.path.join(PUBLIC_DIR, "logo.png")
asx_ico_src = os.path.join(PUBLIC_DIR, "favicon.ico")

# Official Chronos Logo
chronos_512_src = os.path.join(PUBLIC_DIR, "chronos-logo-512.png")
chronos_128_src = os.path.join(PUBLIC_DIR, "chronos-logo-128.png")
chronos_svg_src = os.path.join(PUBLIC_DIR, "chronos-logo.svg")
chronos_ico_src = os.path.join(PUBLIC_DIR, "chronos-icon.ico")

# Destination folders
home_dir = os.path.join(BASE_DIR, "companion", "home")
renderer_dir = os.path.join(BASE_DIR, "companion", "renderer")

# Copy AgentShield-X Logo to home and renderer
shutil.copy2(asx_logo_src, os.path.join(home_dir, "agentshield-logo.png"))
shutil.copy2(asx_logo_src, os.path.join(renderer_dir, "agentshield-logo.png"))
shutil.copy2(asx_logo_src, os.path.join(renderer_dir, "logo.png"))
shutil.copy2(asx_logo_src, os.path.join(BASE_DIR, "companion", "tray-icon.png"))

# Copy Chronos Logo to home and renderer
shutil.copy2(chronos_512_src, os.path.join(home_dir, "chronos-logo.png"))
shutil.copy2(chronos_512_src, os.path.join(renderer_dir, "chronos-logo.png"))
shutil.copy2(chronos_svg_src, os.path.join(home_dir, "chronos-logo.svg"))
shutil.copy2(chronos_svg_src, os.path.join(renderer_dir, "chronos-logo.svg"))

# Also copy AgentShield-X icon.ico to chronos_app root
shutil.copy2(asx_ico_src, os.path.abspath("chronos_app/icon.ico"))

print("[+] Copied AgentShield-X and Chronos brand assets to companion directories.")

# 2. Text Replacements across all Companion & src files
text_replacements = [
    # Contact & Founder
    ("Pranav Desu", "Tharunkumar.S"),
    ("Pranav builds Nūs and reads every note.", "Tharunkumar builds Chronos & AgentShield-X and reads every note (contact: tharunkuamrjeee@gmail.com)."),
    ("Pranav builds Nūs and reads every note", "Tharunkumar builds Chronos & AgentShield-X and reads every note (contact: tharunkuamrjeee@gmail.com)"),
    ("tell Pranav", "contact Tharunkumar (tharunkuamrjeee@gmail.com)"),
    ("Tell Pranav", "Contact Tharunkumar"),
    ("Send to Pranav", "Send to Tharunkumar (tharunkuamrjeee@gmail.com)"),
    ("Send feedback to Pranav...", "Send feedback to Tharunkumar (tharunkuamrjeee@gmail.com)..."),
    ("Send feedback to Pranav", "Send feedback to Tharunkumar"),
    ("from Pranav", "from Tharunkumar (tharunkuamrjeee@gmail.com)"),
    ("pranav", "tharunkuamrjeee@gmail.com"),

    # Nus replacements
    ("Nūs Companion", "Chronos Companion"),
    ("Nus Companion", "Chronos Companion"),
    ("Nūs Desktop", "Chronos Desktop"),
    ("Nus Desktop", "Chronos Desktop"),
    ("Nūs Dashboard", "Chronos Dashboard"),
    ("Nus Dashboard", "Chronos Dashboard"),
    ("My Nūs", "My Chronos"),
    ("My Nus", "My Chronos"),
    ("See My Nūs", "See My Chronos"),
    ("See My Nus", "See My Chronos"),
    ("Quit Nūs", "Quit Chronos"),
    ("Quit Nus", "Quit Chronos"),
    ("Ask Nūs anything", "Ask Chronos anything"),
    ("Ask Nus anything", "Ask Chronos anything"),
    ("Where did you hear about Nūs?", "Where did you hear about Chronos?"),
    ("Where did you hear about Nus?", "Where did you hear about Chronos?"),
    ("Messages from Nūs", "Messages from Chronos"),
    ("Messages from Nus", "Messages from Chronos"),
    ("What Nūs knows about you", "What Chronos knows about you"),
    ("What Nus knows about you", "What Chronos knows about you"),
    ("Using Nūs on more than one computer?", "Using Chronos on more than one computer?"),
    ("Using Nus on more than one computer?", "Using Chronos on more than one computer?"),
    ("News from Nūs", "News from Chronos"),
    ("News from Nus", "News from Chronos"),
    ("Open Nūs", "Open Chronos"),
    ("Open Nus", "Open Chronos"),
    ("Open Nus dashboard", "Open Chronos Dashboard"),
    ("Open Nūs dashboard", "Open Chronos Dashboard"),
    ("Nūs idle", "Chronos idle"),
    ("Nus idle", "Chronos idle"),
    ("The Nūs Knot", "Chronos Companion"),
    ("The Nus Knot", "Chronos Companion"),

    # Knot replacements
    ("The Knot is ready", "Chronos is ready"),
    ("The Knot is off", "Chronos is off"),
    ("Starting the Knot", "Starting Chronos"),
    ("The Knot stays with you", "Chronos stays with you"),
    ("The Knot listens with this one", "Chronos listens with this one"),
    ("The Knot's own voice", "Chronos neural voice"),
    ("Show the Knot", "Show Chronos"),
    ("show-knot", "show-chronos"),
    ("Show Chronos", "Show Chronos"),
    ("The Knot's numbers", "Chronos numbers"),
    ("The Knot's window", "Chronos window"),
    ("The Knot corner", "Chronos corner"),
    ("knotCorner", "chronosCorner"),
    ("Knot > Companion", "Chronos Companion"),
    ("The Knot tells someone", "Chronos tells someone"),
    ("The Knot has", "Chronos has"),
    ("The Knot asks", "Chronos asks"),
    ("The Knot may raise it", "Chronos may raise it"),
    ("The Knot loosens", "Chronos loosens"),
    ("The Knot and the bubbles", "Chronos and the bubbles"),
    ("Click the Knot", "Click Chronos"),
    ("Say 'remember ...' to the Knot", "Say 'remember ...' to Chronos"),
    ("say 'remember ...' to the Knot", "say 'remember ...' to Chronos"),
    ("the Knot", "Chronos"),
    ("The Knot", "Chronos"),
    ("the knot", "Chronos"),
    ("The knot", "Chronos"),
]

# Process specific files
target_extensions = ('.js', '.html', '.css', '.json')
count_files_modified = 0
total_replacements = 0

for root, dirs, files in os.walk(BASE_DIR):
    if "node_modules" in root:
        continue
    for f in files:
        if f.endswith(target_extensions):
            file_path = os.path.join(root, f)
            try:
                with open(file_path, "r", encoding="utf-8") as fp:
                    content = fp.read()

                original_content = content
                for old_val, new_val in text_replacements:
                    if old_val in content:
                        content = content.replace(old_val, new_val)
                        total_replacements += 1

                # Clean remaining Nūs or Nus words
                content = re.sub(r'\bN[ūu]s\b', 'Chronos', content)
                content = re.sub(r'\bN[ŪU]S\b', 'CHRONOS', content)

                if content != original_content:
                    with open(file_path, "w", encoding="utf-8") as fp:
                        fp.write(content)
                    count_files_modified += 1
            except Exception as e:
                print(f"[-] Could not process {file_path}: {e}")

print(f"[+] Text replacements complete: {total_replacements} replacements across {count_files_modified} files.")

# 3. Patch `src/main-companion.js` Window Icon and Title
main_comp_path = os.path.join(BASE_DIR, "src", "main-companion.js")
if os.path.exists(main_comp_path):
    with open(main_comp_path, "r", encoding="utf-8") as f:
        src = f.read()

    # Ensure icon is passed in BrowserWindow
    old_bw = "home = new BrowserWindow({ width: 1100, height: 720, minWidth: 800, minHeight: 560, backgroundColor: '#0b0d12', title: 'Chronos Dashboard',"
    new_bw = "home = new BrowserWindow({ width: 1100, height: 720, minWidth: 800, minHeight: 560, backgroundColor: '#0b0d12', title: 'Chronos Dashboard', icon: path.join(__dirname, '..', 'companion', 'home', 'agentshield-logo.png'),"
    
    if "icon: path.join(__dirname, '..', 'companion', 'home', 'agentshield-logo.png')" not in src:
        src = src.replace("title: 'Chronos Dashboard',", "title: 'Chronos Dashboard', icon: path.join(__dirname, '..', 'companion', 'home', 'agentshield-logo.png'),")
        src = src.replace("title: 'Nūs Dashboard',", "title: 'Chronos Dashboard', icon: path.join(__dirname, '..', 'companion', 'home', 'agentshield-logo.png'),")
        src = src.replace("title: 'Nus Dashboard',", "title: 'Chronos Dashboard', icon: path.join(__dirname, '..', 'companion', 'home', 'agentshield-logo.png'),")
        with open(main_comp_path, "w", encoding="utf-8") as f:
            f.write(src)
        print("[+] Patched src/main-companion.js with AgentShield-X window icon.")

# 4. Patch `companion/index.js` Window Icon
index_js_path = os.path.join(BASE_DIR, "companion", "index.js")
if os.path.exists(index_js_path):
    with open(index_js_path, "r", encoding="utf-8") as f:
        idx_src = f.read()

    if "agentshield-logo.png" not in idx_src:
        idx_src = idx_src.replace(
            "resizable: false,",
            "resizable: false, icon: path.join(__dirname, 'home', 'agentshield-logo.png'),"
        )
        with open(index_js_path, "w", encoding="utf-8") as f:
            f.write(idx_src)
        print("[+] Patched companion/index.js with AgentShield-X window icon.")

# 5. Patch `companion/home/index.html` to place AgentShield-X Logo in header & Chronos Logo in slot
home_html_path = os.path.join(BASE_DIR, "companion", "home", "index.html")
if os.path.exists(home_html_path):
    with open(home_html_path, "r", encoding="utf-8") as f:
        h_html = f.read()

    # Replace <canvas id="brand-knot" ...> with AgentShield-X Logo
    h_html = h_html.replace(
        '<canvas id="brand-knot" class="brand-mark" aria-hidden="true"></canvas>',
        '<img src="agentshield-logo.png" class="brand-mark" style="width:36px;height:36px;object-fit:contain;border-radius:8px;vertical-align:middle;margin-right:10px;box-shadow:0 0 12px rgba(168,85,247,0.5);" alt="AgentShield-X" />'
    )

    # Replace knot slot with Chronos Logo
    h_html = h_html.replace(
        '<div class="d-slot"><canvas id="d-knot" aria-hidden="true"></canvas></div>',
        '<div class="d-slot"><img src="chronos-logo.png" style="width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(168,85,247,0.8));" alt="Chronos" /></div>'
    )

    # Contact line in footer / feedback
    if "tharunkuamrjeee@gmail.com" not in h_html:
        h_html = h_html.replace(
            '<button type="submit" id="feedback-send" class="primary">Send to Tharunkumar (tharunkuamrjeee@gmail.com)</button>',
            '<button type="submit" id="feedback-send" class="primary">Send Feedback</button><p style="margin-top:8px;font-size:11px;color:#94a3b8;">Direct Contact: <a href="mailto:tharunkuamrjeee@gmail.com" style="color:#06b6d4;">tharunkuamrjeee@gmail.com</a></p>'
        )

    with open(home_html_path, "w", encoding="utf-8") as f:
        f.write(h_html)
    print("[+] Patched companion/home/index.html with AgentShield-X and Chronos brand visuals.")

# 6. Patch `companion/renderer/index.html` to replace knot SVG with Chronos Logo
rend_html_path = os.path.join(BASE_DIR, "companion", "renderer", "index.html")
if os.path.exists(rend_html_path):
    with open(rend_html_path, "r", encoding="utf-8") as f:
        r_html = f.read()

    # Replace <svg class="nus-knot" ...>...</svg> with Chronos Logo
    chronos_svg_tag = '''<img src="chronos-logo.png" class="chronos-logo-mark" style="width:52px;height:52px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(168,85,247,0.9));margin:auto;display:block;" alt="Chronos" />'''
    r_html = re.sub(r'<svg class="nus-knot"[^>]*>.*?</svg>', chronos_svg_tag, r_html, flags=re.DOTALL)

    r_html = r_html.replace('title="Open Nūs (drag to move)"', 'title="Open Chronos (drag to move)"')
    r_html = r_html.replace('aria-label="Open Nūs command sheet"', 'aria-label="Open Chronos command sheet"')

    with open(rend_html_path, "w", encoding="utf-8") as f:
        f.write(r_html)
    print("[+] Patched companion/renderer/index.html with Chronos Logo.")

# 7. Update `package.json`
pkg_json_path = os.path.join(BASE_DIR, "package.json")
if os.path.exists(pkg_json_path):
    with open(pkg_json_path, "r", encoding="utf-8") as f:
        pkg = f.read()
    pkg = pkg.replace('"author": "Pranav Desu"', '"author": "Tharunkumar.S <tharunkuamrjeee@gmail.com>"')
    pkg = pkg.replace('"description": "Chronos Desktop: the academic AI organizer and Knot companion that hears you and acts on your schedule."',
                      '"description": "Chronos Desktop: Autonomous AI Agent with Living Screen Memory, Kokoro Neural Voice, and AgentShield-X Zero-Trust Security."')
    with open(pkg_json_path, "w", encoding="utf-8") as f:
        f.write(pkg)
    print("[+] Patched package.json.")

print("[*] Rebranding completed successfully!")
