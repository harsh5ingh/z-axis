from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin


INPUT = Path("data/dem/N23E077.hgt")
OUTPUT = Path("data/dem/bhopal_dem.tif")

# ---------------------------------------------------------
# SRTM 3 arc-second tile
# N23E077 = 23°N–24°N, 77°E–78°E
# 1201 x 1201 samples
# ---------------------------------------------------------

WIDTH = 1201
HEIGHT = 1201

# 3 arc-seconds
PIXEL_SIZE = 3 / 3600

WEST = 77
NORTH = 24


print("=" * 70)
print("SRTM HGT → GeoTIFF")
print("=" * 70)

if not INPUT.exists():
    raise FileNotFoundError(f"Input file not found: {INPUT}")

file_size = INPUT.stat().st_size

print(f"Input : {INPUT}")
print(f"Size  : {file_size / (1024 * 1024):.2f} MB")

# Read signed 16-bit big-endian elevation values
with open(INPUT, "rb") as f:
    data = f.read()

elevation = np.frombuffer(
    data,
    dtype=">i2"
)

expected = WIDTH * HEIGHT

print(f"Samples found    : {elevation.size}")
print(f"Samples expected : {expected}")

if elevation.size != expected:
    raise ValueError(
        f"Unexpected HGT dimensions: {elevation.size} samples"
    )

elevation = elevation.reshape((HEIGHT, WIDTH))

# Convert to native int16
elevation = elevation.astype(np.int16)

# SRTM void value
elevation[elevation == -32768] = -32768

transform = from_origin(
    WEST,
    NORTH,
    PIXEL_SIZE,
    PIXEL_SIZE
)

profile = {
    "driver": "GTiff",
    "height": HEIGHT,
    "width": WIDTH,
    "count": 1,
    "dtype": "int16",
    "crs": "EPSG:4326",
    "transform": transform,
    "compress": "lzw",
    "nodata": -32768,
}

print()
print("Writing GeoTIFF...")

with rasterio.open(OUTPUT, "w", **profile) as dst:
    dst.write(elevation, 1)

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(f"Output : {OUTPUT}")
print(f"Resolution : {PIXEL_SIZE:.8f} degrees")
print()

valid = elevation[elevation != -32768]

print("Elevation statistics:")
print(f"Minimum : {valid.min()} m")
print(f"Maximum : {valid.max()} m")
print(f"Mean    : {valid.mean():.2f} m")