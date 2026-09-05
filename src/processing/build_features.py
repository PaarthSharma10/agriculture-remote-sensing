from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "ml"
    / "ml_dataset.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

FEATURE_COLUMNS = [
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture"
]

IDENTIFIER_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop"
]

TARGET_COLUMN = "Yield_kg_ha"


def load_dataset():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input dataset not found: {INPUT_FILE}"
        )

    dataframe = pd.read_csv(INPUT_FILE)

    print(
        f"Rows loaded: {len(dataframe)}"
    )

    print(
        f"Columns loaded: {len(dataframe.columns)}"
    )

    return dataframe


def validate_input(dataframe):
    required_columns = (
        IDENTIFIER_COLUMNS
        + FEATURE_COLUMNS
        + [TARGET_COLUMN]
    )

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
            "Input dataset is empty."
        )

    if dataframe[
        required_columns
    ].isnull().any().any():
        missing = dataframe[
            required_columns
        ].isnull().sum()

        raise ValueError(
            f"Missing values found:\n"
            f"{missing[missing > 0]}"
        )

    if (
        dataframe[FEATURE_COLUMNS]
        .apply(
            pd.to_numeric,
            errors="coerce"
        )
        .isnull()
        .any()
        .any()
    ):
        raise ValueError(
            "Non-numeric values found in "
            "feature columns."
        )

    if (
        pd.to_numeric(
            dataframe[TARGET_COLUMN],
            errors="coerce"
        )
        .isnull()
        .any()
    ):
        raise ValueError(
            "Invalid values found in target column."
        )

    if (
        dataframe[TARGET_COLUMN] <= 0
    ).any():
        raise ValueError(
            "Non-positive yield values found."
        )


def engineer_features(dataframe):
    features = dataframe[
        IDENTIFIER_COLUMNS
        + FEATURE_COLUMNS
        + [TARGET_COLUMN]
    ].copy()

    for column in FEATURE_COLUMNS:
        features[column] = pd.to_numeric(
            features[column],
            errors="raise"
        )

    features[TARGET_COLUMN] = pd.to_numeric(
        features[TARGET_COLUMN],
        errors="raise"
    )

    features["NDVI_NDWI_ratio"] = (
        features["NDVI"]
        / features["NDWI"].replace(0, pd.NA)
    )

    features["EVI_NDVI_ratio"] = (
        features["EVI"]
        / features["NDVI"].replace(0, pd.NA)
    )

    features["Vegetation_Water_Index"] = (
        features["NDVI"]
        * features["NDWI"]
    )

    features["Vegetation_Stress_Index"] = (
        features["EVI"]
        - features["NDVI"]
    )

    features["Temperature_Rainfall_ratio"] = (
        features["Temperature_C"]
        / features["Rainfall_mm"].replace(
            0,
            pd.NA
        )
    )

    features["Climate_Index"] = (
        features["Rainfall_mm"]
        * features["Soil_Moisture"]
    )

    return features


def validate_engineered_features(dataframe):
    engineered_columns = [
        "NDVI_NDWI_ratio",
        "EVI_NDVI_ratio",
        "Vegetation_Water_Index",
        "Vegetation_Stress_Index",
        "Temperature_Rainfall_ratio",
        "Climate_Index"
    ]

    required_columns = (
        IDENTIFIER_COLUMNS
        + FEATURE_COLUMNS
        + engineered_columns
        + [TARGET_COLUMN]
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing engineered columns: "
            f"{missing_columns}"
        )

    if dataframe.empty:
        raise ValueError(
            "Engineered dataset is empty."
        )

    numeric_columns = (
        FEATURE_COLUMNS
        + engineered_columns
        + [TARGET_COLUMN]
    )

    invalid_values = dataframe[
        numeric_columns
    ].isnull().sum()

    if invalid_values.any():
        print()
        print(
            "Warning: engineered features "
            "contain missing values:"
        )
        print(
            invalid_values[
                invalid_values > 0
            ]
        )

    duplicate_count = dataframe.duplicated(
        subset=IDENTIFIER_COLUMNS
    ).sum()

    if duplicate_count > 0:
        raise ValueError(
            f"Duplicate observations found: "
            f"{duplicate_count}"
        )


def print_summary(dataframe):
    engineered_columns = [
        "NDVI_NDWI_ratio",
        "EVI_NDVI_ratio",
        "Vegetation_Water_Index",
        "Vegetation_Stress_Index",
        "Temperature_Rainfall_ratio",
        "Climate_Index"
    ]

    print()
    print("=" * 70)
    print("FEATURE ENGINEERING SUMMARY")
    print("=" * 70)

    print()
    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print()
    print("Predictive features:")
    for column in FEATURE_COLUMNS:
        print(
            f"  - {column}"
        )

    print()
    print("Engineered features:")
    for column in engineered_columns:
        print(
            f"  - {column}"
        )

    print()
    print(
        f"Target: {TARGET_COLUMN}"
    )

    print()
    print("Feature statistics:")
    print(
        dataframe[
            FEATURE_COLUMNS
            + engineered_columns
        ]
        .describe()
        .round(4)
        .to_string()
    )

    print()
    print("Target statistics:")
    print(
        dataframe[TARGET_COLUMN]
        .describe()
        .round(2)
        .to_string()
    )

    print()
    print("Rows by crop:")
    print(
        dataframe["Crop"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Rows by year:")
    print(
        dataframe["Year"]
        .value_counts()
        .sort_index()
        .to_string()
    )


def save_dataset(dataframe):
    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 70)
    print("FEATURE DATASET SAVED")
    print("=" * 70)

    print()
    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )


def main():
    print("=" * 70)
    print("AGRICULTURAL ML FEATURE ENGINEERING")
    print("=" * 70)

    dataframe = load_dataset()

    validate_input(
        dataframe
    )

    features = engineer_features(
        dataframe
    )

    validate_engineered_features(
        features
    )

    print_summary(
        features
    )

    save_dataset(
        features
    )


if __name__ == "__main__":
    main()
