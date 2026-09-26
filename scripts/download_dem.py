from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile
import shutil

# Bhopal
LAT = 23.258
LON = 77.402

# SRTM tile naming
lat_prefix = f"N{int(LAT):02d}"
lon_prefix = f"E{int(LON):03d}"
tile = f"{lat_prefix}{lon_prefix}"

# Public SRTM mirror
url = (
    f"https://terrain.ardupilot.org/SRTM3/Eurasia/"
    f"{tile}.hgt.zip"
)

output_dir = Path("data/dem")
output_dir.mkdir(parents=True, exist_ok=True)

zip_path = output_dir / f"{tile}.hgt.zip"
hgt_path = output_dir / f"{tile}.hgt"

print("=" * 70)
print("DEM DOWNLOAD")
print("=" * 70)
print(f"Location : Bhopal")
print(f"Latitude : {LAT}")
print(f"Longitude: {LON}")
print(f"Tile     : {tile}")
print(f"URL      : {url}")
print()

print("Downloading...")

try:
    with urlopen(url, timeout=60) as response:
        total = response.headers.get("Content-Length")
        total = int(total) if total else None

        downloaded = 0

        with open(zip_path, "wb") as f:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break

                f.write(chunk)
                downloaded += len(chunk)

                if total:
                    percent = downloaded / total * 100
                    print(
                        f"\rProgress: {percent:6.2f}%",
                        end="",
                        flush=True
                    )

    print("\nDownload complete.")

except Exception as e:
    print(f"\nDownload failed: {e}")
    raise SystemExit(1)

print("Extracting...")

with ZipFile(zip_path, "r") as z:
    z.extractall(output_dir)

if zip_path.exists():
    zip_path.unlink()

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)
print(f"DEM file: {hgt_path}")
print()

if hgt_path.exists():
    size_mb = hgt_path.stat().st_size / (1024 * 1024)
    print(f"Size: {size_mb:.2f} MB")

print()
print("Next step:")
print("Convert HGT -> GeoTIFF using Rasterio")