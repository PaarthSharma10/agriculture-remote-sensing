import sys
from pathlib import Path

import ee
import pandas as pd

from src.config import (
    PROJECT_ID,
    STUDY_DISTRICTS,
    START_YEAR,
    END_YEAR,
    LANDSAT_COLLECTION,
    LANDSAT_9_COLLECTION
)
from src.data.boundaries import get_district


PROJECT_ROOT = Path(__file__).resolve().parents[2]

SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "landsat"
    / "landsat_features.csv"
)


SEASONS = [
    "Rabi",
    "Kharif"
]


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


def get_season_dates(
    year,
    season
):
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


def mask_landsat(image):
    qa_pixel = image.select(
        "QA_PIXEL"
    )

    qa_radsat = image.select(
        "QA_RADSAT"
    )

    clear = (
        qa_pixel.bitwiseAnd(1 << 1).eq(0)
        .And(
            qa_pixel.bitwiseAnd(1 << 2).eq(0)
        )
        .And(
            qa_pixel.bitwiseAnd(1 << 3).eq(0)
        )
        .And(
            qa_pixel.bitwiseAnd(1 << 4).eq(0)
        )
        .And(
            qa_pixel.bitwiseAnd(1 << 5).eq(0)
        )
    )

    saturation_free = qa_radsat.eq(0)

    return image.updateMask(
        clear.And(saturation_free)
    )


def prepare_landsat(image):
    optical = image.select(
        [
            "SR_B2",
            "SR_B3",
            "SR_B4",
            "SR_B5",
            "SR_B6",
            "SR_B7"
        ]
    ).multiply(
        0.0000275
    ).add(
        -0.2
    )

    thermal = image.select(
        "ST_B10"
    ).multiply(
        0.00341802
    ).add(
        149.0
    )

    return (
        image
        .addBands(
            optical,
            overwrite=True
        )
        .addBands(
            thermal,
            overwrite=True
        )
    )


def get_landsat_collection(
    region,
    start_date,
    end_date
):
    landsat_8 = (
        ee.ImageCollection(
            LANDSAT_COLLECTION
        )
        .filterBounds(region)
        .filterDate(
            start_date,
            end_date
        )
        .filter(
            ee.Filter.lte(
                "CLOUD_COVER",
                40
            )
        )
        .map(mask_landsat)
        .map(prepare_landsat)
    )

    landsat_9 = (
        ee.ImageCollection(
            LANDSAT_9_COLLECTION
        )
        .filterBounds(region)
        .filterDate(
            start_date,
            end_date
        )
        .filter(
            ee.Filter.lte(
                "CLOUD_COVER",
                40
            )
        )
        .map(mask_landsat)
        .map(prepare_landsat)
    )

    return (
        landsat_8
        .merge(landsat_9)
        .sort(
            "system:time_start"
        )
    )


def calculate_landsat_indices(
    image
):
    ndvi = (
        image
        .normalizedDifference(
            [
                "SR_B5",
                "SR_B4"
            ]
        )
        .rename(
            "Landsat_NDVI"
        )
    )

    ndwi = (
        image
        .normalizedDifference(
            [
                "SR_B3",
                "SR_B5"
            ]
        )
        .rename(
            "Landsat_NDWI"
        )
    )

    evi = image.expression(
        "2.5 * ((NIR - RED) / "
        "(NIR + 6 * RED - "
        "7.5 * BLUE + 1))",
        {
            "NIR": image.select(
                "SR_B5"
            ),
            "RED": image.select(
                "SR_B4"
            ),
            "BLUE": image.select(
                "SR_B2"
            )
        }
    ).rename(
        "Landsat_EVI"
    )

    lst_celsius = (
        image
        .select(
            "ST_B10"
        )
        .subtract(
            273.15
        )
        .rename(
            "Landsat_LST_C"
        )
    )

    return (
        ndvi
        .addBands(ndwi)
        .addBands(evi)
        .addBands(lst_celsius)
    )


def extract_features(
    district,
    year,
    season
):
    region = get_district(
        district
    )

    start_date, end_date = (
        get_season_dates(
            year,
            season
        )
    )

    collection = get_landsat_collection(
        region,
        start_date,
        end_date
    )

    image_count = (
        collection
        .size()
        .getInfo()
    )

    if image_count == 0:
        print(
            f"    No Landsat images found "
            f"for {district} "
            f"{year} {season}"
        )

        return {
            "District": district,
            "Year": year,
            "Season": season,
            "Start_Date": start_date,
            "End_Date": end_date,
            "Image_Count": 0,
            "Landsat_NDVI": None,
            "Landsat_NDWI": None,
            "Landsat_EVI": None,
            "Landsat_LST_C": None
        }

    composite = (
        collection
        .median()
        .clip(
            region.geometry()
        )
    )

    indices = calculate_landsat_indices(
        composite
    )

    statistics = (
        indices
        .reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region.geometry(),
            scale=30,
            bestEffort=True,
            maxPixels=1e8
        )
        .getInfo()
    )

    return {
        "District": district,
        "Year": year,
        "Season": season,
        "Start_Date": start_date,
        "End_Date": end_date,
        "Image_Count": image_count,
        "Landsat_NDVI": statistics.get(
            "Landsat_NDVI"
        ),
        "Landsat_NDWI": statistics.get(
            "Landsat_NDWI"
        ),
        "Landsat_EVI": statistics.get(
            "Landsat_EVI"
        ),
        "Landsat_LST_C": statistics.get(
            "Landsat_LST_C"
        )
    }


def generate_landsat_features():
    records = []

    total = (
        len(STUDY_DISTRICTS)
        * (END_YEAR - START_YEAR + 1)
        * len(SEASONS)
    )

    current = 0

    for district in STUDY_DISTRICTS:

        print(
            f"Processing {district}..."
        )

        for year in range(
            START_YEAR,
            END_YEAR + 1
        ):

            for season in SEASONS:

                current += 1

                print(
                    f"  [{current}/{total}] "
                    f"{year} {season}"
                )

                result = extract_features(
                    district,
                    year,
                    season
                )

                records.append(
                    result
                )

    return pd.DataFrame(
        records
    )


def validate_dataset(
    dataframe
):
    required_columns = [
        "District",
        "Year",
        "Season",
        "Start_Date",
        "End_Date",
        "Image_Count",
        "Landsat_NDVI",
        "Landsat_NDWI",
        "Landsat_EVI",
        "Landsat_LST_C"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: "
            f"{missing_columns}"
        )

    expected_rows = (
        len(STUDY_DISTRICTS)
        * (END_YEAR - START_YEAR + 1)
        * len(SEASONS)
    )

    if len(dataframe) != expected_rows:
        raise ValueError(
            f"Expected {expected_rows} rows, "
            f"but found {len(dataframe)}."
        )

    expected_districts = set(
        STUDY_DISTRICTS
    )

    actual_districts = set(
        dataframe["District"].unique()
    )

    if actual_districts != expected_districts:
        raise ValueError(
            "District validation failed."
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
            "Year validation failed."
        )

    actual_seasons = set(
        dataframe["Season"].unique()
    )

    if actual_seasons != set(SEASONS):
        raise ValueError(
            "Season validation failed."
        )

    duplicate_count = (
        dataframe
        .duplicated(
            subset=[
                "District",
                "Year",
                "Season"
            ]
        )
        .sum()
    )

    if duplicate_count > 0:
        raise ValueError(
            "Duplicate district-year-season "
            "combinations found."
        )

    feature_columns = [
        "Landsat_NDVI",
        "Landsat_NDWI",
        "Landsat_EVI",
        "Landsat_LST_C"
    ]

    missing_features = (
        dataframe[
            feature_columns
        ]
        .isna()
        .sum()
    )

    print()
    print("=" * 60)
    print(
        "LANDSAT DATA VALIDATION"
    )
    print("=" * 60)

    print()
    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print()
    print(
        f"Expected rows: {expected_rows}"
    )

    print(
        f"Actual rows:   {len(dataframe)}"
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
        f"Duplicate observations: "
        f"{duplicate_count}"
    )

    print(
        "Duplicate validation: PASS"
    )

    print()
    print(
        "Missing feature values:"
    )

    print(
        missing_features
    )

    if missing_features.sum() > 0:
        print()
        print(
            "Warning: some Landsat feature "
            "values are missing."
        )
    else:
        print(
            "Feature completeness: PASS"
        )

    print()
    print(
        "LANDSAT DATA VALIDATION PASSED."
    )


def save_dataset(
    dataframe
):
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
        "Landsat dataset generated "
        "successfully."
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
        "LANDSAT TEMPORAL FEATURE EXTRACTION"
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

    print(
        f"Seasons: {SEASONS}"
    )

    print()
    print(
        "Initializing Google Earth Engine..."
    )

    initialize_earth_engine()

    print(
        "Google Earth Engine initialized "
        "successfully."
    )

    print()
    print(
        "Generating Landsat features..."
    )

    dataframe = (
        generate_landsat_features()
    )

    validate_dataset(
        dataframe
    )

    save_dataset(
        dataframe
    )


if __name__ == "__main__":
    main()
