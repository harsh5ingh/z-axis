from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.mask import mask
from shapely.geometry import mapping


# ============================================================
# PATHS
# ============================================================

HEIGHT_DIR = Path(
    "data/raw/building_height"
)

BOUNDARY_FILE = Path(
    "data/raw/bhopal_boundary/bhopal_boundary.geojson"
)

BUILDINGS_FILE = Path(
    "data/processed/buildings/bhopal_buildings_elevation.geojson"
)

OUTPUT_DIR = Path(
    "data/processed/buildings"
)

MOSAIC_FILE = (
    OUTPUT_DIR /
    "bhopal_building_height_mosaic.tif"
)

OUTPUT_FILE = (
    OUTPUT_DIR /
    "bhopal_buildings_3d_ready.geojson"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


print("=" * 70)
print("MICROSOFT BUILDING HEIGHT → BHOPAL BUILDINGS")
print("=" * 70)


# ============================================================
# 1. FIND HEIGHT TILES
# ============================================================

tiles = sorted(
    HEIGHT_DIR.glob("*.tif")
)

print()
print(f"Height tiles found: {len(tiles)}")

if not tiles:
    raise FileNotFoundError(
        f"No TIFF files found in {HEIGHT_DIR}"
    )

for tile in tiles:
    print("  -", tile.name)


# ============================================================
# 2. OPEN RASTERS
# ============================================================

print()
print("Opening height rasters...")

src_files = []

for tile in tiles:

    src = rasterio.open(tile)

    src_files.append(src)

    print(
        f"{tile.name}: "
        f"{src.width}x{src.height}, "
        f"CRS={src.crs}, "
        f"Bands={src.count}"
    )


# ============================================================
# 3. MERGE ALL BANDS
# ============================================================

print()
print("Merging height tiles...")

# Merge both bands first.
# This avoids Rasterio's single-band merge shape issue.

mosaic_all, transform = merge(
    src_files
)

print(
    f"Merged raster shape: "
    f"{mosaic_all.shape}"
)

# Band 2 = building height
#
# Python array indexing:
# Band 1 -> index 0
# Band 2 -> index 1

mosaic = mosaic_all[1:2]


source = src_files[0]

mosaic_meta = source.meta.copy()

mosaic_meta.update(
    {
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": transform,
        "count": 1,
        "dtype": mosaic.dtype,
        "compress": "deflate",
    }
)


with rasterio.open(
    MOSAIC_FILE,
    "w",
    **mosaic_meta
) as dst:

    dst.write(
        mosaic
    )


print(
    f"Mosaic saved: {MOSAIC_FILE}"
)

print(
    f"Mosaic size: "
    f"{mosaic.shape[2]} x {mosaic.shape[1]}"
)

print(
    f"Resolution: "
    f"{source.res}"
)


# Close source rasters
for src in src_files:
    src.close()


# ============================================================
# 4. LOAD BHOPAL BOUNDARY
# ============================================================

print()
print("Loading Bhopal boundary...")

boundary = gpd.read_file(
    BOUNDARY_FILE
)

print(
    f"Boundary CRS: {boundary.crs}"
)

boundary_3857 = boundary.to_crs(
    "EPSG:3857"
)


# ============================================================
# 5. CLIP HEIGHT MOSAIC
# ============================================================

print()
print("Clipping height mosaic to Bhopal...")

with rasterio.open(
    MOSAIC_FILE
) as src:

    shapes = [
        mapping(geom)
        for geom in boundary_3857.geometry
        if geom is not None
        and not geom.is_empty
    ]

    clipped, clipped_transform = mask(
        src,
        shapes,
        crop=True,
        nodata=0
    )

    clipped_meta = src.meta.copy()

    clipped_meta.update(
        {
            "height": clipped.shape[1],
            "width": clipped.shape[2],
            "transform": clipped_transform,
            "count": 1,
            "nodata": 0,
            "compress": "deflate",
        }
    )


with rasterio.open(
    MOSAIC_FILE,
    "w",
    **clipped_meta
) as dst:

    dst.write(
        clipped
    )


print(
    "Bhopal height raster clipped."
)


# ============================================================
# 6. LOAD BUILDINGS
# ============================================================

print()
print("Loading building dataset...")

buildings = gpd.read_file(
    BUILDINGS_FILE
)

print(
    f"Buildings: {len(buildings):,}"
)

print(
    f"Building CRS: {buildings.crs}"
)


# ============================================================
# 7. REPROJECT BUILDINGS
# ============================================================

with rasterio.open(
    MOSAIC_FILE
) as height_raster:

    raster_crs = height_raster.crs

    print(
        f"Height raster CRS: "
        f"{raster_crs}"
    )

    buildings_raster = (
        buildings.to_crs(
            raster_crs
        )
    )


# ============================================================
# 8. BUILDING CENTROIDS
# ============================================================

print()
print("Calculating building centroids...")

centroids = (
    buildings_raster
    .geometry
    .centroid
)

coordinates = [
    (point.x, point.y)
    for point in centroids
]


# ============================================================
# 9. SAMPLE MICROSOFT HEIGHT
# ============================================================

print()
print("Sampling Microsoft building height...")


with rasterio.open(
    MOSAIC_FILE
) as src:

    nodata = src.nodata

    sampled = list(
        src.sample(
            coordinates
        )
    )


raw_height = np.array(
    [
        float(value[0])
        for value in sampled
    ],
    dtype=float
)


# ============================================================
# 10. HANDLE NODATA
# ============================================================

if nodata is not None:

    raw_height[
        raw_height == nodata
    ] = np.nan


raw_height[
    raw_height <= 0
] = np.nan


# ============================================================
# 11. MICROSOFT HEIGHT → METRES
# ============================================================

estimated_height = (
    raw_height * 100.0
)


# Remove unreasonable values

estimated_height[
    estimated_height > 200
] = np.nan


# ============================================================
# 12. ADD ATTRIBUTES
# ============================================================

buildings[
    "estimated_height_m"
] = estimated_height


buildings[
    "height_source"
] = np.where(
    np.isfinite(
        estimated_height
    ),
    "Microsoft Building Density & Height 2023 Q4",
    None
)


buildings[
    "height_type"
] = np.where(
    np.isfinite(
        estimated_height
    ),
    "estimated",
    None
)


# This is data availability,
# NOT scientific accuracy.

buildings[
    "height_confidence"
] = np.where(
    np.isfinite(
        estimated_height
    ),
    "medium",
    None
)


# ============================================================
# 13. STATISTICS
# ============================================================

valid_height = (
    estimated_height[
        np.isfinite(
            estimated_height
        )
    ]
)


print()
print("=" * 70)
print("HEIGHT RESULTS")
print("=" * 70)

print(
    f"Buildings processed : "
    f"{len(buildings):,}"
)

print(
    f"Valid heights       : "
    f"{len(valid_height):,}"
)

print(
    f"Missing heights     : "
    f"{len(buildings) - len(valid_height):,}"
)


if len(valid_height) > 0:

    print(
        f"Minimum height      : "
        f"{np.min(valid_height):.2f} m"
    )

    print(
        f"Maximum height      : "
        f"{np.max(valid_height):.2f} m"
    )

    print(
        f"Mean height         : "
        f"{np.mean(valid_height):.2f} m"
    )

    print(
        f"Median height       : "
        f"{np.median(valid_height):.2f} m"
    )


# ============================================================
# 14. SAVE FINAL DATASET
# ============================================================

print()
print("Saving 3D-ready building dataset...")

buildings.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)


print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(
    f"Output: {OUTPUT_FILE}"
)

print()
print("Added fields:")
print("  estimated_height_m")
print("  height_source")
print("  height_type")
print("  height_confidence")