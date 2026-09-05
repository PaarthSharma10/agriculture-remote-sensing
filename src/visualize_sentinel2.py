import geemap

from earth_engine import initialize
from data.boundaries import get_district
from data.sentinel2 import get_median_composite

initialize()

amritsar = get_district("Amritsar")

image = get_median_composite(
    amritsar,
    "2024-01-01",
    "2024-03-31"
)

Map = geemap.Map()

Map.centerObject(amritsar, 9)

Map.addLayer(
    image,
    {
        "bands": ["B4", "B3", "B2"],
        "min": 0,
        "max": 3000
    },
    "Sentinel-2 RGB"
)

Map.to_html("outputs/amritsar_sentinel2_2024.html")
