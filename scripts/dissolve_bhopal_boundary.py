import geopandas as gpd
import fiona
from shapely.geometry import shape
from shapely.ops import unary_union
from pathlib import Path

INPUT = Path("data/raw/bhopal_boundary/Bhopal_wards.geojson")
OUTPUT = Path("data/raw/bhopal_boundary/bhopal_boundary.geojson")

print("Reading Bhopal ward geometries...")

geometries = []

with fiona.open(INPUT) as src:
    print(f"Features found: {len(src)}")

    for i, feature in enumerate(src):

        try:
            geom = shape(feature["geometry"])

            if geom.is_empty:
                print(f"Skipping empty geometry: {i}")
                continue

            # Repair invalid geometry
            if not geom.is_valid:
                print(f"Repairing invalid geometry: {i}")
                geom = geom.buffer(0)

            if not geom.is_empty and geom.is_valid:
                geometries.append(geom)

        except Exception as e:
            print(f"Skipping broken geometry {i}: {e}")

print(f"\nValid geometries: {len(geometries)}")

if not geometries:
    raise RuntimeError("No valid geometries found.")

# Merge all ward geometries
print("Dissolving wards...")

boundary = unary_union(geometries)

# Convert MultiPolygon → Polygon if possible
if boundary.geom_type == "MultiPolygon":
    print(f"Boundary contains {len(boundary.geoms)} polygon parts.")

# Create GeoDataFrame
gdf = gpd.GeoDataFrame(
    {"name": ["Bhopal Municipal Corporation"]},
    geometry=[boundary],
    crs="EPSG:4326"
)

# Final validity check
print(f"Geometry type: {boundary.geom_type}")
print(f"Valid: {boundary.is_valid}")
print(f"Bounds: {gdf.total_bounds}")

# Save
gdf.to_file(
    OUTPUT,
    driver="GeoJSON"
)

print("\nSUCCESS!")
print(f"Saved to: {OUTPUT}")