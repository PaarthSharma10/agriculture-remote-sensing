from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "data" / "engineered_features.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "ml_dataset.csv"


TARGET = "NDVI"


def load_data():
    print("Loading engineered dataset...")
    dataframe = pd.read_csv(INPUT_FILE)

    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def prepare_features(dataframe):
    print("\nPreparing machine learning features...")

    dataframe = dataframe.copy()

    dataframe["Season"] = dataframe["Season"].map(
        {
            "Rabi": 0,
            "Kharif": 1
        }
    )

    dataframe = pd.get_dummies(
        dataframe,
        columns=["District"],
        dtype=int
    )

    dataframe = dataframe.sort_values(
        ["Year", "Season"]
    ).reset_index(drop=True)

    return dataframe


def handle_missing_values(dataframe):
    print("\nHandling missing values...")

    change_columns = [
        "NDVI_Change",
        "NDWI_Change",
        "EVI_Change"
    ]

    for column in change_columns:
        dataframe[column] = dataframe[column].fillna(0)

    return dataframe


def select_features(dataframe):
    print("\nSelecting machine learning features...")

    feature_columns = [
        "Year",
        "Season",
        "Image_Count",
        "NDWI",
        "EVI",
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture",
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
        "Soil_Moisture_Deficit"
    ]

    district_columns = [
        column
        for column in dataframe.columns
        if column.startswith("District_")
    ]

    feature_columns.extend(district_columns)

    selected_columns = feature_columns + [TARGET]

    return dataframe[selected_columns]


def validate_dataset(dataframe):
    print("\n" + "=" * 60)
    print("MACHINE LEARNING DATASET VALIDATION")
    print("=" * 60)

    print(f"\nRows: {len(dataframe)}")
    print(f"Columns: {len(dataframe.columns)}")

    print("\nMissing values:")
    print(dataframe.isnull().sum())

    duplicate_count = dataframe.duplicated().sum()

    print(f"\nDuplicate rows: {duplicate_count}")

    if dataframe[TARGET].isnull().any():
        raise ValueError("Target column contains missing values.")

    if dataframe.isnull().sum().sum() > 0:
        raise ValueError("Dataset still contains missing values.")

    if duplicate_count > 0:
        raise ValueError("Dataset contains duplicate rows.")

    print("\nMachine learning dataset validation passed.")


def save_dataset(dataframe):
    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nMachine learning dataset generated successfully.")
    print(f"Rows: {len(dataframe)}")
    print(f"Columns: {len(dataframe.columns)}")
    print(f"Saved to: {OUTPUT_FILE}")


def main():
    print("=" * 60)
    print("MACHINE LEARNING DATASET PREPARATION")
    print("=" * 60)

    dataframe = load_data()

    dataframe = prepare_features(dataframe)

    dataframe = handle_missing_values(dataframe)

    dataframe = select_features(dataframe)

    validate_dataset(dataframe)

    save_dataset(dataframe)


if __name__ == "__main__":
    main()
