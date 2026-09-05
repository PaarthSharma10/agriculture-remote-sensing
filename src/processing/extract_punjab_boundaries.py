from pathlib import Path

import geopandas as gpd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "boundaries"
    / "india_districts_converted.geojson"
)

OUTPUT_FILE = (
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
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar",
    "Sangrur",
    "Shahid Bhagat Singh Nagar",
    "Muktsar",
    "Tarn Taran",
]

print("=" * 60)
print("PUNJAB DISTRICT EXTRACTION")
print("=" * 60)

if not INPUT_FILE.exists():
    print(f"ERROR: Input file not found:\n{INPUT_FILE}")
    raise SystemExit(1)

gdf = gpd.read_file(INPUT_FILE)

print(f"Total India ADM2 features: {len(gdf)}")

district_names = (
    gdf["shapeName"]
    .dropna()
    .astype(str)
    .str.strip()
)

print(f"Unique district names: {district_names.nunique()}")

print()
print("Searching for Punjab districts...")

normalized = {
    name.lower().strip(): name
    for name in district_names
}

found = []
missing = []

for district in EXPECTED_DISTRICTS:
    key = district.lower().strip()

    if key in normalized:
        found.append(normalized[key])
    else:
        missing.append(district)

print()
print(f"Found: {len(found)}/{len(EXPECTED_DISTRICTS)}")
print(f"Missing: {len(missing)}")

if found:
    print()
    print("FOUND DISTRICTS:")
    for district in found:
        print(f"  PASS: {district}")

if missing:
    print()
    print("MISSING DISTRICTS:")
    for district in missing:
        print(f"  FAIL: {district}")

if missing:
    print()
    print("Possible matching district names:")

    for district in missing:
        matches = [
            name
            for name in district_names.unique()
            if district.lower() in name.lower()
            or name.lower() in district.lower()
        ]

        if matches:
            print(f"{district}: {matches}")

if not found:
    print()
    print("ERROR: No Punjab districts found.")
    raise SystemExit(1)

punjab = gdf[
    gdf["shapeName"]
    .astype(str)
    .str.strip()
    .str.lower()
    .isin([district.lower() for district in found])
].copy()

punjab.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)

print()
print(f"Punjab features extracted: {len(punjab)}")
print(f"Output file: {OUTPUT_FILE}")

print()
print("Extracted districts:")
print(
    punjab["shapeName"]
    .sort_values()
    .to_string(index=False)
)

print()
print("=" * 60)
print("PUNJAB EXTRACTION COMPLETE")
print("=" * 60)
