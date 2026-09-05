"""Inspect the GRIB messages contained in the ERA5-Land dataset."""

from pathlib import Path

import cfgrib


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "environmental"
    / "era5_land_monthly.grib"
)


def main() -> None:
    """Inspect available GRIB datasets."""

    print("=" * 60)
    print("ERA5-LAND GRIB INSPECTION")
    print("=" * 60)

    print(f"File: {INPUT_FILE}")
    print()

    datasets = cfgrib.open_datasets(
        str(INPUT_FILE),
    )

    print(f"GRIB datasets found: {len(datasets)}")
    print()

    for index, dataset in enumerate(datasets, start=1):

        print("-" * 60)
        print(f"DATASET {index}")
        print("-" * 60)

        print("Dimensions:")
        print(dataset.dims)

        print()
        print("Variables:")
        print(list(dataset.data_vars))

        print()
        print("Attributes:")

        for key, value in dataset.attrs.items():
            print(f"  {key}: {value}")

        print()


if __name__ == "__main__":
    main()
