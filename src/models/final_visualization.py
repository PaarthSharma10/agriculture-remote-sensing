from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data" / "features" / "ml_features.csv"
MODEL_PATH = PROJECT_ROOT / "data" / "models" / "final_model.joblib"
OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_visualizations"
)

TARGET = "Yield_kg_ha"

FEATURE_COLUMNS = [
    "District",
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


def load_data():
    dataframe = pd.read_csv(DATA_PATH)
    model = joblib.load(MODEL_PATH)

    print()
    print("=" * 70)
    print("FINAL ML VISUALIZATION")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe, model


def generate_predictions(dataframe, model):
    features = dataframe[FEATURE_COLUMNS].copy()

    predictions = model.predict(features)

    result = dataframe[
        [
            "District",
            "Year",
            "Season",
            "Crop",
            TARGET
        ]
    ].copy()

    result["Predicted_Yield_kg_ha"] = predictions

    result["Residual"] = (
        result[TARGET]
        - result["Predicted_Yield_kg_ha"]
    )

    result["Absolute_Error"] = (
        result["Residual"].abs()
    )

    return result


def plot_actual_vs_predicted(result):
    plt.figure(figsize=(10, 7))

    sns.scatterplot(
        data=result,
        x=TARGET,
        y="Predicted_Yield_kg_ha",
        hue="Crop",
        s=70
    )

    minimum = min(
        result[TARGET].min(),
        result["Predicted_Yield_kg_ha"].min()
    )

    maximum = max(
        result[TARGET].max(),
        result["Predicted_Yield_kg_ha"].max()
    )

    plt.plot(
        [minimum, maximum],
        [minimum, maximum],
        linestyle="--"
    )

    plt.xlabel("Actual Yield (kg/ha)")
    plt.ylabel("Predicted Yield (kg/ha)")
    plt.title("Actual vs Predicted Agricultural Yield")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "actual_vs_predicted.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_residual_distribution(result):
    plt.figure(figsize=(10, 7))

    sns.histplot(
        result["Residual"],
        bins=25,
        kde=True
    )

    plt.axvline(
        0,
        linestyle="--"
    )

    plt.xlabel("Residual (kg/ha)")
    plt.ylabel("Frequency")
    plt.title("Yield Prediction Residual Distribution")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "residual_distribution.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_residuals_vs_predictions(result):
    plt.figure(figsize=(10, 7))

    sns.scatterplot(
        data=result,
        x="Predicted_Yield_kg_ha",
        y="Residual",
        hue="Crop",
        s=70
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xlabel("Predicted Yield (kg/ha)")
    plt.ylabel("Residual (kg/ha)")
    plt.title("Residuals vs Predicted Yield")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "residuals_vs_predictions.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_crop_performance(result):
    crop_performance = (
        result.groupby("Crop")
        .agg(
            Actual_Mean=(TARGET, "mean"),
            Predicted_Mean=(
                "Predicted_Yield_kg_ha",
                "mean"
            )
        )
        .reset_index()
    )

    melted = crop_performance.melt(
        id_vars="Crop",
        value_vars=[
            "Actual_Mean",
            "Predicted_Mean"
        ],
        var_name="Type",
        value_name="Yield"
    )

    plt.figure(figsize=(12, 7))

    sns.barplot(
        data=melted,
        x="Crop",
        y="Yield",
        hue="Type"
    )

    plt.xlabel("Crop")
    plt.ylabel("Mean Yield (kg/ha)")
    plt.title("Actual vs Predicted Mean Yield by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_yield_comparison.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_year_performance(result):
    year_performance = (
        result.groupby("Year")
        .agg(
            Actual_Mean=(TARGET, "mean"),
            Predicted_Mean=(
                "Predicted_Yield_kg_ha",
                "mean"
            )
        )
        .reset_index()
    )

    melted = year_performance.melt(
        id_vars="Year",
        value_vars=[
            "Actual_Mean",
            "Predicted_Mean"
        ],
        var_name="Type",
        value_name="Yield"
    )

    plt.figure(figsize=(10, 7))

    sns.barplot(
        data=melted,
        x="Year",
        y="Yield",
        hue="Type"
    )

    plt.xlabel("Year")
    plt.ylabel("Mean Yield (kg/ha)")
    plt.title("Actual vs Predicted Mean Yield by Year")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "year_yield_comparison.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_season_performance(result):
    season_performance = (
        result.groupby("Season")
        .agg(
            Actual_Mean=(TARGET, "mean"),
            Predicted_Mean=(
                "Predicted_Yield_kg_ha",
                "mean"
            )
        )
        .reset_index()
    )

    melted = season_performance.melt(
        id_vars="Season",
        value_vars=[
            "Actual_Mean",
            "Predicted_Mean"
        ],
        var_name="Type",
        value_name="Yield"
    )

    plt.figure(figsize=(10, 7))

    sns.barplot(
        data=melted,
        x="Season",
        y="Yield",
        hue="Type"
    )

    plt.xlabel("Season")
    plt.ylabel("Mean Yield (kg/ha)")
    plt.title("Actual vs Predicted Mean Yield by Season")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "season_yield_comparison.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_prediction_error_by_crop(result):
    crop_error = (
        result.groupby("Crop")["Absolute_Error"]
        .mean()
        .sort_values(ascending=False)
        .reset_index()
    )

    plt.figure(figsize=(11, 7))

    sns.barplot(
        data=crop_error,
        x="Crop",
        y="Absolute_Error"
    )

    plt.xlabel("Crop")
    plt.ylabel("Mean Absolute Error (kg/ha)")
    plt.title("Prediction Error by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "prediction_error_by_crop.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def calculate_summary(result):
    mae = result["Absolute_Error"].mean()

    rmse = np.sqrt(
        np.mean(
            result["Residual"] ** 2
        )
    )

    actual = result[TARGET]
    predicted = result["Predicted_Yield_kg_ha"]

    ss_res = np.sum(
        (actual - predicted) ** 2
    )

    ss_tot = np.sum(
        (actual - actual.mean()) ** 2
    )

    r2 = 1 - (ss_res / ss_tot)

    summary = pd.DataFrame(
        [
            {
                "Samples": len(result),
                "MAE_kg_ha": mae,
                "RMSE_kg_ha": rmse,
                "R2": r2
            }
        ]
    )

    return summary


def save_predictions(result):
    path = (
        OUTPUT_DIR
        / "final_visualization_predictions.csv"
    )

    result.to_csv(
        path,
        index=False
    )

    return path


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe, model = load_data()

    result = generate_predictions(
        dataframe,
        model
    )

    print()
    print("=" * 70)
    print("GENERATING VISUALIZATIONS")
    print("=" * 70)

    plot_actual_vs_predicted(result)
    print("Created: actual_vs_predicted.png")

    plot_residual_distribution(result)
    print("Created: residual_distribution.png")

    plot_residuals_vs_predictions(result)
    print("Created: residuals_vs_predictions.png")

    plot_crop_performance(result)
    print("Created: crop_yield_comparison.png")

    plot_year_performance(result)
    print("Created: year_yield_comparison.png")

    plot_season_performance(result)
    print("Created: season_yield_comparison.png")

    plot_prediction_error_by_crop(result)
    print("Created: prediction_error_by_crop.png")

    summary = calculate_summary(result)

    summary_path = (
        OUTPUT_DIR
        / "final_model_summary.csv"
    )

    summary.to_csv(
        summary_path,
        index=False
    )

    predictions_path = save_predictions(
        result
    )

    print()
    print("=" * 70)
    print("FINAL MODEL SUMMARY")
    print("=" * 70)

    print()

    print(
        summary.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print(
        f"Predictions saved to: {predictions_path}"
    )

    print(
        f"Summary saved to: {summary_path}"
    )

    print(
        f"Plots saved to: {OUTPUT_DIR}"
    )

    print()
    print("=" * 70)
    print("FINAL ML VISUALIZATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
