import gzip
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import shape
from shapely.prepared import prep


# --------------------------------------------------
# Paths
# --------------------------------------------------

INPUT_DIR = Path("data/raw/microsoft_bhopal")
BOUNDARY_FILE = Path(
    "data/raw/bhopal_boundary/bhopal_boundary.geojson"
)

OUTPUT_DIR = Path("data/processed/buildings")
OUTPUT_FILE = OUTPUT_DIR / "bhopal_buildings.geojson"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# Load Bhopal boundary
# --------------------------------------------------

print("Loading Bhopal boundary...")

boundary_gdf = gpd.read_file(BOUNDARY_FILE)

boundary = boundary_gdf.geometry.iloc[0]

if not boundary.is_valid:
    raise RuntimeError("Bhopal boundary is invalid.")

print("Boundary loaded successfully.")
print(f"Bounds: {boundary.bounds}")

prepared_boundary = prep(boundary)


# --------------------------------------------------
# Input files
# --------------------------------------------------

files = sorted(INPUT_DIR.glob("*.csv.gz"))

print(f"\nMicrosoft tiles found: {len(files)}")

if not files:
    raise RuntimeError("No .csv.gz files found.")


# --------------------------------------------------
# GeoJSON output
# --------------------------------------------------

features_written = 0
features_seen = 0
invalid_features = 0

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:

    out.write('{"type":"FeatureCollection","features":[\n')

    first_feature = True

    # --------------------------------------------------
    # Process every Microsoft tile
    # --------------------------------------------------

    for file in files:

        print(f"\nProcessing: {file.name}")

        with gzip.open(
            file,
            "rt",
            encoding="utf-8"
        ) as f:

            for line in f:

                line = line.strip()

                if not line:
                    continue

                features_seen += 1

                try:
                    feature = json.loads(line)

                    geometry_data = feature.get("geometry")

                    if not geometry_data:
                        continue

                    geom = shape(geometry_data)

                    if geom.is_empty:
                        continue

                    # Quick bounding-box check
                    if not prepared_boundary.intersects(geom):
                        continue

                    # Exact intersection
                    if not boundary.intersects(geom):
                        continue

                    # Repair geometry if necessary
                    if not geom.is_valid:
                        geom = geom.buffer(0)

                    if geom.is_empty:
                        continue

                    feature["geometry"] = json.loads(
                        json.dumps(
                            geom.__geo_interface__
                        )
                    )

                    if not first_feature:
                        out.write(",\n")

                    out.write(
                        json.dumps(
                            feature,
                            separators=(",", ":")
                        )
                    )

                    first_feature = False
                    features_written += 1

                    if features_written % 10000 == 0:
                        print(
                            f"Buildings kept: "
                            f"{features_written:,}"
                        )

                except Exception:
                    invalid_features += 1

    out.write("\n]}")

print("\n" + "=" * 60)
print("CLIPPING COMPLETE")
print("=" * 60)

print(f"Features scanned : {features_seen:,}")
print(f"Buildings kept   : {features_written:,}")
print(f"Invalid/skipped  : {invalid_features:,}")

print(f"\nOutput:")
print(OUTPUT_FILE)