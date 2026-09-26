import geopandas as gpd
import pandas as pd

INPUT = "data/processed/buildings/bhopal_buildings.geojson"

print("Loading Bhopal buildings...")

gdf = gpd.read_file(INPUT)

print("\n" + "=" * 60)
print("BHOPAL BUILDING DATASET PROFILE")
print("=" * 60)

print(f"Total buildings : {len(gdf):,}")
print(f"CRS             : {gdf.crs}")

# --------------------------------------------------
# Height
# --------------------------------------------------

if "height" in gdf.columns:

    height = pd.to_numeric(
        gdf["height"],
        errors="coerce"
    )

    valid_height = height[
        height > 0
    ]

    print("\nHEIGHT")
    print("-" * 60)
    print(
        f"Valid heights   : {len(valid_height):,}"
    )
    print(
        f"Missing/invalid : "
        f"{len(gdf) - len(valid_height):,}"
    )

    if len(valid_height) > 0:
        print(
            f"Minimum         : "
            f"{valid_height.min():.2f}"
        )
        print(
            f"Maximum         : "
            f"{valid_height.max():.2f}"
        )
        print(
            f"Average         : "
            f"{valid_height.mean():.2f}"
        )
        print(
            f"Median          : "
            f"{valid_height.median():.2f}"
        )

# --------------------------------------------------
# Confidence
# --------------------------------------------------

if "confidence" in gdf.columns:

    confidence = pd.to_numeric(
        gdf["confidence"],
        errors="coerce"
    )

    print("\nCONFIDENCE")
    print("-" * 60)

    print(
        f"Average         : "
        f"{confidence.mean():.4f}"
    )

    print(
        f"Minimum         : "
        f"{confidence.min():.4f}"
    )

    print(
        f"Maximum         : "
        f"{confidence.max():.4f}"
    )

    print(
        f"Below 0.5       : "
        f"{(confidence < 0.5).sum():,}"
    )

    print(
        f"Below 0.7       : "
        f"{(confidence < 0.7).sum():,}"
    )

    print(
        f"Above 0.9       : "
        f"{(confidence >= 0.9).sum():,}"
    )

# --------------------------------------------------
# Geometry
# --------------------------------------------------

print("\nGEOMETRY")
print("-" * 60)

print(
    f"Valid geometries: "
    f"{gdf.geometry.is_valid.sum():,}"
)

print(
    f"Invalid geometries: "
    f"{(~gdf.geometry.is_valid).sum():,}"
)

print(
    f"Empty geometries: "
    f"{gdf.geometry.is_empty.sum():,}"
)

# --------------------------------------------------
# Area
# --------------------------------------------------

# Reproject to metric CRS for area calculation
metric = gdf.to_crs("EPSG:32643")

areas = metric.geometry.area

print("\nBUILDING AREA")
print("-" * 60)

print(
    f"Minimum         : "
    f"{areas.min():.2f} m²"
)

print(
    f"Maximum         : "
    f"{areas.max():.2f} m²"
)

print(
    f"Average         : "
    f"{areas.mean():.2f} m²"
)

print(
    f"Median          : "
    f"{areas.median():.2f} m²"
)

print("\n" + "=" * 60)
print("PROFILE COMPLETE")
print("=" * 60)