from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "features"
)

OUTPUT_FILE = (
    OUTPUT_DIR
    / "engineered_features.csv"
)

INDEX_COLUMNS = [
    "NDVI",
    "NDWI",
    "EVI",
]

GROUP_COLUMNS = [
    "District",
    "Season",
]

REQUIRED_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Start_Date",
    "End_Date",
    "Image_Count",
    "NDVI",
    "NDWI",
    "EVI",
]


def print_section(title):
    """Print a formatted section heading."""

    print()
    print("=" * 60)
    print(title)
    print("=" * 60)


def validate_input(dataframe):
    """Validate the input temporal dataset."""

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    if dataframe.empty:
        raise ValueError(
            "Input temporal dataset is empty."
        )


def add_temporal_features(dataframe):
    """Create year-to-year temporal vegetation features."""

    dataframe = dataframe.sort_values(
        GROUP_COLUMNS + ["Year"]
    ).copy()

    for column in INDEX_COLUMNS:
        dataframe[f"{column}_change"] = (
            dataframe
            .groupby(GROUP_COLUMNS)[column]
            .diff()
        )

        dataframe[f"{column}_relative_change"] = (
            dataframe[f"{column}_change"]
            / dataframe[column].shift(1)
        )

        dataframe[f"{column}_rolling_mean"] = (
            dataframe
            .groupby(GROUP_COLUMNS)[column]
            .transform(
                lambda series: series.rolling(
                    window=3,
                    min_periods=1,
                ).mean()
            )
        )

    return dataframe


def add_index_relationships(dataframe):
    """Create vegetation-index relationship features."""

    dataframe["NDVI_NDWI_ratio"] = (
        dataframe["NDVI"]
        / dataframe["NDWI"]
    )

    dataframe["EVI_NDVI_ratio"] = (
        dataframe["EVI"]
        / dataframe["NDVI"]
    )

    dataframe["EVI_NDWI_ratio"] = (
        dataframe["EVI"]
        / dataframe["NDWI"]
    )

    dataframe["NDVI_NDWI_difference"] = (
        dataframe["NDVI"]
        - dataframe["NDWI"]
    )

    dataframe["EVI_NDVI_difference"] = (
        dataframe["EVI"]
        - dataframe["NDVI"]
    )

    return dataframe


def add_seasonal_features(dataframe):
    """Create season-based agricultural features."""

    dataframe["Season_Code"] = (
        dataframe["Season"]
        .map(
            {
                "Rabi": 0,
                "Kharif": 1,
            }
        )
    )

    dataframe["Year_Index"] = (
        dataframe["Year"] - 2021
    )

    return dataframe


def clean_features(dataframe):
    """Clean generated feature values."""

    dataframe = dataframe.replace(
        [float("inf"), float("-inf")],
        pd.NA,
    )

    return dataframe


def main():
    """Generate machine-learning features from temporal Sentinel-2 data."""

    print("=" * 60)
    print("SENTINEL-2 FEATURE ENGINEERING")
    print("=" * 60)

    print("\nInput dataset:")
    print(INPUT_FILE)

    print("\nOutput dataset:")
    print(OUTPUT_FILE)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Temporal dataset not found:\n{INPUT_FILE}"
        )

    dataframe = pd.read_csv(INPUT_FILE)

    print(f"\nRows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    print_section("INPUT VALIDATION")

    validate_input(dataframe)

    print("Required columns: PASS")
    print(f"Input rows: {len(dataframe)}")

    dataframe["Year"] = pd.to_numeric(
        dataframe["Year"],
        errors="coerce",
    )

    for column in INDEX_COLUMNS:
        dataframe[column] = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

    if dataframe["Year"].isna().any():
        raise ValueError(
            "Invalid Year values detected."
        )

    if dataframe[INDEX_COLUMNS].isna().any().any():
        raise ValueError(
            "Missing vegetation-index values detected."
        )

    print("Numeric conversion: PASS")
    print("Vegetation-index completeness: PASS")

    print_section("TEMPORAL FEATURE GENERATION")

    dataframe = add_temporal_features(
        dataframe
    )

    temporal_columns = [
        "NDVI_change",
        "NDVI_relative_change",
        "NDVI_rolling_mean",
        "NDWI_change",
        "NDWI_relative_change",
        "NDWI_rolling_mean",
        "EVI_change",
        "EVI_relative_change",
        "EVI_rolling_mean",
    ]

    print(
        f"Temporal features created: "
        f"{len(temporal_columns)}"
    )

    for column in temporal_columns:
        print(f"    - {column}")

    print_section("INDEX RELATIONSHIP FEATURES")

    dataframe = add_index_relationships(
        dataframe
    )

    relationship_columns = [
        "NDVI_NDWI_ratio",
        "EVI_NDVI_ratio",
        "EVI_NDWI_ratio",
        "NDVI_NDWI_difference",
        "EVI_NDVI_difference",
    ]

    print(
        f"Relationship features created: "
        f"{len(relationship_columns)}"
    )

    for column in relationship_columns:
        print(f"    - {column}")

    print_section("SEASONAL FEATURES")

    dataframe = add_seasonal_features(
        dataframe
    )

    seasonal_columns = [
        "Season_Code",
        "Year_Index",
    ]

    print(
        f"Seasonal features created: "
        f"{len(seasonal_columns)}"
    )

    for column in seasonal_columns:
        print(f"    - {column}")

    print_section("FEATURE CLEANING")

    dataframe = clean_features(
        dataframe
    )

    print(
        "Infinite values replaced: PASS"
    )

    print_section("ENGINEERED DATASET")

    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print(
        f"New features: "
        f"{len(dataframe.columns) - len(REQUIRED_COLUMNS)}"
    )

    missing_features = dataframe.isna().sum()

    generated_missing = (
        missing_features[
            missing_features > 0
        ]
    )

    print("\nMissing values introduced:")

    if generated_missing.empty:
        print("    None")
    else:
        print(
            generated_missing.to_string()
        )

    print_section("FEATURE STATISTICS")

    feature_columns = [
        column
        for column in dataframe.columns
        if column not in REQUIRED_COLUMNS
    ]

    statistics = (
        dataframe[feature_columns]
        .describe()
        .T
        .round(4)
    )

    print(
        statistics.to_string()
    )

    print_section("FEATURE CORRELATION")

    correlation_columns = [
        "NDVI",
        "NDWI",
        "EVI",
        "NDVI_change",
        "NDWI_change",
        "EVI_change",
    ]

    correlation = (
        dataframe[
            correlation_columns
        ]
        .corr()
        .round(4)
    )

    print(
        correlation.to_string()
    )

    print_section("OUTPUT VALIDATION")

    if len(dataframe) == 100:
        print("Row count: PASS")
    else:
        print(
            f"Row count: WARNING — "
            f"{len(dataframe)}"
        )

    if not dataframe["District"].isna().any():
        print("District completeness: PASS")
    else:
        print("District completeness: WARNING")

    if not dataframe["Year"].isna().any():
        print("Year completeness: PASS")
    else:
        print("Year completeness: WARNING")

    if not dataframe["Season"].isna().any():
        print("Season completeness: PASS")
    else:
        print("Season completeness: WARNING")

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print_section("FEATURE ENGINEERING COMPLETED")

    print(
        f"Output saved to:\n{OUTPUT_FILE}"
    )

    print(
        f"\nRows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print(
        "\nFeature engineering completed successfully."
    )


if __name__ == "__main__":
    main()
