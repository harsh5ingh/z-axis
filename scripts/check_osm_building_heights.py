import requests
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
from pathlib import Path
from collections import Counter


OUTPUT = Path(
    "data/raw/osm_bhopal/osm_buildings.geojson"
)

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

# Bhopal boundary approximate bounding box
SOUTH = 23.110891
WEST = 77.260416
NORTH = 23.339225
EAST = 77.535781


query = f"""
[out:json][timeout:180];

(
  way["building"]({SOUTH},{WEST},{NORTH},{EAST});
  relation["building"]({SOUTH},{WEST},{NORTH},{EAST});
);

out body;
>;
out skel qt;
"""


print("=" * 70)
print("BHOPAL OSM BUILDING HEIGHT COVERAGE")
print("=" * 70)

print("\nDownloading OSM building data...")
print("This may take a few minutes...\n")

headers = {
    "User-Agent": "SIH26011-3D-ULPIN/1.0 (Bhopal building analysis)",
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
}

data = None

for url in OVERPASS_URLS:

    print(f"\nTrying: {url}")

    try:
        response = requests.post(
            url,
            data={"data": query},
            headers=headers,
            timeout=240
        )

        print(f"HTTP status: {response.status_code}")

        if response.ok:
            data = response.json()
            print("Download successful.")
            break

        print("Server rejected request.")

    except requests.RequestException as e:
        print(f"Connection failed: {e}")


if data is None:
    raise RuntimeError(
        "All Overpass servers failed. "
        "Try again after a few minutes."
    )

elements = data.get("elements", [])

print(f"OSM elements received: {len(elements):,}")


# ---------------------------------------------------------
# Build node dictionary
# ---------------------------------------------------------

nodes = {}

for element in elements:
    if element["type"] == "node":
        nodes[element["id"]] = (
            element["lon"],
            element["lat"]
        )


# ---------------------------------------------------------
# Convert ways into polygons
# ---------------------------------------------------------

buildings = []

for element in elements:

    if element["type"] != "way":
        continue

    tags = element.get("tags", {})

    if "building" not in tags:
        continue

    geometry = []

    for node_id in element.get("nodes", []):
        if node_id in nodes:
            geometry.append(nodes[node_id])

    if len(geometry) < 4:
        continue

    if geometry[0] != geometry[-1]:
        geometry.append(geometry[0])

    try:
        polygon = Polygon(geometry)

        if not polygon.is_valid:
            polygon = polygon.buffer(0)

        if polygon.is_empty:
            continue

        buildings.append({
            "osm_id": element["id"],
            "building": tags.get("building"),
            "height": tags.get("height"),
            "building_levels": tags.get("building:levels"),
            "geometry": polygon
        })

    except Exception:
        continue


print(f"Valid OSM buildings: {len(buildings):,}")


# ---------------------------------------------------------
# Create GeoDataFrame
# ---------------------------------------------------------

gdf = gpd.GeoDataFrame(
    buildings,
    geometry="geometry",
    crs="EPSG:4326"
)


# ---------------------------------------------------------
# Coverage statistics
# ---------------------------------------------------------

total = len(gdf)

has_height = (
    gdf["height"]
    .notna()
    &
    (gdf["height"].astype(str).str.strip() != "")
)

has_levels = (
    gdf["building_levels"]
    .notna()
    &
    (gdf["building_levels"].astype(str).str.strip() != "")
)

has_height_or_levels = has_height | has_levels

print()
print("=" * 70)
print("OSM HEIGHT COVERAGE")
print("=" * 70)

print(f"Total buildings             : {total:,}")
print(f"Buildings with height      : {has_height.sum():,}")
print(f"Buildings with levels      : {has_levels.sum():,}")
print(
    f"Height OR levels available : "
    f"{has_height_or_levels.sum():,}"
)

if total:
    print(
        f"\nHeight coverage             : "
        f"{has_height.sum() / total * 100:.2f}%"
    )

    print(
        f"Levels coverage             : "
        f"{has_levels.sum() / total * 100:.2f}%"
    )

    print(
        f"Usable height information   : "
        f"{has_height_or_levels.sum() / total * 100:.2f}%"
    )


# ---------------------------------------------------------
# Building types
# ---------------------------------------------------------

print()
print("=" * 70)
print("BUILDING TYPES")
print("=" * 70)

counts = Counter(
    gdf["building"].dropna().astype(str)
)

for building_type, count in counts.most_common(20):
    print(f"{building_type:<25} {count:,}")


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True
)

gdf.to_file(
    OUTPUT,
    driver="GeoJSON"
)

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(f"Saved: {OUTPUT}")