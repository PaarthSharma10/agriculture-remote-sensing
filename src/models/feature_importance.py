from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
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

RESULTS_PATH = OUTPUT_DIR / "feature_importance.csv"
PLOT_DIR = OUTPUT_DIR / "feature_importance_plots"

TARGET = "Yield_kg_ha"

FEATURE_COLUMNS = [
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

MINIMUM_SAMPLES = 10


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("AGRICULTURAL FEATURE IMPORTANCE ANALYSIS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def build_model(model_type):
    if model_type == "Random Forest":
        estimator = RandomForestRegressor(
            n_estimators=500,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1
        )
    else:
        estimator = ExtraTreesRegressor(
            n_estimators=500,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1
        )

    return Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "model",
                estimator
            )
        ]
    )


def calculate_importance(crop_dataframe, crop_name, model_type):
    sample_count = len(crop_dataframe)

    if sample_count < MINIMUM_SAMPLES:
        return []

    crop_dataframe = crop_dataframe.dropna(
        subset=[TARGET]
    ).copy()

    feature_data = crop_dataframe[
        FEATURE_COLUMNS
    ]

    target_data = crop_dataframe[
        TARGET
    ]

    model = build_model(model_type)

    model.fit(
        feature_data,
        target_data
    )

    estimator = model.named_steps["model"]

    importance_values = estimator.feature_importances_

    results = []

    for feature_name, importance in zip(
        FEATURE_COLUMNS,
        importance_values
    ):
        results.append(
            {
                "Crop": crop_name,
                "Model": model_type,
                "Feature": feature_name,
                "Importance": importance
            }
        )

    return results


def create_plot(
    importance_dataframe,
    crop_name,
    model_type
):
    crop_data = importance_dataframe[
        (
            importance_dataframe["Crop"] == crop_name
        )
        & (
            importance_dataframe["Model"] == model_type
        )
    ].sort_values(
        "Importance",
        ascending=True
    )

    if crop_data.empty:
        return

    PLOT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    plt.figure(
        figsize=(10, 7)
    )

    plt.barh(
        crop_data["Feature"],
        crop_data["Importance"]
    )

    plt.xlabel(
        "Feature Importance"
    )

    plt.ylabel(
        "Feature"
    )

    plt.title(
        f"{crop_name} - {model_type} Feature Importance"
    )

    plt.tight_layout()

    filename = (
        f"{crop_name.lower().replace(' ', '_')}_"
        f"{model_type.lower().replace(' ', '_')}.png"
    )

    plt.savefig(
        PLOT_DIR / filename,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_overall_plot(importance_dataframe):
    average_importance = (
        importance_dataframe
        .groupby("Feature")["Importance"]
        .mean()
        .sort_values()
    )

    if average_importance.empty:
        return

    PLOT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    plt.figure(
        figsize=(10, 7)
    )

    plt.barh(
        average_importance.index,
        average_importance.values
    )

    plt.xlabel(
        "Mean Feature Importance"
    )

    plt.ylabel(
        "Feature"
    )

    plt.title(
        "Overall Feature Importance"
    )

    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "overall_feature_importance.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def save_results(results):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    importance_dataframe = pd.DataFrame(
        results
    )

    importance_dataframe.to_csv(
        RESULTS_PATH,
        index=False
    )

    return importance_dataframe


def main():
    dataframe = load_dataset()

    print()
    print("=" * 70)
    print("CALCULATING FEATURE IMPORTANCE")
    print("=" * 70)

    results = []

    crops = sorted(
        dataframe["Crop"].dropna().unique()
    )

    model_types = [
        "Random Forest",
        "Extra Trees"
    ]

    for crop_name in crops:
        crop_dataframe = dataframe[
            dataframe["Crop"] == crop_name
        ].copy()

        sample_count = len(crop_dataframe)

        if sample_count < MINIMUM_SAMPLES:
            print(
                f"\nSkipping {crop_name}: "
                f"only {sample_count} observations"
            )
            continue

        print(
            f"\nProcessing {crop_name} "
            f"({sample_count} observations)..."
        )

        for model_type in model_types:
            print(
                f"  Calculating {model_type}..."
            )

            crop_results = calculate_importance(
                crop_dataframe,
                crop_name,
                model_type
            )

            results.extend(
                crop_results
            )

    if not results:
        print(
            "\nNo crops had enough observations."
        )
        return

    importance_dataframe = save_results(
        results
    )

    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE SUMMARY")
    print("=" * 70)

    for crop_name in sorted(
        importance_dataframe["Crop"].unique()
    ):
        crop_data = (
            importance_dataframe[
                importance_dataframe["Crop"] == crop_name
            ]
            .groupby("Feature")["Importance"]
            .mean()
            .sort_values(
                ascending=False
            )
        )

        print()
        print(crop_name)

        print(
            crop_data.head(10).to_string(
                float_format=lambda value: f"{value:.4f}"
            )
        )

    create_overall_plot(
        importance_dataframe
    )

    for crop_name in sorted(
        importance_dataframe["Crop"].unique()
    ):
        for model_type in model_types:
            create_plot(
                importance_dataframe,
                crop_name,
                model_type
            )

    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE ANALYSIS COMPLETED")
    print("=" * 70)

    print()
    print(
        f"Results saved to: {RESULTS_PATH}"
    )

    print(
        f"Plots saved to: {PLOT_DIR}"
    )


if __name__ == "__main__":
    main()
