from pathlib import Path
import json


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BOUNDARY_FILE = PROJECT_ROOT / "data" / "boundaries" / "india_districts.geojson"


print("=" * 60)
print("GEOJSON STRUCTURE INSPECTION")
print("=" * 60)

with open(BOUNDARY_FILE, "r", encoding="utf-8") as file:
    data = json.load(file)

print("Top-level keys:")
print(list(data.keys()))

print()
print("GeoJSON type:")
print(data.get("type"))

features = data.get("features", [])

print()
print("Number of features:")
print(len(features))

if features:
    feature = features[0]

    print()
    print("First feature keys:")
    print(list(feature.keys()))

    print()
    print("First feature properties:")
    print(feature.get("properties"))

    print()
    print("First feature geometry type:")
    geometry = feature.get("geometry")
    print(geometry.get("type") if geometry else None)

    print()
    print("First feature ID:")
    print(feature.get("id"))

print()
print("=" * 60)
