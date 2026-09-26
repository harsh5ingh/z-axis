from pathlib import Path

import geopandas as gpd
import rasterio
from rasterio.mask import mask


DEM = Path("data/dem/bhopal_dem.tif")
BOUNDARY = Path(
    "data/raw/bhopal_boundary/bhopal_boundary.geojson"
)
OUTPUT = Path("data/dem/bhopal_dem_clipped.tif")


print("=" * 70)
print("CLIPPING DEM TO BHOPAL")
print("=" * 70)

print("\nLoading Bhopal boundary...")

boundary = gpd.read_file(BOUNDARY)

print(f"CRS: {boundary.crs}")
print(f"Bounds: {boundary.total_bounds}")

with rasterio.open(DEM) as src:

    print("\nDEM information:")
    print(f"CRS        : {src.crs}")
    print(f"Resolution : {src.res}")
    print(f"Bounds     : {src.bounds}")
    print(f"Size       : {src.width} x {src.height}")

    # Reproject boundary if required
    if boundary.crs != src.crs:
        boundary = boundary.to_crs(src.crs)

    geometries = boundary.geometry.tolist()

    print("\nClipping...")

    clipped, transform = mask(
        src,
        geometries,
        crop=True,
        nodata=src.nodata
    )

    profile = src.profile.copy()

    profile.update({
        "height": clipped.shape[1],
        "width": clipped.shape[2],
        "transform": transform,
        "compress": "lzw"
    })

    with rasterio.open(OUTPUT, "w", **profile) as dst:
        dst.write(clipped)


print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(f"Output: {OUTPUT}")

with rasterio.open(OUTPUT) as src:

    data = src.read(1)

    if src.nodata is not None:
        valid = data[data != src.nodata]
    else:
        valid = data.flatten()

    print(f"\nClipped raster:")
    print(f"Width      : {src.width}")
    print(f"Height     : {src.height}")
    print(f"Resolution : {src.res}")
    print(f"Min height : {valid.min()} m")
    print(f"Max height : {valid.max()} m")
    print(f"Mean       : {valid.mean():.2f} m")