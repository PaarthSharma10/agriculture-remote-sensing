from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "combined_features.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "engineered_features.csv"
)


def calculate_changes(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.sort_values(
        [
            "District",
            "Year",
            "Season",
        ]
    ).copy()

    dataframe["NDVI_Change"] = (
        dataframe
        .groupby("District")["NDVI"]
        .diff()
    )

    dataframe["NDWI_Change"] = (
        dataframe
        .groupby("District")["NDWI"]
        .diff()
    )

    dataframe["EVI_Change"] = (
        dataframe
        .groupby("District")["EVI"]
        .diff()
    )

    return dataframe


def calculate_anomalies(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.copy()

    environmental_columns = [
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture",
    ]

    for column in environmental_columns:

        mean_column = (
            dataframe
            .groupby("District")[column]
            .transform("mean")
        )

        dataframe[f"{column}_Anomaly"] = (
            dataframe[column] - mean_column
        )

    return dataframe


def calculate_vegetation_anomalies(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.copy()

    vegetation_columns = [
        "NDVI",
        "NDWI",
        "EVI",
    ]

    for column in vegetation_columns:

        mean_column = (
            dataframe
            .groupby("District")[column]
            .transform("mean")
        )

        dataframe[f"{column}_Anomaly"] = (
            dataframe[column] - mean_column
        )

    return dataframe


def calculate_environmental_stress(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.copy()

    dataframe["Rainfall_Deficit"] = (
        -dataframe["Rainfall_mm_Anomaly"]
    ).clip(lower=0)

    dataframe["Temperature_Stress"] = (
        dataframe["Temperature_C_Anomaly"]
        .clip(lower=0)
    )

    dataframe["Soil_Moisture_Deficit"] = (
        -dataframe["Soil_Moisture_Anomaly"]
    ).clip(lower=0)

    return dataframe


def encode_season(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.copy()

    dataframe["Season_Encoded"] = (
        dataframe["Season"]
        .map(
            {
                "Rabi": 0,
                "Kharif": 1,
            }
        )
    )

    return dataframe


def validate_features(
    dataframe: pd.DataFrame,
) -> None:

    print()
    print("=" * 60)
    print("FEATURE ENGINEERING VALIDATION")
    print("=" * 60)

    print()
    print(f"Rows: {len(dataframe)}")
    print(f"Columns: {len(dataframe.columns)}")

    print()
    print("Missing values:")

    print(dataframe.isna().sum())

    print()

    if len(dataframe) != 30:
        raise ValueError(
            f"Expected 30 rows, found {len(dataframe)}."
        )

    required_columns = [
        "NDVI_Change",
        "NDWI_Change",
        "EVI_Change",
        "Rainfall_mm_Anomaly",
        "Temperature_C_Anomaly",
        "Soil_Moisture_Anomaly",
        "NDVI_Anomaly",
        "NDWI_Anomaly",
        "EVI_Anomaly",
        "Rainfall_Deficit",
        "Temperature_Stress",
        "Soil_Moisture_Deficit",
        "Season_Encoded",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing engineered columns: "
            + ", ".join(missing_columns)
        )

    print(
        "Feature engineering validation passed."
    )


def main() -> None:

    print("=" * 60)
    print("AGRICULTURAL FEATURE ENGINEERING")
    print("=" * 60)

    print()
    print("Loading combined dataset...")

    dataframe = pd.read_csv(
        INPUT_FILE,
    )

    print(
        f"Rows loaded: {len(dataframe)}"
    )

    print()
    print("Calculating vegetation changes...")

    dataframe = calculate_changes(
        dataframe,
    )

    print(
        "Calculating environmental anomalies..."
    )

    dataframe = calculate_anomalies(
        dataframe,
    )

    print(
        "Calculating vegetation anomalies..."
    )

    dataframe = calculate_vegetation_anomalies(
        dataframe,
    )

    print(
        "Calculating environmental stress features..."
    )

    dataframe = calculate_environmental_stress(
        dataframe,
    )

    print(
        "Encoding seasons..."
    )

    dataframe = encode_season(
        dataframe,
    )

    validate_features(
        dataframe,
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print(
        "Engineered dataset generated successfully."
    )

    print(
        f"Rows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print(
        f"Saved to: {OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()
