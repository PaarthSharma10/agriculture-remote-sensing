from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

MODEL_PATH = (
    PROJECT_ROOT
    / "data"
    / "models"
    / "best_model.joblib"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
)

DIAGNOSTICS_PATH = (
    OUTPUT_DIR
    / "model_diagnostics.csv"
)

PREDICTIONS_PATH = (
    OUTPUT_DIR
    / "model_predictions.csv"
)

PLOT_DIR = (
    OUTPUT_DIR
    / "diagnostic_plots"
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
    dataframe = pd.read_csv(INPUT_PATH)
    model = joblib.load(MODEL_PATH)

    print()
    print("=" * 70)
    print("AGRICULTURAL MODEL DIAGNOSTICS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe, model


def prepare_features(dataframe):
    missing_columns = [
        column
        for column in FEATURE_COLUMNS
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required feature columns: {missing_columns}"
        )

    return dataframe[FEATURE_COLUMNS].copy()


def calculate_metrics(actual, predicted):
    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    r2 = r2_score(
        actual,
        predicted
    )

    return mae, rmse, r2


def evaluate_overall(dataframe, model):
    features = prepare_features(dataframe)
    actual = dataframe[TARGET].copy()

    predicted = model.predict(features)

    mae, rmse, r2 = calculate_metrics(
        actual,
        predicted
    )

    print()
    print("=" * 70)
    print("OVERALL MODEL PERFORMANCE")
    print("=" * 70)

    print()
    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R2:   {r2:.4f}")

    return predicted


def build_prediction_dataframe(dataframe, predicted):
    prediction_dataframe = dataframe[
        [
            "District",
            "Year",
            "Season",
            "Crop",
            TARGET
        ]
    ].copy()

    prediction_dataframe["Predicted_Yield_kg_ha"] = predicted

    prediction_dataframe["Residual"] = (
        prediction_dataframe[TARGET]
        - prediction_dataframe["Predicted_Yield_kg_ha"]
    )

    prediction_dataframe["Absolute_Error"] = (
        prediction_dataframe["Residual"].abs()
    )

    prediction_dataframe["Percentage_Error"] = (
        prediction_dataframe["Absolute_Error"]
        / prediction_dataframe[TARGET].replace(0, np.nan)
        * 100
    )

    return prediction_dataframe


def evaluate_by_crop(prediction_dataframe):
    results = []

    for crop, crop_data in prediction_dataframe.groupby("Crop"):
        actual = crop_data[TARGET]
        predicted = crop_data["Predicted_Yield_kg_ha"]

        mae, rmse, r2 = calculate_metrics(
            actual,
            predicted
        )

        results.append(
            {
                "Crop": crop,
                "Samples": len(crop_data),
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

    results_dataframe = pd.DataFrame(results)

    return results_dataframe


def evaluate_by_year(prediction_dataframe):
    results = []

    for year, year_data in prediction_dataframe.groupby("Year"):
        actual = year_data[TARGET]
        predicted = year_data["Predicted_Yield_kg_ha"]

        mae, rmse, r2 = calculate_metrics(
            actual,
            predicted
        )

        results.append(
            {
                "Year": year,
                "Samples": len(year_data),
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

    return pd.DataFrame(results)


def evaluate_by_season(prediction_dataframe):
    results = []

    for season, season_data in prediction_dataframe.groupby("Season"):
        actual = season_data[TARGET]
        predicted = season_data["Predicted_Yield_kg_ha"]

        mae, rmse, r2 = calculate_metrics(
            actual,
            predicted
        )

        results.append(
            {
                "Season": season,
                "Samples": len(season_data),
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

    return pd.DataFrame(results)


def calculate_residual_statistics(prediction_dataframe):
    residuals = prediction_dataframe["Residual"]

    statistics = {
        "Mean_Residual": residuals.mean(),
        "Std_Residual": residuals.std(),
        "Minimum_Residual": residuals.min(),
        "Maximum_Residual": residuals.max(),
        "Mean_Absolute_Error": prediction_dataframe[
            "Absolute_Error"
        ].mean(),
        "Maximum_Absolute_Error": prediction_dataframe[
            "Absolute_Error"
        ].max(),
        "Mean_Percentage_Error": prediction_dataframe[
            "Percentage_Error"
        ].mean()
    }

    return statistics


def create_actual_vs_predicted_plot(prediction_dataframe):
    PLOT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    actual = prediction_dataframe[TARGET]
    predicted = prediction_dataframe["Predicted_Yield_kg_ha"]

    plt.figure(
        figsize=(9, 7)
    )

    plt.scatter(
        actual,
        predicted,
        alpha=0.7
    )

    minimum = min(
        actual.min(),
        predicted.min()
    )

    maximum = max(
        actual.max(),
        predicted.max()
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

    output_path = (
        PLOT_DIR
        / "actual_vs_predicted.png"
    )

    plt.savefig(
        output_path,
        dpi=300
    )

    plt.close()


def create_residual_plot(prediction_dataframe):
    PLOT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    predicted = prediction_dataframe[
        "Predicted_Yield_kg_ha"
    ]

    residuals = prediction_dataframe[
        "Residual"
    ]

    plt.figure(
        figsize=(9, 7)
    )

    plt.scatter(
        predicted,
        residuals,
        alpha=0.7
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xlabel("Predicted Yield (kg/ha)")
    plt.ylabel("Residual (kg/ha)")
    plt.title("Residuals vs Predicted Yield")
    plt.tight_layout()

    output_path = (
        PLOT_DIR
        / "residuals_vs_predicted.png"
    )

    plt.savefig(
        output_path,
        dpi=300
    )

    plt.close()


def create_error_distribution_plot(prediction_dataframe):
    PLOT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    residuals = prediction_dataframe[
        "Residual"
    ]

    plt.figure(
        figsize=(9, 7)
    )

    plt.hist(
        residuals,
        bins=20
    )

    plt.xlabel("Residual (kg/ha)")
    plt.ylabel("Frequency")
    plt.title("Yield Prediction Error Distribution")
    plt.tight_layout()

    output_path = (
        PLOT_DIR
        / "residual_distribution.png"
    )

    plt.savefig(
        output_path,
        dpi=300
    )

    plt.close()


def save_diagnostics(
    overall_metrics,
    crop_results,
    year_results,
    season_results,
    residual_statistics
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    rows = [
        {
            "Analysis": "Overall",
            "Group": "All",
            "Samples": overall_metrics["Samples"],
            "MAE": overall_metrics["MAE"],
            "RMSE": overall_metrics["RMSE"],
            "R2": overall_metrics["R2"]
        }
    ]

    for _, row in crop_results.iterrows():
        rows.append(
            {
                "Analysis": "Crop",
                "Group": row["Crop"],
                "Samples": row["Samples"],
                "MAE": row["MAE"],
                "RMSE": row["RMSE"],
                "R2": row["R2"]
            }
        )

    for _, row in year_results.iterrows():
        rows.append(
            {
                "Analysis": "Year",
                "Group": row["Year"],
                "Samples": row["Samples"],
                "MAE": row["MAE"],
                "RMSE": row["RMSE"],
                "R2": row["R2"]
            }
        )

    for _, row in season_results.iterrows():
        rows.append(
            {
                "Analysis": "Season",
                "Group": row["Season"],
                "Samples": row["Samples"],
                "MAE": row["MAE"],
                "RMSE": row["RMSE"],
                "R2": row["R2"]
            }
        )

    diagnostics_dataframe = pd.DataFrame(rows)

    diagnostics_dataframe.to_csv(
        DIAGNOSTICS_PATH,
        index=False
    )

    residual_dataframe = pd.DataFrame(
        [residual_statistics]
    )

    residual_path = (
        OUTPUT_DIR
        / "residual_statistics.csv"
    )

    residual_dataframe.to_csv(
        residual_path,
        index=False
    )


def print_results(
    crop_results,
    year_results,
    season_results,
    residual_statistics
):
    print()
    print("=" * 70)
    print("PERFORMANCE BY CROP")
    print("=" * 70)

    print()
    print(
        crop_results.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print("=" * 70)
    print("PERFORMANCE BY YEAR")
    print("=" * 70)

    print()
    print(
        year_results.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print("=" * 70)
    print("PERFORMANCE BY SEASON")
    print("=" * 70)

    print()
    print(
        season_results.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print("=" * 70)
    print("RESIDUAL STATISTICS")
    print("=" * 70)

    print()
    print(
        f"Mean residual:             "
        f"{residual_statistics['Mean_Residual']:.2f}"
    )

    print(
        f"Residual standard deviation: "
        f"{residual_statistics['Std_Residual']:.2f}"
    )

    print(
        f"Minimum residual:          "
        f"{residual_statistics['Minimum_Residual']:.2f}"
    )

    print(
        f"Maximum residual:          "
        f"{residual_statistics['Maximum_Residual']:.2f}"
    )

    print(
        f"Mean absolute error:       "
        f"{residual_statistics['Mean_Absolute_Error']:.2f}"
    )

    print(
        f"Maximum absolute error:    "
        f"{residual_statistics['Maximum_Absolute_Error']:.2f}"
    )

    print(
        f"Mean percentage error:     "
        f"{residual_statistics['Mean_Percentage_Error']:.2f}%"
    )


def main():
    dataframe, model = load_data()

    predicted = evaluate_overall(
        dataframe,
        model
    )

    prediction_dataframe = build_prediction_dataframe(
        dataframe,
        predicted
    )

    crop_results = evaluate_by_crop(
        prediction_dataframe
    )

    year_results = evaluate_by_year(
        prediction_dataframe
    )

    season_results = evaluate_by_season(
        prediction_dataframe
    )

    residual_statistics = calculate_residual_statistics(
        prediction_dataframe
    )

    overall_mae, overall_rmse, overall_r2 = calculate_metrics(
        prediction_dataframe[TARGET],
        prediction_dataframe["Predicted_Yield_kg_ha"]
    )

    overall_metrics = {
        "Samples": len(prediction_dataframe),
        "MAE": overall_mae,
        "RMSE": overall_rmse,
        "R2": overall_r2
    }

    prediction_dataframe.to_csv(
        PREDICTIONS_PATH,
        index=False
    )

    save_diagnostics(
        overall_metrics,
        crop_results,
        year_results,
        season_results,
        residual_statistics
    )

    create_actual_vs_predicted_plot(
        prediction_dataframe
    )

    create_residual_plot(
        prediction_dataframe
    )

    create_error_distribution_plot(
        prediction_dataframe
    )

    print_results(
        crop_results,
        year_results,
        season_results,
        residual_statistics
    )

    print()
    print("=" * 70)
    print("MODEL DIAGNOSTICS COMPLETED")
    print("=" * 70)

    print()
    print(
        f"Diagnostics saved to: {DIAGNOSTICS_PATH}"
    )

    print(
        f"Predictions saved to: {PREDICTIONS_PATH}"
    )

    print(
        f"Plots saved to: {PLOT_DIR}"
    )


if __name__ == "__main__":
    main()
