from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

TEMPORAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)

ENVIRONMENTAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "environmental"
    / "environmental_features.csv"
)

CROP_YIELD_FILE = (
    PROJECT_ROOT
    / "data"
    / "crops"
    / "processed"
    / "crop_yield_ml_ready.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

START_YEAR = 2021
END_YEAR = 2022

KEY_COLUMNS = [
    "District",
    "Year",
    "Season"
]

CROP_KEY_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop"
]

TEMPORAL_COLUMNS = [
    "District",
    "Year",
    "Season",
    "NDVI",
    "NDWI",
    "EVI"
]

ENVIRONMENTAL_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture"
]

CROP_YIELD_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop",
    "Area_Hectare",
    "Production_Tonnes",
    "Yield_kg_ha"
]

PREDICTOR_COLUMNS = [
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture"
]


def load_datasets():
    temporal = pd.read_csv(TEMPORAL_FILE)
    environmental = pd.read_csv(ENVIRONMENTAL_FILE)
    crop_yield = pd.read_csv(CROP_YIELD_FILE)

    return temporal, environmental, crop_yield


def prepare_temporal(temporal):
    missing = [
        column
        for column in TEMPORAL_COLUMNS
        if column not in temporal.columns
    ]

    if missing:
        raise ValueError(
            f"Temporal dataset is missing columns: {missing}"
        )

    temporal = temporal[TEMPORAL_COLUMNS].copy()

    temporal["District"] = (
        temporal["District"]
        .astype(str)
        .str.strip()
    )

    temporal["Season"] = (
        temporal["Season"]
        .astype(str)
        .str.strip()
    )

    temporal["Year"] = pd.to_numeric(
        temporal["Year"],
        errors="raise"
    )

    return temporal


def prepare_environmental(environmental):
    missing = [
        column
        for column in ENVIRONMENTAL_COLUMNS
        if column not in environmental.columns
    ]

    if missing:
        raise ValueError(
            f"Environmental dataset is missing columns: {missing}"
        )

    environmental = environmental[ENVIRONMENTAL_COLUMNS].copy()

    environmental["District"] = (
        environmental["District"]
        .astype(str)
        .str.strip()
    )

    environmental["Season"] = (
        environmental["Season"]
        .astype(str)
        .str.strip()
    )

    environmental["Year"] = pd.to_numeric(
        environmental["Year"],
        errors="raise"
    )

    return environmental


def prepare_crop_yield(crop_yield):
    missing = [
        column
        for column in CROP_YIELD_COLUMNS
        if column not in crop_yield.columns
    ]

    if missing:
        raise ValueError(
            f"Crop-yield dataset is missing columns: {missing}"
        )

    crop_yield = crop_yield[
        crop_yield["Year"].between(
            START_YEAR,
            END_YEAR
        )
    ].copy()

    crop_yield = crop_yield[CROP_YIELD_COLUMNS]

    crop_yield["District"] = (
        crop_yield["District"]
        .astype(str)
        .str.strip()
    )

    crop_yield["Season"] = (
        crop_yield["Season"]
        .astype(str)
        .str.strip()
    )

    crop_yield["Crop"] = (
        crop_yield["Crop"]
        .astype(str)
        .str.strip()
    )

    crop_yield["Year"] = pd.to_numeric(
        crop_yield["Year"],
        errors="raise"
    )

    return crop_yield


def validate_source_data(
    temporal,
    environmental,
    crop_yield
):
    if temporal[KEY_COLUMNS].duplicated().any():
        raise ValueError(
            "Duplicate district-year-season rows found "
            "in temporal dataset."
        )

    if environmental[KEY_COLUMNS].duplicated().any():
        raise ValueError(
            "Duplicate district-year-season rows found "
            "in environmental dataset."
        )

    if crop_yield[CROP_KEY_COLUMNS].duplicated().any():
        raise ValueError(
            "Duplicate district-year-season-crop rows found "
            "in crop-yield dataset."
        )

    if temporal.isnull().any().any():
        raise ValueError(
            "Missing values found in temporal dataset."
        )

    if environmental.isnull().any().any():
        raise ValueError(
            "Missing values found in environmental dataset."
        )

    if crop_yield.isnull().any().any():
        missing = crop_yield.isnull().sum()
        missing = missing[missing > 0]

        raise ValueError(
            f"Missing values found in crop-yield dataset:\n{missing}"
        )

    if (crop_yield["Yield_kg_ha"] <= 0).any():
        raise ValueError(
            "Non-positive yield values found."
        )


def check_temporal_alignment(
    temporal,
    environmental,
    crop_yield
):
    crop_keys = crop_yield[KEY_COLUMNS].drop_duplicates()

    temporal_keys = temporal[KEY_COLUMNS]
    environmental_keys = environmental[KEY_COLUMNS]

    temporal_check = crop_keys.merge(
        temporal_keys,
        on=KEY_COLUMNS,
        how="left",
        indicator=True
    )

    missing_temporal = temporal_check[
        temporal_check["_merge"] == "left_only"
    ]

    if not missing_temporal.empty:
        raise ValueError(
            "Some crop-yield observations have no matching "
            "remote-sensing observation:\n"
            f"{missing_temporal[KEY_COLUMNS].to_string(index=False)}"
        )

    environmental_check = crop_keys.merge(
        environmental_keys,
        on=KEY_COLUMNS,
        how="left",
        indicator=True
    )

    missing_environmental = environmental_check[
        environmental_check["_merge"] == "left_only"
    ]

    if not missing_environmental.empty:
        raise ValueError(
            "Some crop-yield observations have no matching "
            "environmental observation:\n"
            f"{missing_environmental[KEY_COLUMNS].to_string(index=False)}"
        )


def build_dataset(
    temporal,
    environmental,
    crop_yield
):
    dataset = crop_yield.merge(
        temporal,
        on=KEY_COLUMNS,
        how="inner",
        validate="many_to_one"
    )

    dataset = dataset.merge(
        environmental,
        on=KEY_COLUMNS,
        how="inner",
        validate="many_to_one"
    )

    dataset = dataset.sort_values(
        [
            "District",
            "Year",
            "Season",
            "Crop"
        ]
    ).reset_index(drop=True)

    return dataset


def create_engineered_features(dataset):
    dataset = dataset.copy()

    dataset["NDVI_NDWI_ratio"] = (
        dataset["NDVI"]
        / dataset["NDWI"].replace(0, pd.NA)
    )

    dataset["EVI_NDVI_ratio"] = (
        dataset["EVI"]
        / dataset["NDVI"].replace(0, pd.NA)
    )

    dataset["Vegetation_Water_Index"] = (
        dataset["NDVI"] * dataset["NDWI"]
    )

    dataset["Vegetation_Stress_Index"] = (
        dataset["EVI"]
        / dataset["NDVI"].replace(0, pd.NA)
    )

    dataset["Temperature_Rainfall_ratio"] = (
        dataset["Temperature_C"]
        / dataset["Rainfall_mm"].replace(0, pd.NA)
    )

    dataset["Climate_Index"] = (
        dataset["Soil_Moisture"]
        * dataset["Rainfall_mm"]
        / dataset["Temperature_C"].replace(0, pd.NA)
    )

    engineered_columns = [
        "NDVI_NDWI_ratio",
        "EVI_NDVI_ratio",
        "Vegetation_Water_Index",
        "Vegetation_Stress_Index",
        "Temperature_Rainfall_ratio",
        "Climate_Index"
    ]

    dataset[engineered_columns] = dataset[
        engineered_columns
    ].apply(
        pd.to_numeric,
        errors="coerce"
    )

    return dataset


def validate_ml_dataset(dataset):
    required_columns = (
        CROP_YIELD_COLUMNS
        + PREDICTOR_COLUMNS
        + [
            "NDVI_NDWI_ratio",
            "EVI_NDVI_ratio",
            "Vegetation_Water_Index",
            "Vegetation_Stress_Index",
            "Temperature_Rainfall_ratio",
            "Climate_Index"
        ]
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in dataset.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    if dataset.empty:
        raise ValueError(
            "ML dataset is empty."
        )

    if dataset[required_columns].isnull().any().any():
        missing = dataset[
            required_columns
        ].isnull().sum()

        missing = missing[missing > 0]

        raise ValueError(
            f"Missing values found:\n{missing}"
        )

    if (dataset["Yield_kg_ha"] <= 0).any():
        raise ValueError(
            "Non-positive yield values found."
        )

    duplicate_count = dataset.duplicated(
        subset=CROP_KEY_COLUMNS
    ).sum()

    if duplicate_count:
        raise ValueError(
            f"Duplicate ML observations: {duplicate_count}"
        )


def print_cross_crop_diagnostic(dataset):
    print()
    print("=" * 70)
    print("CROSS-CROP FEATURE DIAGNOSTIC")
    print("=" * 70)

    grouped = dataset.groupby(
        KEY_COLUMNS,
        dropna=False
    )

    multi_crop_groups = grouped.filter(
        lambda group: len(group) > 1
    )

    if multi_crop_groups.empty:
        print()
        print("No multi-crop groups found.")
        return

    diagnostic_columns = [
        "NDVI",
        "NDWI",
        "EVI",
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture"
    ]

    diagnostic = (
        multi_crop_groups
        .groupby(KEY_COLUMNS)[diagnostic_columns]
        .nunique()
    )

    identical_groups = (
        (diagnostic == 1)
        .all(axis=1)
        .sum()
    )

    total_groups = len(diagnostic)

    print()
    print(
        f"Multi-crop groups: {total_groups}"
    )

    print(
        "Groups with identical remote-sensing and "
        f"environmental features: {identical_groups}"
    )

    if identical_groups:
        print()
        print(
            "NOTE: Features are shared across crops when "
            "they belong to the same district-year-season."
        )

        print(
            "This is expected because the current temporal "
            "and environmental datasets are district-season level."
        )

        print(
            "Crop-specific remote-sensing features would require "
            "crop-specific field or crop-mask observations."
        )


def print_summary(
    temporal,
    environmental,
    crop_yield,
    dataset
):
    print()
    print("=" * 70)
    print("ML DATASET INTEGRATION")
    print("=" * 70)

    print()
    print("SOURCE DATASETS")
    print("-" * 70)

    print(
        f"Temporal rows:        {len(temporal)}"
    )

    print(
        f"Environmental rows:   {len(environmental)}"
    )

    print(
        f"Crop-yield rows:      {len(crop_yield)}"
    )

    print()
    print("ML DATASET")
    print("-" * 70)

    print(
        f"Rows:                 {len(dataset)}"
    )

    print(
        f"Columns:              {len(dataset.columns)}"
    )

    print()
    print("Years:")

    print(
        dataset["Year"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Districts:")
    print(
        dataset["District"].nunique()
    )

    print()
    print("Crops:")

    print(
        dataset["Crop"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Seasons:")

    print(
        dataset["Season"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Rows by crop and year:")

    print(
        dataset
        .groupby(["Year", "Crop"])
        .size()
        .to_string()
    )

    print()
    print("Yield statistics:")

    print(
        dataset["Yield_kg_ha"]
        .describe()
        .round(2)
        .to_string()
    )


def save_dataset(dataset):
    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataset.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print()
    print(
        f"Saved to: {OUTPUT_FILE}"
    )

    print(
        f"Rows: {len(dataset)}"
    )

    print(
        f"Columns: {len(dataset.columns)}"
    )


def main():
    print("=" * 70)
    print("BUILDING AGRICULTURAL ML DATASET")
    print("=" * 70)

    print()
    print(
        f"Integration period: {START_YEAR}-{END_YEAR}"
    )

    temporal, environmental, crop_yield = load_datasets()

    temporal = prepare_temporal(
        temporal
    )

    environmental = prepare_environmental(
        environmental
    )

    crop_yield = prepare_crop_yield(
        crop_yield
    )

    validate_source_data(
        temporal,
        environmental,
        crop_yield
    )

    check_temporal_alignment(
        temporal,
        environmental,
        crop_yield
    )

    dataset = build_dataset(
        temporal,
        environmental,
        crop_yield
    )

    dataset = create_engineered_features(
        dataset
    )

    validate_ml_dataset(
        dataset
    )

    print_summary(
        temporal,
        environmental,
        crop_yield,
        dataset
    )

    print_cross_crop_diagnostic(
        dataset
    )

    save_dataset(
        dataset
    )


if __name__ == "__main__":
    main()
