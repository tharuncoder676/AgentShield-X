import os
import zipfile
import time
import subprocess
import shutil

src_dir = os.path.abspath('chronos_app')
zip_path = os.path.abspath('app.zip')
exe_out = os.path.abspath('Chronos-Desktop-Setup.exe')
cs_file = os.path.abspath('scripts/ChronosDesktopInstaller.cs')
icon_file = os.path.abspath('chronos_app/agentshield.ico')
csc_path = r'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'

print('Step 1: Compressing chronos_app into app.zip...')
t0 = time.time()
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=1) as zf:
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, src_dir)
            zf.write(full_p, rel_p)
print(f'Compressed app.zip ({os.path.getsize(zip_path)/(1024*1024):.1f} MB) in {time.time()-t0:.1f}s')

print('Step 2: Compiling native 64-bit Chronos-Desktop-Setup.exe with embedded app.zip...')
t1 = time.time()
cmd = [
    csc_path,
    '/target:winexe',
    '/platform:x64',
    f'/out:{exe_out}',
    '/r:System.IO.Compression.dll,System.IO.Compression.FileSystem.dll,System.Windows.Forms.dll,System.Drawing.dll',
    f'/resource:{zip_path},app.zip',
    f'/win32icon:{icon_file}',
    cs_file
]
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print('CSC Error:\n', res.stderr, res.stdout)
    exit(1)
print(f'Compiled {exe_out} ({os.path.getsize(exe_out)/(1024*1024):.1f} MB) in {time.time()-t1:.1f}s')

print('Step 3: Cleaning up temporary app.zip...')
os.remove(zip_path)

print('Step 4: Syncing to Downloads folder...')
dl_dir = os.path.expanduser('~/Downloads')
for name in ['Chronos-Desktop-Setup.exe', 'Chronos-Desktop-Setup-1.0.0 (2).exe', 'Chronos-Desktop-Setup-1.0.0.exe']:
    dst = os.path.join(dl_dir, name)
    try:
        if os.path.exists(dst):
            os.remove(dst)
        shutil.copyfile(exe_out, dst)
        print(f'  Synced {dst}')
    except Exception as e:
        print(f'  Error updating {dst}: {e}')

print('BUILD & DEPLOY COMPLETE!')
