import os
import subprocess
import urllib.request
import zipfile
import shutil

# 1. Get GitHub token from git credential
proc = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, _ = proc.communicate(input='protocol=https\nhost=github.com\n')
token = None
for line in stdout.splitlines():
    if line.startswith('password='):
        token = line.replace('password=', '').strip()
        break

if not token:
    raise RuntimeError('Failed to retrieve GitHub token from git credentials')

print('Retrieved GitHub token.')

work_dir = r'C:\Users\AYUSH\Downloads\SimpMusic-dev\temp_install'
os.makedirs(work_dir, exist_ok=True)
zip_path = os.path.join(work_dir, 'android-apks.zip')

# 2. Get artifact download URL
import json
req = urllib.request.Request(
    'https://api.github.com/repos/jaatayushh/ayushmuzic/actions/runs/43505864771/artifacts',
    headers={'Authorization': f'Bearer {token}', 'User-Agent': 'Python'}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    android_art = next((a for a in data.get('artifacts', []) if a['name'] == 'android-apks'), None)

if not android_art:
    raise RuntimeError('android-apks artifact not found')

download_url = android_art['archive_download_url']
print(f"Downloading {android_art['name']} ({android_art['size_in_bytes']} bytes)...")

# 3. Stream download to disk
req_dl = urllib.request.Request(
    download_url,
    headers={'Authorization': f'Bearer {token}', 'User-Agent': 'Python'}
)
with urllib.request.urlopen(req_dl) as resp, open(zip_path, 'wb') as out_f:
    shutil.copyfileobj(resp, out_f, length=1024*1024)

print(f"Downloaded zip to {zip_path} (size: {os.path.getsize(zip_path)} bytes)")

# 4. Extract APKs
extract_dir = os.path.join(work_dir, 'apks')
if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)
os.makedirs(extract_dir, exist_ok=True)

with zipfile.ZipFile(zip_path, 'r') as z:
    z.extractall(extract_dir)

print('Extracted APKs:')
for f in os.listdir(extract_dir):
    p = os.path.join(extract_dir, f)
    print(f" - {f}: {os.path.getsize(p)} bytes")

# 5. Pick APK for Vivo phone (arm64 or vivo-arm64)
apk_files = os.listdir(extract_dir)
target_apk = next((f for f in apk_files if 'vivo-arm64' in f), None)
if not target_apk:
    target_apk = next((f for f in apk_files if 'arm64' in f), None)
if not target_apk:
    target_apk = next((f for f in apk_files if 'universal' in f), None)

if not target_apk:
    raise RuntimeError('No suitable APK found')

full_apk_path = os.path.join(extract_dir, target_apk)
print(f"Target APK selected: {target_apk}")

# 6. Push and install via ADB
adb = r'C:\Users\AYUSH\AppData\Local\Android\Sdk\platform-tools\adb.exe'
device = 'T865QGCMKF89KNFA'

print(f"Pushing {target_apk} to device {device}...")
subprocess.run([adb, '-s', device, 'push', full_apk_path, '/data/local/tmp/app.apk'], check=True)

print("Installing on Vivo device via pm install -r -d...")
res = subprocess.run([adb, '-s', device, 'shell', 'pm', 'install', '-r', '-d', '/data/local/tmp/app.apk'], capture_output=True, text=True)
print("PM Install stdout:", res.stdout)
print("PM Install stderr:", res.stderr)

print("Launching AyushMuzic...")
subprocess.run([adb, '-s', device, 'shell', 'monkey', '-p', 'com.ayush.muzic', '-c', 'android.intent.category.LAUNCHER', '1'], check=True)

print("DONE! AyushMuzic installed and launched on Vivo device!")
