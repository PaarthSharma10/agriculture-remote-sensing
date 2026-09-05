import sys
from pathlib import Path

import ee

from src.config import (
    PROJECT_ID,
    STUDY_DISTRICTS,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


DATASET_ID = "WM/geoLab/geoBoundaries/600/ADM2"


def main():
    print("=" * 60)
    print("GEOboundaries ADM2 INSPECTION")
    print("=" * 60)

    print()
    print("Initializing Google Earth Engine...")

    ee.Initialize(
        project=PROJECT_ID
    )

    print(
        "Google Earth Engine initialized successfully."
    )

    boundaries = ee.FeatureCollection(
        DATASET_ID
    )

    print()
    print(f"Dataset: {DATASET_ID}")
    print(
        f"Total features: "
        f"{boundaries.size().getInfo()}"
    )

    print()
    print("Inspecting feature properties...")

    first = boundaries.first()

    print(
        first.toDictionary().getInfo()
    )

    print()
    print("=" * 60)
    print("INDIA ADMINISTRATIVE FEATURES")
    print("=" * 60)

    india = boundaries.filter(
        ee.Filter.eq(
            "shapeGroup",
            "IND"
        )
    )

    print()
    print(
        f"India features: "
        f"{india.size().getInfo()}"
    )

    india_names = (
        india
        .aggregate_array("shapeName")
        .distinct()
        .sort()
        .getInfo()
    )

    print()
    print("India administrative names:")

    for name in india_names:
        print(f"  {name}")

    print()
    print("=" * 60)
    print("STUDY DISTRICT MATCHING")
    print("=" * 60)

    for district in STUDY_DISTRICTS:
        matches = [
            name
            for name in india_names
            if name == district
        ]

        if matches:
            print(
                f"  {district}: FOUND"
            )
        else:
            print(
                f"  {district}: NOT FOUND"
            )

    print()
    print("=" * 60)
    print("INSPECTION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()
