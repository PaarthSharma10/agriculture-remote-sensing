from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
)

TARGET = "Yield_kg_ha"

FEATURES = [
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture",
    "NDVI_NDWI_ratio",
    "EVI_NDVI_ratio",
    "Vegetation_Water_Index",
    "Vegetation_Stress_Index",
    "Temperature_Rainfall_ratio",
    "Climate_Index"
]


def load_data():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}"
        )

    dataframe = pd.read_csv(
        INPUT_FILE
    )

    print(
        f"Rows loaded: {len(dataframe)}"
    )

    print(
        f"Columns loaded: {len(dataframe.columns)}"
    )

    return dataframe


def validate_data(dataframe):
    required_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        TARGET
    ] + FEATURES

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
            "Dataset is empty."
        )

    if dataframe[
        required_columns
    ].isnull().any().any():
        raise ValueError(
            "Missing values found."
        )


def calculate_correlations(dataframe):
    correlation = (
        dataframe[
            FEATURES + [TARGET]
        ]
        .corr(numeric_only=True)
    )

    target_correlation = (
        correlation[TARGET]
        .drop(TARGET)
        .sort_values(
            key=lambda values: values.abs(),
            ascending=False
        )
    )

    target_correlation = (
        target_correlation
        .rename("Correlation_with_Yield")
        .reset_index()
        .rename(
            columns={
                "index": "Feature"
            }
        )
    )

    return correlation, target_correlation


def save_correlation_results(
    correlation,
    target_correlation
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    correlation.to_csv(
        OUTPUT_DIR
        / "feature_correlation_matrix.csv"
    )

    target_correlation.to_csv(
        OUTPUT_DIR
        / "yield_feature_correlations.csv",
        index=False
    )


def create_correlation_plot(correlation):
    plt.figure(
        figsize=(12, 10)
    )

    plt.imshow(
        correlation,
        aspect="auto"
    )

    plt.xticks(
        range(len(correlation.columns)),
        correlation.columns,
        rotation=90
    )

    plt.yticks(
        range(len(correlation.index)),
        correlation.index
    )

    plt.colorbar(
        label="Correlation"
    )

    plt.title(
        "Agricultural ML Feature Correlation Matrix"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "feature_correlation_matrix.png",
        dpi=300
    )

    plt.close()


def create_yield_by_crop(dataframe):
    summary = (
        dataframe
        .groupby("Crop")[TARGET]
        .agg(
            [
                "count",
                "mean",
                "std",
                "min",
                "max"
            ]
        )
        .round(2)
    )

    summary.to_csv(
        OUTPUT_DIR
        / "yield_by_crop.csv"
    )

    print()
    print("Yield by crop:")
    print(
        summary.to_string()
    )


def create_yield_by_year(dataframe):
    summary = (
        dataframe
        .groupby("Year")[TARGET]
        .agg(
            [
                "count",
                "mean",
                "std",
                "min",
                "max"
            ]
        )
        .round(2)
    )

    summary.to_csv(
        OUTPUT_DIR
        / "yield_by_year.csv"
    )

    print()
    print("Yield by year:")
    print(
        summary.to_string()
    )


def create_feature_by_crop(dataframe):
    summary = (
        dataframe
        .groupby("Crop")[FEATURES]
        .mean()
        .round(4)
    )

    summary.to_csv(
        OUTPUT_DIR
        / "features_by_crop.csv"
    )

    print()
    print("Average features by crop:")
    print(
        summary.to_string()
    )


def create_yield_distribution(dataframe):
    plt.figure(
        figsize=(10, 6)
    )

    dataframe.boxplot(
        column=TARGET,
        by="Crop"
    )

    plt.title(
        "Yield Distribution by Crop"
    )

    plt.suptitle("")

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "Yield (kg/ha)"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "yield_distribution_by_crop.png",
        dpi=300
    )

    plt.close()


def create_feature_scatter_plots(dataframe):
    selected_features = [
        "NDVI",
        "NDWI",
        "EVI",
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture"
    ]

    for feature in selected_features:
        plt.figure(
            figsize=(8, 6)
        )

        plt.scatter(
            dataframe[feature],
            dataframe[TARGET]
        )

        plt.xlabel(
            feature
        )

        plt.ylabel(
            "Yield (kg/ha)"
        )

        plt.title(
            f"{feature} vs Yield"
        )

        plt.tight_layout()

        filename = (
            feature.lower()
            .replace(" ", "_")
            + "_vs_yield.png"
        )

        plt.savefig(
            OUTPUT_DIR / filename,
            dpi=300
        )

        plt.close()


def print_correlation_summary(
    target_correlation
):
    print()
    print("=" * 70)
    print("FEATURE CORRELATION WITH YIELD")
    print("=" * 70)

    print()
    print(
        target_correlation.to_string(
            index=False
        )
    )

    print()
    print(
        "Correlation results saved."
    )


def main():
    print("=" * 70)
    print("AGRICULTURAL ML EXPLORATORY DATA ANALYSIS")
    print("=" * 70)

    dataframe = load_data()

    validate_data(
        dataframe
    )

    correlation, target_correlation = (
        calculate_correlations(
            dataframe
        )
    )

    save_correlation_results(
        correlation,
        target_correlation
    )

    create_correlation_plot(
        correlation
    )

    create_yield_by_crop(
        dataframe
    )

    create_yield_by_year(
        dataframe
    )

    create_feature_by_crop(
        dataframe
    )

    create_yield_distribution(
        dataframe
    )

    create_feature_scatter_plots(
        dataframe
    )

    print_correlation_summary(
        target_correlation
    )

    print()
    print("=" * 70)
    print("ML EDA COMPLETED")
    print("=" * 70)

    print()
    print(
        f"Results saved to: {OUTPUT_DIR}"
    )


if __name__ == "__main__":
    main()
