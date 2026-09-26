import pandas as pd
import mercantile

# Bhopal city approximate bounding box
MIN_LON = 77.20
MIN_LAT = 23.15
MAX_LON = 77.55
MAX_LAT = 23.45

# Microsoft uses QuadKey tiles.
# Start with zoom 9 so we don't generate excessive tiles.
ZOOM = 9

tiles = list(
    mercantile.tiles(
        MIN_LON,
        MIN_LAT,
        MAX_LON,
        MAX_LAT,
        zooms=ZOOM
    )
)

quadkeys = sorted(
    mercantile.quadkey(tile)
    for tile in tiles
)

print(f"Bhopal QuadKeys ({len(quadkeys)}):")
for qk in quadkeys:
    print(qk)

# Microsoft dataset manifest
MANIFEST_URL = (
    "https://bfppub.blob.core.windows.net/"
    "$web/2026-08-13/dataset-links.csv"
)

print("\nLoading Microsoft dataset manifest...")

df = pd.read_csv(MANIFEST_URL, dtype=str)

print(f"Total manifest rows: {len(df)}")

# Find matching tiles
matches = df[df["QuadKey"].isin(quadkeys)]

print(f"\nMatching tiles: {len(matches)}")

if len(matches) == 0:
    print("\nNo matching tiles found.")
else:
    print(
        matches[
            [c for c in ["Location", "QuadKey", "Url"]
             if c in matches.columns]
        ].to_string(index=False)
    )

    matches.to_csv(
        "bhopal_microsoft_tiles.csv",
        index=False
    )

    print(
        "\nSaved: bhopal_microsoft_tiles.csv"
    )