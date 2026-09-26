from pathlib import Path
import zipfile

# Common download locations
SEARCH_DIRS = [
    Path.home() / "Downloads",
    Path.home() / "Desktop",
    Path.cwd(),
]

archives = []

for folder in SEARCH_DIRS:
    if folder.exists():
        archives.extend(folder.glob("*.zip"))

if not archives:
    print("No ZIP files found.")
    print("Check your Downloads folder.")
    raise SystemExit

print("=" * 70)
print("ZIP FILES FOUND")
print("=" * 70)

for i, archive in enumerate(archives, 1):
    size_gb = archive.stat().st_size / (1024 ** 3)
    print(f"{i}. {archive}")
    print(f"   Size: {size_gb:.2f} GB")

print()

# If multiple ZIPs exist, choose the largest one
archive = max(archives, key=lambda p: p.stat().st_size)

print("=" * 70)
print("INSPECTING LARGEST ZIP")
print("=" * 70)
print("File:", archive)

with zipfile.ZipFile(archive, "r") as z:
    files = z.namelist()

    print(f"\nFiles inside archive: {len(files)}\n")

    for name in files[:100]:
        info = z.getinfo(name)
        size_mb = info.file_size / (1024 ** 2)

        print(f"{name}")
        print(f"  Size: {size_mb:.2f} MB")

print("\n" + "=" * 70)
print("POINT CLOUD FILES")
print("=" * 70)

point_files = [
    f for f in files
    if f.lower().endswith((".las", ".laz"))
]

if point_files:
    for f in point_files:
        print(f)
else:
    print("No LAS/LAZ files found.")

print("\nDone.")