import sys
import time
from pathlib import Path

import ee
import pandas as pd

from src.config import (
    PROJECT_ID,
    STUDY_DISTRICTS,
    START_YEAR,
    END_YEAR
)
from src.data.boundaries import get_district
from src.data.sentinel2 import get_sentinel2_collection
from src.processing.indices import (
    calculate_ndvi,
    calculate_ndwi,
    calculate_evi
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)

CHECKPOINT_PATH = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features_checkpoint.csv"
)

SCALE = 30
TILE_SCALE = 4
MAX_PIXELS = 1e8
SAVE_EVERY = 10
MAX_RETRIES = 3


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

    if season == "Kharif":
        return (
            f"{year}-07-01",
            f"{year}-10-31"
        )

    raise ValueError(
        f"Unsupported season: {season}"
    )


def extract_features(district, year, season):
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

    if image_count == 0:
        print(
            f"    No Sentinel-2 images found for "
            f"{district} {year} {season}"
        )

        return {
            "District": district,
            "Year": year,
            "Season": season,
            "Start_Date": start_date,
            "End_Date": end_date,
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
        scale=SCALE,
        bestEffort=True,
        maxPixels=MAX_PIXELS,
        tileScale=TILE_SCALE
    ).getInfo()

    return {
        "District": district,
        "Year": year,
        "Season": season,
        "Start_Date": start_date,
        "End_Date": end_date,
        "Image_Count": image_count,
        "NDVI": statistics.get("NDVI"),
        "NDWI": statistics.get("NDWI"),
        "EVI": statistics.get("EVI")
    }


def extract_with_retry(district, year, season):
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return extract_features(
                district,
                year,
                season
            )
        except ee.EEException as error:
            last_error = error

            print(
                f"    Earth Engine error "
                f"(attempt {attempt}/{MAX_RETRIES}): "
                f"{error}"
            )

            if attempt < MAX_RETRIES:
                wait_time = attempt * 5

                print(
                    f"    Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)

    raise last_error


def save_checkpoint(records):
    CHECKPOINT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe = pd.DataFrame(records)

    dataframe.to_csv(
        CHECKPOINT_PATH,
        index=False
    )


def load_checkpoint():
    if not CHECKPOINT_PATH.exists():
        return []

    dataframe = pd.read_csv(
        CHECKPOINT_PATH
    )

    if dataframe.empty:
        return []

    return dataframe.to_dict(
        orient="records"
    )


def generate_temporal_features():
    records = load_checkpoint()

    completed = {
        (
            record["District"],
            int(record["Year"]),
            record["Season"]
        )
        for record in records
    }

    if records:
        print()
        print(
            f"Checkpoint found: "
            f"{len(records)} observations already completed."
        )

    seasons = [
        "Rabi",
        "Kharif"
    ]

    total = (
        len(STUDY_DISTRICTS)
        * (END_YEAR - START_YEAR + 1)
        * len(seasons)
    )

    current = len(records)

    for district in STUDY_DISTRICTS:
        print(
            f"Processing {district}..."
        )

        for year in range(
            START_YEAR,
            END_YEAR + 1
        ):
            for season in seasons:
                key = (
                    district,
                    year,
                    season
                )

                if key in completed:
                    continue

                current += 1

                print(
                    f"  [{current}/{total}] "
                    f"{year} {season}"
                )

                result = extract_with_retry(
                    district,
                    year,
                    season
                )

                records.append(result)
                completed.add(key)

                if len(records) % SAVE_EVERY == 0:
                    save_checkpoint(records)

                    print(
                        f"    Checkpoint saved: "
                        f"{len(records)} rows"
                    )

    save_checkpoint(records)

    return pd.DataFrame(records)


def validate_dataset(dataframe):
    required_columns = [
        "District",
        "Year",
        "Season",
        "Start_Date",
        "End_Date",
        "Image_Count",
        "NDVI",
        "NDWI",
        "EVI"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    if dataframe.empty:
        raise ValueError(
            "Generated dataset is empty."
        )

    if dataframe["District"].isna().any():
        raise ValueError(
            "District column contains missing values."
        )

    if dataframe["Year"].isna().any():
        raise ValueError(
            "Year column contains missing values."
        )

    if dataframe["Season"].isna().any():
        raise ValueError(
            "Season column contains missing values."
        )

    expected_rows = (
        len(STUDY_DISTRICTS)
        * (END_YEAR - START_YEAR + 1)
        * 2
    )

    if len(dataframe) != expected_rows:
        raise ValueError(
            f"Expected {expected_rows} rows, "
            f"but found {len(dataframe)}."
        )

    expected_years = set(
        range(
            START_YEAR,
            END_YEAR + 1
        )
    )

    actual_years = set(
        dataframe["Year"].unique()
    )

    if actual_years != expected_years:
        raise ValueError(
            f"Year mismatch. "
            f"Expected {expected_years}, "
            f"found {actual_years}."
        )

    expected_seasons = {
        "Rabi",
        "Kharif"
    }

    actual_seasons = set(
        dataframe["Season"].unique()
    )

    if actual_seasons != expected_seasons:
        raise ValueError(
            f"Season mismatch. "
            f"Expected {expected_seasons}, "
            f"found {actual_seasons}."
        )

    expected_districts = set(
        STUDY_DISTRICTS
    )

    actual_districts = set(
        dataframe["District"].unique()
    )

    if actual_districts != expected_districts:
        raise ValueError(
            f"District mismatch. "
            f"Expected {expected_districts}, "
            f"found {actual_districts}."
        )

    duplicate_count = dataframe.duplicated(
        subset=[
            "District",
            "Year",
            "Season"
        ]
    ).sum()

    if duplicate_count > 0:
        raise ValueError(
            "Duplicate district-year-season "
            "combinations found."
        )

    print()
    print("=" * 60)
    print("TEMPORAL DATA VALIDATION")
    print("=" * 60)

    print()
    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print()
    print("Missing values:")

    print(
        dataframe.isnull().sum()
    )

    print()
    print(
        f"Expected rows: {expected_rows}"
    )

    print(
        f"Actual rows: {len(dataframe)}"
    )

    print(
        "Row count validation: PASS"
    )

    print()
    print(
        f"Districts found: "
        f"{len(actual_districts)}"
    )

    print(
        "District validation: PASS"
    )

    print()
    print(
        f"Years found: "
        f"{sorted(actual_years)}"
    )

    print(
        "Year validation: PASS"
    )

    print()
    print(
        f"Seasons found: "
        f"{sorted(actual_seasons)}"
    )

    print(
        "Season validation: PASS"
    )

    print()
    print(
        f"Duplicate district-year-season rows: "
        f"{duplicate_count}"
    )

    print(
        "Duplicate validation: PASS"
    )

    print()
    print(
        "Temporal data validation passed."
    )


def save_dataset(dataframe):
    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print()
    print(
        "Temporal dataset generated successfully."
    )

    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print(
        f"Saved to: {OUTPUT_PATH}"
    )


def main():
    print("=" * 60)
    print(
        "SENTINEL-2 TEMPORAL FEATURE EXTRACTION"
    )
    print("=" * 60)

    print()
    print(
        f"Project: {PROJECT_ID}"
    )

    print(
        f"District count: "
        f"{len(STUDY_DISTRICTS)}"
    )

    print(
        f"Districts: {STUDY_DISTRICTS}"
    )

    print(
        f"Years: {START_YEAR}-{END_YEAR}"
    )

    print()
    print(
        "Initializing Google Earth Engine..."
    )

    initialize_earth_engine()

    print(
        "Google Earth Engine initialized successfully."
    )

    print()
    print(
        "Generating temporal agricultural features..."
    )

    dataframe = generate_temporal_features()

    validate_dataset(dataframe)

    save_dataset(dataframe)


if __name__ == "__main__":
    main()
