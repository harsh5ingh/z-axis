from pathlib import Path
import requests
import geopandas as gpd
import rasterio


INDEX_URL = (
    "https://opendata.aiforgood.ai/"
    "building-density/tile_index.gpkg"
)

BOUNDARY = Path(
    "data/raw/bhopal_boundary/bhopal_boundary.geojson"
)

INDEX_FILE = Path(
    "data/raw/building_height/tile_index.gpkg"
)

OUTPUT_DIR = Path(
    "data/raw/building_height"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


print("=" * 70)
print("MICROSOFT BUILDING HEIGHT DATA")
print("BHOPAL TILE FINDER + DOWNLOADER")
print("=" * 70)


# ---------------------------------------------------------
# Download tile index
# ---------------------------------------------------------

if not INDEX_FILE.exists():

    print("\nDownloading Microsoft tile index...")

    response = requests.get(
        INDEX_URL,
        stream=True,
        timeout=120
    )

    response.raise_for_status()

    with open(INDEX_FILE, "wb") as f:
        for chunk in response.iter_content(
            chunk_size=1024 * 1024
        ):
            if chunk:
                f.write(chunk)

    print("Tile index downloaded.")

else:
    print("\nTile index already exists.")
    print(f"Using: {INDEX_FILE}")


# ---------------------------------------------------------
# Load Bhopal boundary
# ---------------------------------------------------------

print("\nLoading Bhopal boundary...")

boundary = gpd.read_file(BOUNDARY)

print(f"Boundary CRS: {boundary.crs}")

# Dataset tile index uses EPSG:3857
boundary_3857 = boundary.to_crs(3857)

bbox = boundary_3857.total_bounds

print(
    "Bhopal bounds EPSG:3857:",
    bbox
)


# ---------------------------------------------------------
# Load tile index
# ---------------------------------------------------------

print("\nLoading tile index...")

tiles = gpd.read_file(
    INDEX_FILE
)

print(f"Total tiles in index: {len(tiles):,}")
print(f"Index CRS: {tiles.crs}")


# ---------------------------------------------------------
# Find intersecting tiles
# ---------------------------------------------------------

print("\nFinding Bhopal tiles...")

# Make sure both are in same CRS
if tiles.crs != boundary_3857.crs:
    tiles = tiles.to_crs(
        boundary_3857.crs
    )

possible = tiles.cx[
    bbox[0]:bbox[2],
    bbox[1]:bbox[3]
].copy()


if len(possible) == 0:
    print("\nERROR: No tiles found.")
    raise SystemExit(1)


# Exact intersection
bhopal_tiles = possible[
    possible.geometry.intersects(
        boundary_3857.union_all()
    )
].copy()


print(
    f"Tiles intersecting Bhopal: "
    f"{len(bhopal_tiles)}"
)


if len(bhopal_tiles) == 0:
    print("No intersecting tiles.")
    raise SystemExit(1)


# ---------------------------------------------------------
# Display tile information
# ---------------------------------------------------------

print()
print("=" * 70)
print("BHOPAL HEIGHT TILES")
print("=" * 70)

columns = [
    "filename",
    "data_2023q4",
    "tile_x",
    "tile_y",
    "tile_z"
]

available_columns = [
    c for c in columns
    if c in bhopal_tiles.columns
]

print(
    bhopal_tiles[
        available_columns
    ].to_string(index=False)
)


# ---------------------------------------------------------
# Download COGs
# ---------------------------------------------------------

print()
print("=" * 70)
print("DOWNLOADING 2023 Q4 COGs")
print("=" * 70)


downloaded = []

for _, row in bhopal_tiles.iterrows():

    filename = row["filename"]
    url = row["data_2023q4"]

    if not isinstance(url, str) or not url.startswith("http"):
        print(
            f"\nSkipping {filename}: "
            "invalid URL"
        )
        continue

    output = OUTPUT_DIR / filename

    print()
    print("-" * 70)
    print(f"Tile   : {filename}")
    print(f"URL    : {url}")
    print(f"Output : {output}")
    print("-" * 70)

    if output.exists():

        print("Already downloaded.")

        downloaded.append(output)
        continue


    print("Downloading...")

    try:

        response = requests.get(
            url,
            stream=True,
            timeout=300
        )

        response.raise_for_status()

        total = int(
            response.headers.get(
                "content-length",
                0
            )
        )

        downloaded_bytes = 0

        with open(output, "wb") as f:

            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):

                if not chunk:
                    continue

                f.write(chunk)

                downloaded_bytes += len(chunk)

                if total:
                    percent = (
                        downloaded_bytes /
                        total
                        * 100
                    )

                    print(
                        f"\rProgress: "
                        f"{percent:.2f}%",
                        end=""
                    )

        print("\nDownload complete.")

        downloaded.append(output)

    except Exception as e:

        print(
            f"\nDownload failed: {e}"
        )


# ---------------------------------------------------------
# Inspect downloaded rasters
# ---------------------------------------------------------

print()
print("=" * 70)
print("DOWNLOADED HEIGHT RASTERS")
print("=" * 70)


for raster_file in downloaded:

    print()
    print(
        f"Inspecting: {raster_file.name}"
    )

    try:

        with rasterio.open(
            raster_file
        ) as src:

            print(
                f"CRS        : {src.crs}"
            )

            print(
                f"Size       : "
                f"{src.width} x {src.height}"
            )

            print(
                f"Resolution : "
                f"{src.res}"
            )

            print(
                f"Bands      : "
                f"{src.count}"
            )

            print(
                f"Band 1     : "
                f"building density"
            )

            print(
                f"Band 2     : "
                f"building height"
            )

    except Exception as e:

        print(
            f"Could not inspect raster: {e}"
        )


print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)

print(
    f"Downloaded rasters: "
    f"{len(downloaded)}"
)

print(
    f"Directory: "
    f"{OUTPUT_DIR}"
)