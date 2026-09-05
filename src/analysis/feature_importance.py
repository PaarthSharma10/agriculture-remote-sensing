from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

MODEL_FILE = (
    PROJECT_ROOT
    / "data"
    / "models"
    / "final_agricultural_yield_model.joblib"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "feature_importance"
)

TARGET = "Yield_kg_ha"

FEATURES = [
    "Crop",
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


def load_dataset():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}"
        )

    dataset = pd.read_csv(DATA_FILE)

    required_columns = FEATURES + [TARGET]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataset.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    if dataset[required_columns].isnull().any().any():
        raise ValueError(
            "Missing values detected in required columns."
        )

    return dataset


def load_model():
    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_FILE}"
        )

    return joblib.load(MODEL_FILE)


def extract_feature_importance(model):
    if not hasattr(model, "named_steps"):
        raise ValueError(
            "Loaded object is not a scikit-learn pipeline."
        )

    if "preprocessor" not in model.named_steps:
        raise ValueError(
            "Pipeline does not contain a preprocessor."
        )

    if "model" not in model.named_steps:
        raise ValueError(
            "Pipeline does not contain a model."
        )

    preprocessor = model.named_steps["preprocessor"]
    estimator = model.named_steps["model"]

    if not hasattr(estimator, "feature_importances_"):
        raise ValueError(
            "Final model does not provide feature importances."
        )

    transformed_names = (
        preprocessor
        .get_feature_names_out()
    )

    importances = estimator.feature_importances_

    if len(transformed_names) != len(importances):
        raise ValueError(
            "Feature names and feature importance lengths do not match."
        )

    importance = pd.DataFrame(
        {
            "Transformed_Feature": transformed_names,
            "Importance": importances
        }
    )

    importance["Feature"] = (
        importance["Transformed_Feature"]
        .str.replace(
            "categorical__",
            "",
            regex=False
        )
        .str.replace(
            "numerical__",
            "",
            regex=False
        )
    )

    importance["Feature"] = (
        importance["Feature"]
        .str.replace(
            r"^Crop_",
            "Crop: ",
            regex=True
        )
    )

    importance = importance.sort_values(
        "Importance",
        ascending=False
    ).reset_index(drop=True)

    return importance


def aggregate_feature_importance(importance):
    aggregated = []

    for feature in FEATURES:
        if feature == "Crop":
            mask = importance["Feature"].str.startswith(
                "Crop: "
            )
        else:
            mask = importance["Feature"].eq(feature)

        total_importance = importance.loc[
            mask,
            "Importance"
        ].sum()

        aggregated.append(
            {
                "Feature": feature,
                "Importance": total_importance
            }
        )

    result = pd.DataFrame(
        aggregated
    )

    result = result.sort_values(
        "Importance",
        ascending=False
    ).reset_index(drop=True)

    total = result["Importance"].sum()

    if total > 0:
        result["Importance_Percent"] = (
            result["Importance"]
            / total
            * 100
        )
    else:
        result["Importance_Percent"] = 0.0

    return result


def save_results(
    detailed_importance,
    aggregated_importance
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    detailed_file = (
        OUTPUT_DIR
        / "detailed_feature_importance.csv"
    )

    aggregated_file = (
        OUTPUT_DIR
        / "feature_importance.csv"
    )

    detailed_importance.to_csv(
        detailed_file,
        index=False
    )

    aggregated_importance.to_csv(
        aggregated_file,
        index=False
    )

    return detailed_file, aggregated_file


def create_plot(aggregated_importance):
    plot_data = (
        aggregated_importance
        .sort_values(
            "Importance"
        )
    )

    plt.figure(
        figsize=(10, 7)
    )

    plt.barh(
        plot_data["Feature"],
        plot_data["Importance"]
    )

    plt.xlabel(
        "Feature Importance"
    )

    plt.ylabel(
        "Feature"
    )

    plt.title(
        "Extra Trees Feature Importance"
    )

    plt.tight_layout()

    plot_file = (
        OUTPUT_DIR
        / "feature_importance.png"
    )

    plt.savefig(
        plot_file,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    return plot_file


def print_results(
    aggregated_importance,
    detailed_importance
):
    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE ANALYSIS")
    print("=" * 70)

    print()
    print(
        f"Transformed features: "
        f"{len(detailed_importance)}"
    )

    print(
        f"Original features: "
        f"{len(aggregated_importance)}"
    )

    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE")
    print("=" * 70)

    display_data = aggregated_importance.copy()

    display_data["Importance"] = (
        display_data["Importance"]
        .round(6)
    )

    display_data["Importance_Percent"] = (
        display_data["Importance_Percent"]
        .round(2)
    )

    print(
        display_data.to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("TOP FEATURES")
    print("=" * 70)

    top_features = aggregated_importance.head(5)

    for position, row in enumerate(
        top_features.itertuples(),
        start=1
    ):
        print(
            f"{position}. "
            f"{row.Feature}: "
            f"{row.Importance_Percent:.2f}%"
        )

    print()
    print("=" * 70)
    print("CROP ENCODING IMPORTANCE")
    print("=" * 70)

    crop_features = detailed_importance[
        detailed_importance["Feature"].str.startswith(
            "Crop: "
        )
    ].copy()

    if crop_features.empty:
        print(
            "No encoded crop features found."
        )
    else:
        crop_features = crop_features[
            [
                "Feature",
                "Importance"
            ]
        ].copy()

        crop_features["Importance"] = (
            crop_features["Importance"]
            .round(6)
        )

        print(
            crop_features.to_string(
                index=False
            )
        )


def main():
    print("=" * 70)
    print("AGRICULTURAL YIELD FEATURE IMPORTANCE")
    print("=" * 70)

    print()

    dataset = load_dataset()

    print(
        f"Rows loaded: {len(dataset)}"
    )

    print(
        f"Features analyzed: {len(FEATURES)}"
    )

    model = load_model()

    print(
        f"Model loaded: {MODEL_FILE}"
    )

    detailed_importance = extract_feature_importance(
        model
    )

    aggregated_importance = (
        aggregate_feature_importance(
            detailed_importance
        )
    )

    detailed_file, aggregated_file = save_results(
        detailed_importance,
        aggregated_importance
    )

    plot_file = create_plot(
        aggregated_importance
    )

    print_results(
        aggregated_importance,
        detailed_importance
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print()
    print(
        f"Detailed importance: "
        f"{detailed_file}"
    )

    print(
        f"Aggregated importance: "
        f"{aggregated_file}"
    )

    print(
        f"Plot: "
        f"{plot_file}"
    )

    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
