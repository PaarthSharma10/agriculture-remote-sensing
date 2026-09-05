import geemap

from earth_engine import initialize
from data.boundaries import get_district
from data.sentinel2 import get_median_composite
from processing.indices import calculate_ndvi

initialize()

amritsar = get_district("Amritsar")

image = get_median_composite(
    amritsar,
    "2024-01-01",
    "2024-03-31"
)

ndvi = calculate_ndvi(image)

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

Map.to_html("outputs/amritsar_ndvi_2024.html")
