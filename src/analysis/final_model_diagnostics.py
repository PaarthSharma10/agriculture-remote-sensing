from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

PREDICTIONS_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "out_of_fold_predictions.csv"
)

IMPORTANCE_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "feature_importance"
    / "feature_importance.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_diagnostics"
)

TARGET = "Yield_kg_ha"
FINAL_FEATURE_SET = "Crop + Remote Sensing + Environmental"
FINAL_MODEL = "Extra Trees"
MIN_RELIABLE_SAMPLES = 5


def load_data():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"ML dataset not found: {DATA_FILE}")

    if not PREDICTIONS_FILE.exists():
        raise FileNotFoundError(
            f"Prediction file not found: {PREDICTIONS_FILE}"
        )

    dataset = pd.read_csv(DATA_FILE)
    predictions = pd.read_csv(PREDICTIONS_FILE)
    importance = (
        pd.read_csv(IMPORTANCE_FILE)
        if IMPORTANCE_FILE.exists()
        else None
    )

    print(f"Dataset rows loaded: {len(dataset)}")
    print(f"Prediction rows loaded: {len(predictions)}")

    if importance is not None:
        print(f"Importance rows loaded: {len(importance)}")

    return dataset, predictions, importance


def validate_data(dataset, predictions):
    dataset_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        TARGET
    ]

    prediction_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
        "Residual",
        "Absolute_Error",
        "Fold",
        "Model",
        "Feature_Set"
    ]

    missing_dataset = [
        column
        for column in dataset_columns
        if column not in dataset.columns
    ]

    missing_predictions = [
        column
        for column in prediction_columns
        if column not in predictions.columns
    ]

    if missing_dataset:
        raise ValueError(
            f"Missing dataset columns: {missing_dataset}"
        )

    if missing_predictions:
        raise ValueError(
            f"Missing prediction columns: {missing_predictions}"
        )


def select_final_predictions(predictions):
    selected = predictions[
        (predictions["Feature_Set"] == FINAL_FEATURE_SET)
        & (predictions["Model"] == FINAL_MODEL)
    ].copy()

    if selected.empty:
        raise ValueError(
            "Final model predictions were not found."
        )

    selected["Residual"] = (
        selected["Actual_Yield"]
        - selected["Predicted_Yield"]
    )

    selected["Absolute_Error"] = selected["Residual"].abs()

    return selected


def calculate_metrics(predictions):
    actual = predictions["Actual_Yield"]
    predicted = predictions["Predicted_Yield"]
    errors = actual - predicted

    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((actual - actual.mean()) ** 2)

    r2 = (
        1 - ss_res / ss_tot
        if ss_tot != 0
        else np.nan
    )

    return pd.DataFrame(
        [{
            "Model": FINAL_MODEL,
            "Feature_Set": FINAL_FEATURE_SET,
            "Samples": len(predictions),
            "MAE_kg_ha": np.mean(np.abs(errors)),
            "RMSE_kg_ha": np.sqrt(np.mean(errors ** 2)),
            "R2": r2,
            "Mean_Error_kg_ha": np.mean(errors),
            "Median_Absolute_Error_kg_ha": np.median(
                np.abs(errors)
            ),
            "Maximum_Absolute_Error_kg_ha": np.max(
                np.abs(errors)
            )
        }]
    )


def calculate_group_metrics(predictions, group_column):
    results = []

    for group_name, group in predictions.groupby(group_column):
        actual = group["Actual_Yield"]
        predicted = group["Predicted_Yield"]
        errors = actual - predicted

        ss_res = np.sum(errors ** 2)
        ss_tot = np.sum((actual - actual.mean()) ** 2)

        r2 = (
            1 - ss_res / ss_tot
            if ss_tot != 0
            else np.nan
        )

        results.append(
            {
                group_column: group_name,
                "Samples": len(group),
                "MAE_kg_ha": np.mean(np.abs(errors)),
                "RMSE_kg_ha": np.sqrt(np.mean(errors ** 2)),
                "R2": r2,
                "Mean_Error_kg_ha": np.mean(errors),
                "Mean_Absolute_Error_kg_ha": np.mean(
                    np.abs(errors)
                ),
                "Reliable_Sample_Count": (
                    len(group) >= MIN_RELIABLE_SAMPLES
                )
            }
        )

    return (
        pd.DataFrame(results)
        .sort_values("MAE_kg_ha")
        .reset_index(drop=True)
    )


def calculate_feature_importance(importance):
    if importance is None:
        return None

    required = ["Feature", "Importance"]

    if not all(
        column in importance.columns
        for column in required
    ):
        return None

    result = importance[required].copy()
    result = result.sort_values(
        "Importance",
        ascending=False
    )

    total = result["Importance"].sum()

    result["Importance_Percent"] = (
        result["Importance"] / total * 100
        if total != 0
        else 0
    )

    return result.reset_index(drop=True)


def calculate_prediction_bias(predictions):
    result = (
        predictions
        .groupby(
            ["Crop", "Year", "Season"]
        )
        .agg(
            Samples=("Actual_Yield", "size"),
            Mean_Actual_Yield=(
                "Actual_Yield",
                "mean"
            ),
            Mean_Predicted_Yield=(
                "Predicted_Yield",
                "mean"
            ),
            Mean_Error=("Residual", "mean"),
            MAE=("Absolute_Error", "mean")
        )
        .reset_index()
    )

    result["Bias_Percent"] = (
        result["Mean_Error"]
        / result["Mean_Actual_Yield"]
        * 100
    )

    return result


def calculate_summary(
    overall_metrics,
    crop_metrics,
    district_metrics,
    importance
):
    overall = overall_metrics.iloc[0]

    reliable_crops = crop_metrics[
        crop_metrics["Samples"] >= MIN_RELIABLE_SAMPLES
    ]

    insufficient_crops = crop_metrics[
        crop_metrics["Samples"] < MIN_RELIABLE_SAMPLES
    ]

    top_feature = None
    top_feature_importance = None

    if importance is not None and not importance.empty:
        top_feature = importance.iloc[0]["Feature"]
        top_feature_importance = (
            importance.iloc[0]["Importance_Percent"]
        )

    return pd.DataFrame(
        [{
            "Final_Model": FINAL_MODEL,
            "Final_Feature_Set": FINAL_FEATURE_SET,
            "Total_Samples": int(overall["Samples"]),
            "MAE_kg_ha": float(overall["MAE_kg_ha"]),
            "RMSE_kg_ha": float(overall["RMSE_kg_ha"]),
            "R2": float(overall["R2"]),
            "Mean_Error_kg_ha": float(
                overall["Mean_Error_kg_ha"]
            ),
            "Reliable_Crops": int(len(reliable_crops)),
            "Insufficient_Sample_Crops": ", ".join(
                insufficient_crops["Crop"]
                .astype(str)
                .tolist()
            ),
            "Best_District_by_MAE": (
                district_metrics.iloc[0]["District"]
            ),
            "Worst_District_by_MAE": (
                district_metrics.iloc[-1]["District"]
            ),
            "Top_Feature": top_feature,
            "Top_Feature_Importance_Percent": (
                top_feature_importance
            )
        }]
    )


def save_results(
    overall_metrics,
    crop_metrics,
    district_metrics,
    year_metrics,
    season_metrics,
    bias_metrics,
    importance,
    summary
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    files = {
        "overall_metrics.csv": overall_metrics,
        "crop_wise_metrics.csv": crop_metrics,
        "district_wise_metrics.csv": district_metrics,
        "year_wise_metrics.csv": year_metrics,
        "season_wise_metrics.csv": season_metrics,
        "prediction_bias_analysis.csv": bias_metrics,
        "final_model_summary.csv": summary
    }

    if importance is not None:
        files["final_feature_importance.csv"] = importance

    for filename, dataframe in files.items():
        dataframe.to_csv(
            OUTPUT_DIR / filename,
            index=False
        )


def save_plot(
    figure,
    filename
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    figure.tight_layout()
    figure.savefig(
        OUTPUT_DIR / filename,
        dpi=300,
        bbox_inches="tight"
    )
    plt.close(figure)


def create_actual_vs_predicted_plot(predictions):
    figure, axis = plt.subplots(
        figsize=(9, 7)
    )

    actual = predictions["Actual_Yield"]
    predicted = predictions["Predicted_Yield"]

    axis.scatter(
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

    axis.plot(
        [minimum, maximum],
        [minimum, maximum],
        linestyle="--"
    )

    axis.set_xlabel("Actual Yield (kg/ha)")
    axis.set_ylabel("Predicted Yield (kg/ha)")
    axis.set_title(
        "Extra Trees: Actual vs Predicted Yield"
    )
    axis.grid(alpha=0.3)

    save_plot(
        figure,
        "final_actual_vs_predicted.png"
    )


def create_residual_plot(predictions):
    figure, axis = plt.subplots(
        figsize=(9, 7)
    )

    axis.scatter(
        predictions["Predicted_Yield"],
        predictions["Residual"],
        alpha=0.7
    )

    axis.axhline(
        0,
        linestyle="--"
    )

    axis.set_xlabel(
        "Predicted Yield (kg/ha)"
    )
    axis.set_ylabel(
        "Residual (kg/ha)"
    )
    axis.set_title(
        "Extra Trees: Residual Analysis"
    )
    axis.grid(alpha=0.3)

    save_plot(
        figure,
        "final_residual_plot.png"
    )


def create_residual_distribution(predictions):
    figure, axis = plt.subplots(
        figsize=(9, 7)
    )

    axis.hist(
        predictions["Residual"],
        bins=20
    )

    axis.axvline(
        0,
        linestyle="--"
    )

    axis.set_xlabel(
        "Residual (kg/ha)"
    )
    axis.set_ylabel("Frequency")
    axis.set_title(
        "Distribution of Prediction Residuals"
    )
    axis.grid(alpha=0.3)

    save_plot(
        figure,
        "final_residual_distribution.png"
    )


def create_feature_importance_plot(importance):
    if importance is None or importance.empty:
        return

    top_features = (
        importance
        .head(13)
        .sort_values("Importance")
    )

    figure, axis = plt.subplots(
        figsize=(10, 7)
    )

    axis.barh(
        top_features["Feature"],
        top_features["Importance_Percent"]
    )

    axis.set_xlabel("Importance (%)")
    axis.set_ylabel("Feature")
    axis.set_title(
        "Final Model Feature Importance"
    )

    save_plot(
        figure,
        "final_feature_importance.png"
    )


def create_bar_plot(
    metrics,
    category_column,
    filename,
    title,
    figsize,
    horizontal=False
):
    plot_data = metrics.sort_values(
        "MAE_kg_ha"
    )

    figure, axis = plt.subplots(
        figsize=figsize
    )

    if horizontal:
        axis.barh(
            plot_data[category_column],
            plot_data["MAE_kg_ha"]
        )
    else:
        axis.bar(
            plot_data[category_column].astype(str),
            plot_data["MAE_kg_ha"]
        )

    axis.set_xlabel(
        "MAE (kg/ha)"
    )
    axis.set_ylabel(
        category_column
    )
    axis.set_title(title)

    if not horizontal:
        axis.grid(
            axis="y",
            alpha=0.3
        )

    save_plot(
        figure,
        filename
    )


def create_all_plots(
    predictions,
    importance,
    crop_metrics,
    district_metrics,
    year_metrics,
    season_metrics
):
    create_actual_vs_predicted_plot(
        predictions
    )

    create_residual_plot(
        predictions
    )

    create_residual_distribution(
        predictions
    )

    create_feature_importance_plot(
        importance
    )

    create_bar_plot(
        crop_metrics,
        "Crop",
        "final_crop_mae.png",
        "Final Model Crop-wise MAE",
        (9, 6)
    )

    create_bar_plot(
        year_metrics,
        "Year",
        "final_year_mae.png",
        "Final Model Year-wise MAE",
        (8, 6)
    )

    create_bar_plot(
        season_metrics,
        "Season",
        "final_season_mae.png",
        "Final Model Season-wise MAE",
        (8, 6)
    )

    create_bar_plot(
        district_metrics,
        "District",
        "final_district_mae.png",
        "Final Model District-wise MAE",
        (11, 8),
        horizontal=True
    )


def print_report(
    overall_metrics,
    crop_metrics,
    district_metrics,
    year_metrics,
    season_metrics,
    importance
):
    overall = overall_metrics.iloc[0]

    print()
    print("=" * 70)
    print("FINAL AGRICULTURAL YIELD MODEL DIAGNOSTICS")
    print("=" * 70)

    print()
    print("FINAL MODEL")
    print("-" * 70)
    print(f"Model: {FINAL_MODEL}")
    print(f"Feature set: {FINAL_FEATURE_SET}")
    print(f"Samples: {int(overall['Samples'])}")

    print()
    print("OVERALL PERFORMANCE")
    print("-" * 70)
    print(
        f"MAE: {overall['MAE_kg_ha']:.2f} kg/ha"
    )
    print(
        f"RMSE: {overall['RMSE_kg_ha']:.2f} kg/ha"
    )
    print(
        f"R2: {overall['R2']:.4f}"
    )
    print(
        f"Mean error: "
        f"{overall['Mean_Error_kg_ha']:.2f} kg/ha"
    )

    print()
    print("CROP-WISE PERFORMANCE")
    print("-" * 70)
    print(
        crop_metrics.round(2).to_string(
            index=False
        )
    )

    print()
    print("DISTRICT-WISE PERFORMANCE")
    print("-" * 70)
    print(
        district_metrics.round(2).to_string(
            index=False
        )
    )

    print()
    print("YEAR-WISE PERFORMANCE")
    print("-" * 70)
    print(
        year_metrics.round(2).to_string(
            index=False
        )
    )

    print()
    print("SEASON-WISE PERFORMANCE")
    print("-" * 70)
    print(
        season_metrics.round(2).to_string(
            index=False
        )
    )

    if importance is not None:
        print()
        print("TOP FEATURES")
        print("-" * 70)
        print(
            importance.head(10)
            .round(4)
            .to_string(index=False)
        )

    print()
    print("DIAGNOSTIC INTERPRETATION")
    print("-" * 70)

    insufficient = crop_metrics[
        crop_metrics["Samples"] < MIN_RELIABLE_SAMPLES
    ]

    if not insufficient.empty:
        crops = ", ".join(
            insufficient["Crop"]
            .astype(str)
            .tolist()
        )
        print(
            f"Insufficient crop samples: {crops}"
        )

    if importance is not None and not importance.empty:
        top_feature = importance.iloc[0]

        print(
            f"Dominant feature: "
            f"{top_feature['Feature']} "
            f"({top_feature['Importance_Percent']:.2f}%)"
        )

    print(
        "Grouped cross-validation was used to reduce "
        "district-year-season leakage."
    )

    print(
        "Crop-level metrics with fewer than "
        f"{MIN_RELIABLE_SAMPLES} samples should not be "
        "treated as reliable standalone estimates."
    )


def main():
    print("=" * 70)
    print("GENERATING FINAL MODEL DIAGNOSTICS")
    print("=" * 70)

    dataset, predictions, importance = load_data()

    validate_data(
        dataset,
        predictions
    )

    final_predictions = select_final_predictions(
        predictions
    )

    overall_metrics = calculate_metrics(
        final_predictions
    )

    crop_metrics = calculate_group_metrics(
        final_predictions,
        "Crop"
    )

    crop_metrics["Evaluation_Status"] = np.where(
        crop_metrics["Samples"] >= MIN_RELIABLE_SAMPLES,
        "Reliable",
        "Insufficient samples"
    )

    district_metrics = calculate_group_metrics(
        final_predictions,
        "District"
    )

    year_metrics = calculate_group_metrics(
        final_predictions,
        "Year"
    )

    season_metrics = calculate_group_metrics(
        final_predictions,
        "Season"
    )

    bias_metrics = calculate_prediction_bias(
        final_predictions
    )

    final_importance = calculate_feature_importance(
        importance
    )

    summary = calculate_summary(
        overall_metrics,
        crop_metrics,
        district_metrics,
        final_importance
    )

    create_all_plots(
        final_predictions,
        final_importance,
        crop_metrics,
        district_metrics,
        year_metrics,
        season_metrics
    )

    save_results(
        overall_metrics,
        crop_metrics,
        district_metrics,
        year_metrics,
        season_metrics,
        bias_metrics,
        final_importance,
        summary
    )

    print_report(
        overall_metrics,
        crop_metrics,
        district_metrics,
        year_metrics,
        season_metrics,
        final_importance
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print()
    print(
        f"Results directory: {OUTPUT_DIR}"
    )

    output_files = [
        "overall_metrics.csv",
        "crop_wise_metrics.csv",
        "district_wise_metrics.csv",
        "year_wise_metrics.csv",
        "season_wise_metrics.csv",
        "prediction_bias_analysis.csv",
        "final_model_summary.csv",
        "final_actual_vs_predicted.png",
        "final_residual_plot.png",
        "final_residual_distribution.png",
        "final_feature_importance.png",
        "final_crop_mae.png",
        "final_year_mae.png",
        "final_season_mae.png",
        "final_district_mae.png"
    ]

    for filename in output_files:
        print(
            f"{filename}: {OUTPUT_DIR / filename}"
        )

    if final_importance is not None:
        print(
            "final_feature_importance.csv: "
            f"{OUTPUT_DIR / 'final_feature_importance.csv'}"
        )

    print()
    print("=" * 70)
    print("FINAL MODEL DIAGNOSTICS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
