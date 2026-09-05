from earth_engine import initialize
from data.boundaries import get_district
from data.sentinel2 import get_sentinel2_collection


initialize()

amritsar = get_district("Amritsar")

collection = get_sentinel2_collection(
    amritsar,
    "2024-01-01",
    "2024-03-31"
)

count = collection.size().getInfo()

print(f"Sentinel-2 images found: {count}")
