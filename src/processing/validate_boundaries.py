from pathlib import Path

import geopandas as gpd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

BOUNDARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "boundaries"
    / "punjab_districts.geojson"
)

EXPECTED_DISTRICTS = [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Firozpur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar",
    "Sangrur",
    "Shahid Bhagat Singh Nagar",
    "Tarn Taran",
]


print("=" * 60)
print("PUNJAB DISTRICT BOUNDARY VALIDATION")
print("=" * 60)

if not BOUNDARY_FILE.exists():
    print(f"ERROR: Boundary file not found:")
    print(BOUNDARY_FILE)
    raise SystemExit(1)

gdf = gpd.read_file(BOUNDARY_FILE)

print(f"Boundary file: {BOUNDARY_FILE}")
print(f"Available boundaries: {len(gdf)}")

if "shapeName" not in gdf.columns:
    print("ERROR: shapeName column not found.")
    print(f"Available columns: {list(gdf.columns)}")
    raise SystemExit(1)

gdf["shapeName"] = gdf["shapeName"].astype(str).str.strip()

available = set(gdf["shapeName"].str.lower())

found = []
missing = []

for district in EXPECTED_DISTRICTS:
    if district.lower() in available:
        found.append(district)
    else:
        missing.append(district)

print()
print(f"Requested districts: {len(EXPECTED_DISTRICTS)}")
print(f"Requested districts found: {len(found)}/{len(EXPECTED_DISTRICTS)}")

print()
print("DISTRICT VALIDATION:")

for district in EXPECTED_DISTRICTS:
    if district in found:
        print(f"  PASS: {district}")
    else:
        print(f"  FAIL: {district}")

print()
print("GEOMETRY VALIDATION:")

invalid_geometries = gdf[~gdf.geometry.is_valid]

print(f"Valid geometries: {len(gdf) - len(invalid_geometries)}/{len(gdf)}")

if len(invalid_geometries) > 0:
    print("Invalid geometry districts:")

    for district in invalid_geometries["shapeName"]:
        print(f"  FAIL: {district}")
else:
    print("All geometries are valid.")

print()
print("EMPTY GEOMETRY VALIDATION:")

empty_geometries = gdf[gdf.geometry.is_empty]

print(f"Non-empty geometries: {len(gdf) - len(empty_geometries)}/{len(gdf)}")

if len(empty_geometries) > 0:
    print("Empty geometry districts:")

    for district in empty_geometries["shapeName"]:
        print(f"  FAIL: {district}")
else:
    print("No empty geometries found.")

print()
print("CRS VALIDATION:")

if gdf.crs is not None:
    print(f"CRS: {gdf.crs}")
    print("CRS validation: PASS")
else:
    print("CRS validation: FAIL")

print()
print("=" * 60)

if (
    len(found) == len(EXPECTED_DISTRICTS)
    and len(invalid_geometries) == 0
    and len(empty_geometries) == 0
    and gdf.crs is not None
):
    print("BOUNDARY VALIDATION: PASS")
else:
    print("BOUNDARY VALIDATION: FAIL")

print("=" * 60)
