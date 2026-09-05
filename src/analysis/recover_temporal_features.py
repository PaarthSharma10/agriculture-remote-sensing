from pathlib import Path

import ee
import pandas as pd

from src.config import (
    PROJECT_ID
)
from src.data.boundaries import get_district
from src.data.sentinel2 import get_sentinel2_collection
from src.processing.indices import (
    calculate_ndvi,
    calculate_ndwi,
    calculate_evi
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)


def initialize_earth_engine():
    try:
        ee.Initialize(
            project=PROJECT_ID
        )
    except ee.EEException:
        ee.Authenticate()
        ee.Initialize(
            project=PROJECT_ID
        )


def get_season_dates(year, season):
    if season == "Rabi":
        return (
            f"{year - 1}-11-01",
            f"{year}-04-15"
        )

    return (
        f"{year}-07-01",
        f"{year}-10-31"
    )


def extract_missing_features(
    district,
    year,
    season
):
    region = get_district(district)

    start_date, end_date = get_season_dates(
        year,
        season
    )

    collection = get_sentinel2_collection(
        region,
        start_date,
        end_date
    )

    image_count = collection.size().getInfo()

    print(
        f"    Sentinel-2 images: {image_count}"
    )

    if image_count == 0:
        return {
            "Image_Count": 0,
            "NDVI": None,
            "NDWI": None,
            "EVI": None
        }

    composite = collection.median()

    ndvi = calculate_ndvi(composite)
    ndwi = calculate_ndwi(composite)
    evi = calculate_evi(composite)

    features = (
        ndvi
        .addBands(ndwi)
        .addBands(evi)
    )

    statistics = features.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region.geometry(),
        scale=100,
        bestEffort=True,
        maxPixels=1e7,
        tileScale=4
    ).getInfo()

    return {
        "Image_Count": image_count,
        "NDVI": statistics.get("NDVI"),
        "NDWI": statistics.get("NDWI"),
        "EVI": statistics.get("EVI")
    }


def find_missing_rows(dataframe):
    missing_mask = (
        dataframe["NDVI"].isna()
        | dataframe["NDWI"].isna()
        | dataframe["EVI"].isna()
    )

    return dataframe[missing_mask].copy()


def recover_missing_rows(dataframe):
    missing_rows = find_missing_rows(
        dataframe
    )

    print()
    print("=" * 60)
    print("MISSING OBSERVATION RECOVERY")
    print("=" * 60)

    print()
    print(
        f"Missing rows to recover: "
        f"{len(missing_rows)}"
    )

    if missing_rows.empty:
        print()
        print(
            "No missing observations found."
        )
        return dataframe

    for index, row in missing_rows.iterrows():
        district = row["District"]
        year = int(row["Year"])
        season = row["Season"]

        print()
        print(
            f"Recovering: "
            f"{district} | {year} | {season}"
        )

        result = extract_missing_features(
            district,
            year,
            season
        )

        dataframe.at[
            index,
            "Image_Count"
        ] = result["Image_Count"]

        dataframe.at[
            index,
            "NDVI"
        ] = result["NDVI"]

        dataframe.at[
            index,
            "NDWI"
        ] = result["NDWI"]

        dataframe.at[
            index,
            "EVI"
        ] = result["EVI"]

        if (
            result["NDVI"] is None
            or result["NDWI"] is None
            or result["EVI"] is None
        ):
            print(
                "    Recovery unsuccessful."
            )
        else:
            print(
                f"    NDVI: {result['NDVI']}"
            )
            print(
                f"    NDWI: {result['NDWI']}"
            )
            print(
                f"    EVI: {result['EVI']}"
            )

    return dataframe


def validate_recovery(dataframe):
    print()
    print("=" * 60)
    print("RECOVERY VALIDATION")
    print("=" * 60)

    missing_mask = (
        dataframe["NDVI"].isna()
        | dataframe["NDWI"].isna()
        | dataframe["EVI"].isna()
    )

    remaining_missing = (
        dataframe[missing_mask]
    )

    print()
    print(
        f"Total rows: {len(dataframe)}"
    )

    print(
        f"Remaining incomplete rows: "
        f"{len(remaining_missing)}"
    )

    print()
    print("Missing values:")

    print(
        dataframe[
            [
                "NDVI",
                "NDWI",
                "EVI"
            ]
        ].isna().sum()
    )

    if not remaining_missing.empty:
        print()
        print(
            "Rows still containing missing "
            "vegetation indices:"
        )

        print(
            remaining_missing[
                [
                    "District",
                    "Year",
                    "Season",
                    "Image_Count",
                    "NDVI",
                    "NDWI",
                    "EVI"
                ]
            ].to_string(
                index=False
            )
        )

        return False

    print()
    print(
        "All missing vegetation-index "
        "observations were recovered."
    )

    return True


def save_dataset(dataframe):
    dataframe.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print()
    print(
        "Recovered temporal dataset saved."
    )

    print(
        f"Path: {OUTPUT_PATH}"
    )

    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )


def main():
    print("=" * 60)
    print(
        "SENTINEL-2 TEMPORAL DATA RECOVERY"
    )
    print("=" * 60)

    print()
    print(
        f"Input dataset: {INPUT_PATH}"
    )

    dataframe = pd.read_csv(
        INPUT_PATH
    )

    print(
        f"Rows loaded: {len(dataframe)}"
    )

    print()
    print(
        "Initializing Google Earth Engine..."
    )

    initialize_earth_engine()

    print(
        "Google Earth Engine initialized successfully."
    )

    dataframe = recover_missing_rows(
        dataframe
    )

    success = validate_recovery(
        dataframe
    )

    save_dataset(
        dataframe
    )

    if not success:
        raise ValueError(
            "Some missing observations "
            "could not be recovered."
        )

    print()
    print(
        "Temporal data recovery completed successfully."
    )


if __name__ == "__main__":
    main()
