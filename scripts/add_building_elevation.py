from pathlib import Path

import geopandas as gpd
import rasterio
import numpy as np


BUILDINGS = Path(
    "data/processed/buildings/bhopal_buildings.geojson"
)

DEM = Path(
    "data/dem/bhopal_dem_clipped.tif"
)

OUTPUT = Path(
    "data/processed/buildings/bhopal_buildings_elevation.geojson"
)


print("=" * 70)
print("ADDING DEM ELEVATION TO BHOPAL BUILDINGS")
print("=" * 70)

# ---------------------------------------------------------
# Load buildings
# ---------------------------------------------------------

print("\nLoading buildings...")

buildings = gpd.read_file(BUILDINGS)

print(f"Buildings: {len(buildings):,}")
print(f"CRS      : {buildings.crs}")

# ---------------------------------------------------------
# Open DEM
# ---------------------------------------------------------

print("\nOpening DEM...")

with rasterio.open(DEM) as dem:

    print(f"DEM CRS        : {dem.crs}")
    print(f"DEM resolution : {dem.res}")

    # Make sure buildings and DEM use same CRS
    if buildings.crs != dem.crs:
        print("\nReprojecting buildings...")
        buildings = buildings.to_crs(dem.crs)

    # -----------------------------------------------------
    # Calculate building centroids
    # -----------------------------------------------------

    print("\nCalculating building centroids...")

    centroids = buildings.geometry.centroid

    coordinates = [
        (point.x, point.y)
        for point in centroids
    ]

    # -----------------------------------------------------
    # Sample DEM
    # -----------------------------------------------------

    print("Sampling DEM elevation...")

    samples = list(dem.sample(coordinates))

    elevations = np.array(
        [sample[0] for sample in samples],
        dtype=float
    )

    # Handle NoData
    if dem.nodata is not None:
        elevations[
            elevations == dem.nodata
        ] = np.nan

    buildings["ground_elevation_m"] = elevations

# ---------------------------------------------------------
# Statistics
# ---------------------------------------------------------

valid = buildings[
    "ground_elevation_m"
].dropna()

print()
print("=" * 70)
print("ELEVATION RESULTS")
print("=" * 70)

print(f"Buildings processed : {len(buildings):,}")
print(f"Valid elevations    : {len(valid):,}")
print(f"Missing elevations  : {len(buildings) - len(valid):,}")

if len(valid) > 0:
    print(f"Minimum elevation   : {valid.min():.2f} m")
    print(f"Maximum elevation   : {valid.max():.2f} m")
    print(f"Mean elevation      : {valid.mean():.2f} m")
    print(f"Median elevation    : {valid.median():.2f} m")

# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

print("\nSaving...")

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True
)

buildings.to_file(
    OUTPUT,
    driver="GeoJSON"
)

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(f"Output: {OUTPUT}")