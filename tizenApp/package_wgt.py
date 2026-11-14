import zipfile, os, shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_WGT = r'C:\Users\AYUSH\Downloads\AyushMuzic-Tizen.wgt'
WEBSITE_WGT = r'C:\Users\AYUSH\Downloads\ayushmuzic-website\downloads\AyushMuzic-Tizen.wgt'

# Files and folders to include
INCLUDES = [
    'config.xml',
    'index.html',
    'icon.png',
    'css',
    'js',
    'assets'
]

print("Packaging AyushMuzic-Tizen.wgt...")
with zipfile.ZipFile(OUTPUT_WGT, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for item in INCLUDES:
        full_path = os.path.join(BASE_DIR, item)
        if os.path.isfile(full_path):
            zf.write(full_path, arcname=item)
            print(f"  + Added file: {item}")
        elif os.path.isdir(full_path):
            for root, dirs, files in os.walk(full_path):
                for f in files:
                    file_full = os.path.join(root, f)
                    rel_path = os.path.relpath(file_full, BASE_DIR)
                    zf.write(file_full, arcname=rel_path)
                    print(f"  + Added: {rel_path}")

print(f"Done! Created WGT at: {OUTPUT_WGT} ({os.path.getsize(OUTPUT_WGT):,} bytes)")

if os.path.exists(os.path.dirname(WEBSITE_WGT)):
    shutil.copyfile(OUTPUT_WGT, WEBSITE_WGT)
    print(f"Copied to website downloads: {WEBSITE_WGT}")
