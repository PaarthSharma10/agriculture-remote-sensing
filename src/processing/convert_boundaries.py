from pathlib import Path
import json

import geopandas as gpd
from shapely.geometry import shape


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "data" / "boundaries" / "india_districts.geojson"
OUTPUT_FILE = PROJECT_ROOT / "data" / "boundaries" / \
    "india_districts_converted.geojson"


def decode_arcs(topology):
    transform = topology["transform"]
    scale = transform["scale"]
    translate = transform["translate"]

    decoded = []

    for arc in topology["arcs"]:
        x = 0
        y = 0
        coordinates = []

        for point in arc:
            x += point[0]
            y += point[1]

            coordinates.append(
                [
                    x * scale[0] + translate[0],
                    y * scale[1] + translate[1],
                ]
            )

        decoded.append(coordinates)

    return decoded


def get_arc(decoded_arcs, index):
    if index >= 0:
        return decoded_arcs[index]

    return list(reversed(decoded_arcs[-index - 1]))


def convert_geometry(geometry, decoded_arcs):
    geometry_type = geometry["type"]
    arcs = geometry["arcs"]

    if geometry_type == "Polygon":
        rings = []

        for ring in arcs:
            coordinates = []

            for index in ring:
                arc = get_arc(decoded_arcs, index)

                if coordinates:
                    coordinates.extend(arc[1:])
                else:
                    coordinates.extend(arc)

            rings.append(coordinates)

        return {
            "type": "Polygon",
            "coordinates": rings,
        }

    if geometry_type == "MultiPolygon":
        polygons = []

        for polygon in arcs:
            rings = []

            for ring in polygon:
                coordinates = []

                for index in ring:
                    arc = get_arc(decoded_arcs, index)

                    if coordinates:
                        coordinates.extend(arc[1:])
                    else:
                        coordinates.extend(arc)

                rings.append(coordinates)

            polygons.append(rings)

        return {
            "type": "MultiPolygon",
            "coordinates": polygons,
        }

    raise ValueError(f"Unsupported geometry type: {geometry_type}")


print("=" * 60)
print("TOPOJSON TO GEOJSON CONVERSION")
print("=" * 60)

if not INPUT_FILE.exists():
    print(f"ERROR: Input file not found:\n{INPUT_FILE}")
    raise SystemExit(1)

with open(INPUT_FILE, "r", encoding="utf-8") as file:
    topology = json.load(file)

print(f"Input type: {topology.get('type')}")

objects = topology.get("objects", {})

print(f"Objects: {list(objects.keys())}")

object_name = list(objects.keys())[0]
object_data = objects[object_name]

print(f"Using object: {object_name}")
print(f"Object type: {object_data.get('type')}")

decoded_arcs = decode_arcs(topology)

geometries = object_data.get("geometries", [])

print(f"Geometries: {len(geometries)}")

features = []

for geometry in geometries:
    properties = geometry.get("properties", {})
    geojson_geometry = convert_geometry(geometry, decoded_arcs)

    features.append(
        {
            "type": "Feature",
            "properties": properties,
            "geometry": geojson_geometry,
        }
    )

geojson = {
    "type": "FeatureCollection",
    "features": features,
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(geojson, file)

gdf = gpd.GeoDataFrame.from_features(features)

print(f"Features converted: {len(gdf)}")
print(f"Columns: {list(gdf.columns)}")

if not gdf.empty:
    print()
    print("First feature properties:")
    print(gdf.iloc[0].drop("geometry").to_dict())

    print()
    print("Sample records:")

    print(gdf.drop(columns="geometry").head(5).to_string(index=False))

print()
print(f"Output file: {OUTPUT_FILE}")

print()
print("=" * 60)
print("CONVERSION COMPLETE")
print("=" * 60)
