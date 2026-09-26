from pathlib import Path

import geopandas as gpd
import numpy as np


# ============================================================
# PATHS
# ============================================================

INPUT = Path(
    "data/processed/buildings/bhopal_buildings_3d_ready.geojson"
)

OUTPUT = Path(
    "data/processed/buildings/bhopal_buildings_3d.geojson"
)


# ============================================================
# SETTINGS
# ============================================================

FLOOR_HEIGHT_M = 3.0
MIN_BUILDING_HEIGHT_M = 2.5


print("=" * 70)
print("BHOPAL 3D BUILDING DATASET")
print("=" * 70)


# ============================================================
# 1. LOAD
# ============================================================

print()
print("Loading 3D-ready buildings...")

gdf = gpd.read_file(INPUT)

print(
    f"Buildings loaded: {len(gdf):,}"
)

print(
    f"CRS: {gdf.crs}"
)


# ============================================================
# 2. CHECK HEIGHT FIELD
# ============================================================

if "estimated_height_m" not in gdf.columns:
    raise ValueError(
        "estimated_height_m column not found."
    )


# ============================================================
# 3. CLEAN HEIGHT
# ============================================================

height = (
    gdf["estimated_height_m"]
    .astype(float)
    .replace(
        [np.inf, -np.inf],
        np.nan
    )
)


missing_height = height.isna().sum()

height = height.fillna(
    MIN_BUILDING_HEIGHT_M
)

height = height.clip(
    lower=MIN_BUILDING_HEIGHT_M
)


gdf["height_3d_m"] = height


# ============================================================
# 4. ESTIMATE FLOORS
# ============================================================

floors = np.ceil(
    height / FLOOR_HEIGHT_M
).astype(int)

floors = floors.clip(
    lower=1
)


gdf["estimated_floors"] = floors

gdf[
    "floor_height_assumption_m"
] = FLOOR_HEIGHT_M


# ============================================================
# 5. 3D METADATA
# ============================================================

gdf[
    "geometry_dimension"
] = "2D footprint + extrusion height"

gdf[
    "model_type"
] = "procedural_extrusion"

gdf[
    "vertical_source"
] = "Microsoft estimated building height"


# ============================================================
# 6. ENSURE ONLY ONE GEOMETRY COLUMN
# ============================================================

# The original "geometry" column is the building footprint.
#
# We intentionally DO NOT create another geometry column.
#
# The frontend will perform:
#
# footprint polygon
#       +
# height_3d_m
#       ↓
# 3D extrusion
#
# This keeps the GeoJSON lightweight and compatible.


for column in list(gdf.columns):

    if column == "geometry":
        continue

    # Remove accidental GeoSeries / geometry columns
    if isinstance(
        gdf[column].dtype,
        object
    ):
        try:

            sample = gdf[column].dropna()

            if len(sample) > 0:

                first = sample.iloc[0]

                if hasattr(
                    first,
                    "geom_type"
                ):

                    print(
                        f"Removing extra geometry column: {column}"
                    )

                    gdf = gdf.drop(
                        columns=[column]
                    )

        except Exception:
            pass


# ============================================================
# 7. SAVE
# ============================================================

print()
print("Saving 3D-ready building dataset...")

gdf.to_file(
    OUTPUT,
    driver="GeoJSON"
)


# ============================================================
# 8. RESULTS
# ============================================================

print()
print("=" * 70)
print("3D DATASET RESULTS")
print("=" * 70)

print(
    f"Buildings             : {len(gdf):,}"
)

print(
    f"Original missing heights: {missing_height:,}"
)

print(
    f"Minimum height        : {height.min():.2f} m"
)

print(
    f"Maximum height        : {height.max():.2f} m"
)

print(
    f"Mean height           : {height.mean():.2f} m"
)

print(
    f"Median height         : {height.median():.2f} m"
)

print(
    f"Mean estimated floors : {floors.mean():.2f}"
)

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(
    f"Output: {OUTPUT}"
)

print()
print("3D fields:")
print("  height_3d_m")
print("  estimated_floors")
print("  floor_height_assumption_m")
print("  geometry_dimension")
print("  model_type")
print("  vertical_source")
