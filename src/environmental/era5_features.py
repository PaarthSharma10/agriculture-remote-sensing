"""Download ERA5-Land monthly environmental data."""

from pathlib import Path

import cdsapi


# ---------------------------------------------------------------------------
# Project paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "data"
ENVIRONMENTAL_DIR = DATA_DIR / "environmental"

ENVIRONMENTAL_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

YEARS = list(range(2020, 2026))

MONTHS = [
    "01",
    "02",
    "03",
    "04",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
]


# Punjab bounding box
AREA = [
    32.0,  # North
    74.0,  # West
    29.5,  # South
    76.5,  # East
]


def download_era5_data() -> None:
    """Download ERA5-Land monthly environmental data."""

    client = cdsapi.Client()

    output_file = ENVIRONMENTAL_DIR / "era5_land_monthly.grib"

    print("=" * 60)
    print("ERA5-LAND DATA DOWNLOAD")
    print("=" * 60)

    print("Years:", YEARS)
    print("Months:", MONTHS)
    print("Output:", output_file)
    print()

    request = {
        "product_type": ["monthly_averaged_reanalysis"],
        "variable": [
            "2m_temperature",
            "total_precipitation",
            "volumetric_soil_water_layer_1",
        ],
        "year": [str(year) for year in YEARS],
        "month": MONTHS,
        "time": ["00:00"],
        "area": AREA,
        "data_format": "grib",
        "download_format": "unarchived",
    }

    print("Submitting request to CDS...")
    print("This may take some time.")
    print()

    client.retrieve(
        "reanalysis-era5-land-monthly-means",
        request,
        str(output_file),
    )

    print()
    print("ERA5-Land download completed successfully.")
    print(f"Saved to: {output_file}")


def main() -> None:
    """Run the ERA5-Land download."""

    download_era5_data()


if __name__ == "__main__":
    main()
