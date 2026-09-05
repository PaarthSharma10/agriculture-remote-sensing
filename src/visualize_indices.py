import geemap

from earth_engine import initialize
from data.boundaries import get_district
from data.sentinel2 import get_median_composite
from processing.indices import (
    calculate_ndvi,
    calculate_ndwi,
    calculate_evi
)

initialize()

amritsar = get_district("Amritsar")

image = get_median_composite(
    amritsar,
    "2024-01-01",
    "2024-03-31"
)

ndvi = calculate_ndvi(image)
ndwi = calculate_ndwi(image)
evi = calculate_evi(image)

Map = geemap.Map()

Map.centerObject(amritsar, 9)

Map.addLayer(
    ndvi,
    {
        "min": -1,
        "max": 1,
        "palette": [
            "brown",
            "yellow",
            "lightgreen",
            "green",
            "darkgreen"
        ]
    },
    "NDVI"
)

Map.addLayer(
    ndwi,
    {
        "min": -1,
        "max": 1,
        "palette": [
            "brown",
            "yellow",
            "lightblue",
            "blue",
            "darkblue"
        ]
    },
    "NDWI"
)

Map.addLayer(
    evi,
    {
        "min": -1,
        "max": 1,
        "palette": [
            "brown",
            "yellow",
            "lightgreen",
            "green",
            "darkgreen"
        ]
    },
    "EVI"
)

Map.to_html("outputs/amritsar_indices_2024.html")
