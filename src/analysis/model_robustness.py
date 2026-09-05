from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_FILE = PROJECT_ROOT / "data" / "features" / "ml_features.csv"
PREDICTIONS_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "out_of_fold_predictions.csv"
)
MODEL_FILE = (
    PROJECT_ROOT
    / "data"
    / "models"
    / "final_agricultural_yield_model.joblib"
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
    / "model_robustness"
)

FINAL_MODEL = "Extra Trees"
FINAL_FEATURE_SET = "Crop + Remote Sensing + Environmental"
MIN_RELIABLE_SAMPLES = 5


def load_data():
    required_files = [DATA_FILE, PREDICTIONS_FILE, MODEL_FILE]

    for file_path in required_files:
        if not file_path.exists():
            raise FileNotFoundError(f"Required file not found: {file_path}")

    dataset = pd.read_csv(DATA_FILE)
    predictions = pd.read_csv(PREDICTIONS_FILE)
    model = joblib.load(MODEL_FILE)
    importance = (
        pd.read_csv(IMPORTANCE_FILE)
        if IMPORTANCE_FILE.exists()
        else None
    )

    print(f"Dataset rows loaded: {len(dataset)}")
    print(f"Prediction rows loaded: {len(predictions)}")
    print(f"Model loaded: {MODEL_FILE}")

    if importance is not None:
        print(f"Importance rows loaded: {len(importance)}")

    return dataset, predictions, model, importance


def validate_data(dataset, predictions):
    dataset_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Yield_kg_ha",
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
        "Feature_Set",
    ]

    missing_dataset = [
        column for column in dataset_columns if column not in dataset.columns
    ]

    missing_predictions = [
        column
        for column in prediction_columns
        if column not in predictions.columns
    ]

    if missing_dataset:
        raise ValueError(f"Missing dataset columns: {missing_dataset}")

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
        raise ValueError("Final model predictions were not found.")

    selected["Residual"] = (
        selected["Actual_Yield"] - selected["Predicted_Yield"]
    )
    selected["Absolute_Error"] = selected["Residual"].abs()

    return selected


def calculate_metrics(predictions):
    actual = predictions["Actual_Yield"].to_numpy()
    predicted = predictions["Predicted_Yield"].to_numpy()
    error = actual - predicted

    mae = np.mean(np.abs(error))
    rmse = np.sqrt(np.mean(error**2))
    ss_res = np.sum(error**2)
    ss_tot = np.sum((actual - np.mean(actual)) ** 2)

    r2 = 1 - ss_res / ss_tot if ss_tot != 0 else np.nan

    return {
        "Samples": len(predictions),
        "MAE_kg_ha": mae,
        "RMSE_kg_ha": rmse,
        "R2": r2,
        "Mean_Error_kg_ha": np.mean(error),
        "Median_Absolute_Error_kg_ha": np.median(np.abs(error)),
        "Maximum_Absolute_Error_kg_ha": np.max(np.abs(error)),
    }


def calculate_group_metrics(predictions, group_column):
    results = []

    for group_name, group in predictions.groupby(group_column):
        metrics = calculate_metrics(group)
        metrics[group_column] = group_name
        metrics["Reliable"] = (
            metrics["Samples"] >= MIN_RELIABLE_SAMPLES
        )
        results.append(metrics)

    result = pd.DataFrame(results)

    if result.empty:
        return result

    return result.sort_values("MAE_kg_ha").reset_index(drop=True)


def calculate_fold_metrics(predictions):
    results = []

    for fold, group in predictions.groupby("Fold"):
        metrics = calculate_metrics(group)
        metrics["Fold"] = fold
        results.append(metrics)

    result = pd.DataFrame(results)

    if result.empty:
        return result

    return result.sort_values("Fold").reset_index(drop=True)


def calculate_error_stability(predictions):
    absolute_error = predictions["Absolute_Error"]
    residual = predictions["Residual"]

    return pd.DataFrame(
        [
            {
                "Samples": len(predictions),
                "Mean_Absolute_Error_kg_ha": absolute_error.mean(),
                "Median_Absolute_Error_kg_ha": absolute_error.median(),
                "Std_Absolute_Error_kg_ha": absolute_error.std(),
                "P90_Absolute_Error_kg_ha": absolute_error.quantile(0.90),
                "P95_Absolute_Error_kg_ha": absolute_error.quantile(0.95),
                "P99_Absolute_Error_kg_ha": absolute_error.quantile(0.99),
                "Mean_Residual_kg_ha": residual.mean(),
                "Residual_Std_kg_ha": residual.std(),
            }
        ]
    )


def calculate_prediction_range(predictions):
    actual = predictions["Actual_Yield"]
    predicted = predictions["Predicted_Yield"]

    actual_range = actual.max() - actual.min()
    predicted_range = predicted.max() - predicted.min()

    return pd.DataFrame(
        [
            {
                "Actual_Min_kg_ha": actual.min(),
                "Actual_Max_kg_ha": actual.max(),
                "Predicted_Min_kg_ha": predicted.min(),
                "Predicted_Max_kg_ha": predicted.max(),
                "Actual_Range_kg_ha": actual_range,
                "Predicted_Range_kg_ha": predicted_range,
                "Range_Ratio": (
                    predicted_range / actual_range
                    if actual_range != 0
                    else np.nan
                ),
                "Prediction_Mean_kg_ha": predicted.mean(),
                "Actual_Mean_kg_ha": actual.mean(),
            }
        ]
    )


def calculate_bias(predictions, group_column):
    result = (
        predictions.groupby(group_column)
        .agg(
            Samples=("Actual_Yield", "size"),
            Actual_Mean=("Actual_Yield", "mean"),
            Predicted_Mean=("Predicted_Yield", "mean"),
            Mean_Error=("Residual", "mean"),
            MAE=("Absolute_Error", "mean"),
        )
        .reset_index()
    )

    result["Bias_Percent"] = (
        result["Mean_Error"] / result["Actual_Mean"] * 100
    )

    return result.sort_values("Bias_Percent").reset_index(drop=True)


def calculate_fold_stability(fold_metrics):
    if fold_metrics.empty:
        return pd.DataFrame()

    return pd.DataFrame(
        [
            {
                "Fold_Count": len(fold_metrics),
                "MAE_Mean": fold_metrics["MAE_kg_ha"].mean(),
                "MAE_STD": fold_metrics["MAE_kg_ha"].std(),
                "MAE_Min": fold_metrics["MAE_kg_ha"].min(),
                "MAE_Max": fold_metrics["MAE_kg_ha"].max(),
                "RMSE_Mean": fold_metrics["RMSE_kg_ha"].mean(),
                "RMSE_STD": fold_metrics["RMSE_kg_ha"].std(),
                "R2_Mean": fold_metrics["R2"].mean(),
                "R2_STD": fold_metrics["R2"].std(),
            }
        ]
    )


def extract_estimator(model):
    if hasattr(model, "named_steps"):
        for step in reversed(list(model.named_steps.values())):
            if hasattr(step, "feature_importances_"):
                return step

    if hasattr(model, "feature_importances_"):
        return model

    return None


def get_feature_names(model, importance, feature_count):
    names = None

    if hasattr(model, "get_feature_names_out"):
        try:
            names = model.get_feature_names_out()
        except (AttributeError, ValueError):
            names = None

    if names is None and importance is not None:
        if "Feature" in importance.columns:
            names = importance["Feature"].astype(str).to_numpy()

    if names is None or len(names) != feature_count:
        names = np.array(
            [f"Feature_{index + 1}" for index in range(feature_count)]
        )

    return names


def calculate_model_feature_importance(model, importance):
    estimator = extract_estimator(model)

    if estimator is None:
        if importance is None:
            return None

        required = ["Feature", "Importance"]

        if not all(column in importance.columns for column in required):
            return None

        result = importance[required].copy()
    else:
        values = np.asarray(estimator.feature_importances_)
        names = get_feature_names(model, importance, len(values))

        result = pd.DataFrame(
            {
                "Feature": names,
                "Importance": values,
            }
        )

    importance_sum = result["Importance"].sum()

    result["Importance_Percent"] = (
        result["Importance"] / importance_sum * 100
        if importance_sum != 0
        else 0
    )

    return (
        result.sort_values("Importance", ascending=False)
        .reset_index(drop=True)
    )


def calculate_robustness_score(
    fold_stability,
    error_stability,
    crop_metrics,
):
    if fold_stability.empty or error_stability.empty:
        return pd.DataFrame()

    mae_mean = float(fold_stability.iloc[0]["MAE_Mean"])
    mae_std = float(fold_stability.iloc[0]["MAE_STD"])
    r2_std = float(fold_stability.iloc[0]["R2_STD"])

    mae_cv = mae_std / mae_mean if mae_mean != 0 else np.nan

    reliable_crops = int(
        (crop_metrics["Samples"] >= MIN_RELIABLE_SAMPLES).sum()
    )
    total_crops = len(crop_metrics)

    crop_coverage = (
        reliable_crops / total_crops
        if total_crops != 0
        else np.nan
    )

    score = 100.0

    if not np.isnan(mae_cv):
        score -= min(mae_cv * 100, 20)

    if not np.isnan(r2_std):
        score -= min(r2_std * 100, 20)

    if not np.isnan(crop_coverage):
        score *= crop_coverage
    else:
        score = 0.0

    score = max(0.0, min(score, 100.0))

    if score >= 90:
        status = "Excellent"
    elif score >= 75:
        status = "Good"
    elif score >= 60:
        status = "Moderate"
    else:
        status = "Weak"

    return pd.DataFrame(
        [
            {
                "Robustness_Score": score,
                "Robustness_Status": status,
                "Fold_MAE_CV": mae_cv,
                "Fold_R2_STD": r2_std,
                "Reliable_Crop_Coverage": crop_coverage * 100,
                "P95_Error_kg_ha": error_stability.iloc[0][
                    "P95_Absolute_Error_kg_ha"
                ],
            }
        ]
    )


def save_plot(figure, filename):
    figure.tight_layout()
    figure.savefig(OUTPUT_DIR / filename, dpi=300)
    plt.close(figure)


def create_fold_mae_plot(fold_metrics):
    if fold_metrics.empty:
        return

    figure, axis = plt.subplots(figsize=(8, 6))
    axis.bar(
        fold_metrics["Fold"].astype(str),
        fold_metrics["MAE_kg_ha"],
    )
    axis.set_xlabel("Cross-validation Fold")
    axis.set_ylabel("MAE (kg/ha)")
    axis.set_title("Cross-validation Fold MAE Stability")
    axis.grid(axis="y", alpha=0.3)
    save_plot(figure, "fold_mae_stability.png")


def create_group_plot(metrics, group_column, filename, title, horizontal=False):
    if metrics.empty:
        return

    plot_data = metrics.sort_values("MAE_kg_ha")
    figure, axis = plt.subplots(figsize=(11, 8) if horizontal else (8, 6))

    labels = plot_data[group_column].astype(str)

    if horizontal:
        axis.barh(labels, plot_data["MAE_kg_ha"])
        axis.set_xlabel("MAE (kg/ha)")
        axis.set_ylabel(group_column)
    else:
        axis.bar(labels, plot_data["MAE_kg_ha"])
        axis.set_xlabel(group_column)
        axis.set_ylabel("MAE (kg/ha)")
        axis.tick_params(axis="x", rotation=45)

    axis.set_title(title)
    axis.grid(axis="y", alpha=0.3)
    save_plot(figure, filename)


def create_error_distribution_plot(predictions):
    figure, axis = plt.subplots(figsize=(9, 6))
    axis.hist(predictions["Absolute_Error"], bins=25)
    axis.set_xlabel("Absolute Error (kg/ha)")
    axis.set_ylabel("Frequency")
    axis.set_title("Prediction Error Distribution")
    axis.grid(axis="y", alpha=0.3)
    save_plot(figure, "error_distribution.png")


def create_feature_importance_plot(importance):
    if importance is None or importance.empty:
        return

    plot_data = importance.head(13).sort_values("Importance")
    figure, axis = plt.subplots(figsize=(10, 7))

    axis.barh(
        plot_data["Feature"].astype(str),
        plot_data["Importance_Percent"],
    )
    axis.set_xlabel("Importance (%)")
    axis.set_ylabel("Feature")
    axis.set_title("Final Model Feature Importance")

    save_plot(figure, "robustness_feature_importance.png")


def save_results(
    overall_metrics,
    crop_metrics,
    district_metrics,
    year_metrics,
    season_metrics,
    fold_metrics,
    fold_stability,
    error_stability,
    prediction_range,
    crop_bias,
    district_bias,
    feature_importance,
    robustness_score,
):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    outputs = {
        "overall_robustness_metrics.csv": pd.DataFrame([overall_metrics]),
        "crop_robustness.csv": crop_metrics,
        "district_robustness.csv": district_metrics,
        "year_robustness.csv": year_metrics,
        "season_robustness.csv": season_metrics,
        "fold_robustness.csv": fold_metrics,
        "fold_stability.csv": fold_stability,
        "error_stability.csv": error_stability,
        "prediction_range.csv": prediction_range,
        "crop_bias.csv": crop_bias,
        "district_bias.csv": district_bias,
    }

    if feature_importance is not None:
        outputs["feature_importance.csv"] = feature_importance

    if robustness_score is not None:
        outputs["robustness_score.csv"] = robustness_score

    for filename, dataframe in outputs.items():
        dataframe.to_csv(OUTPUT_DIR / filename, index=False)


def print_section(title):
    print()
    print(title)
    print("-" * 70)


def print_report(
    overall_metrics,
    crop_metrics,
    district_metrics,
    year_metrics,
    season_metrics,
    fold_metrics,
    fold_stability,
    error_stability,
    prediction_range,
    robustness_score,
):
    print()
    print("=" * 70)
    print("AGRICULTURAL YIELD MODEL ROBUSTNESS ANALYSIS")
    print("=" * 70)

    print_section("FINAL MODEL")
    print(f"Model: {FINAL_MODEL}")
    print(f"Feature set: {FINAL_FEATURE_SET}")

    print_section("OVERALL PERFORMANCE")
    print(f"Samples: {overall_metrics['Samples']}")
    print(f"MAE: {overall_metrics['MAE_kg_ha']:.2f} kg/ha")
    print(f"RMSE: {overall_metrics['RMSE_kg_ha']:.2f} kg/ha")
    print(f"R2: {overall_metrics['R2']:.4f}")
    print(
        f"Mean error: "
        f"{overall_metrics['Mean_Error_kg_ha']:.2f} kg/ha"
    )

    print_section("CROSS-VALIDATION STABILITY")

    if not fold_stability.empty:
        stability = fold_stability.iloc[0]
        print(f"Folds: {int(stability['Fold_Count'])}")
        print(f"Mean fold MAE: {stability['MAE_Mean']:.2f} kg/ha")
        print(f"Fold MAE STD: {stability['MAE_STD']:.2f} kg/ha")
        print(
            f"Fold MAE range: "
            f"{stability['MAE_Min']:.2f} - "
            f"{stability['MAE_Max']:.2f} kg/ha"
        )
        print(f"Mean fold R2: {stability['R2_Mean']:.4f}")
        print(f"Fold R2 STD: {stability['R2_STD']:.4f}")

    print_section("FOLD PERFORMANCE")
    print(fold_metrics.round(2).to_string(index=False))

    print_section("CROP ROBUSTNESS")
    print(crop_metrics.round(2).to_string(index=False))

    print_section("DISTRICT ROBUSTNESS")
    print(district_metrics.round(2).to_string(index=False))

    print_section("YEAR ROBUSTNESS")
    print(year_metrics.round(2).to_string(index=False))

    print_section("SEASON ROBUSTNESS")
    print(season_metrics.round(2).to_string(index=False))

    print_section("ERROR STABILITY")

    if not error_stability.empty:
        error = error_stability.iloc[0]
        print(
            f"Median absolute error: "
            f"{error['Median_Absolute_Error_kg_ha']:.2f} kg/ha"
        )
        print(
            f"P90 absolute error: "
            f"{error['P90_Absolute_Error_kg_ha']:.2f} kg/ha"
        )
        print(
            f"P95 absolute error: "
            f"{error['P95_Absolute_Error_kg_ha']:.2f} kg/ha"
        )
        print(
            f"P99 absolute error: "
            f"{error['P99_Absolute_Error_kg_ha']:.2f} kg/ha"
        )

    print_section("PREDICTION RANGE")

    if not prediction_range.empty:
        ranges = prediction_range.iloc[0]
        print(
            f"Actual range: "
            f"{ranges['Actual_Min_kg_ha']:.2f} - "
            f"{ranges['Actual_Max_kg_ha']:.2f} kg/ha"
        )
        print(
            f"Predicted range: "
            f"{ranges['Predicted_Min_kg_ha']:.2f} - "
            f"{ranges['Predicted_Max_kg_ha']:.2f} kg/ha"
        )
        print(f"Range ratio: {ranges['Range_Ratio']:.4f}")

    if robustness_score is not None and not robustness_score.empty:
        print_section("ROBUSTNESS SCORE")
        score = robustness_score.iloc[0]
        print(f"Score: {score['Robustness_Score']:.2f}/100")
        print(f"Status: {score['Robustness_Status']}")
        print(f"Fold MAE CV: {score['Fold_MAE_CV']:.4f}")
        print(
            f"Reliable crop coverage: "
            f"{score['Reliable_Crop_Coverage']:.2f}%"
        )

    print_section("ROBUSTNESS INTERPRETATION")

    insufficient = crop_metrics[
        crop_metrics["Samples"] < MIN_RELIABLE_SAMPLES
    ]

    if not insufficient.empty:
        crops = ", ".join(
            insufficient["Crop"].astype(str).tolist()
        )
        print(f"Low-sample crops: {crops}")

    if not crop_metrics.empty:
        worst_crop = crop_metrics.iloc[-1]
        print(
            f"Highest crop MAE: "
            f"{worst_crop['Crop']} "
            f"({worst_crop['MAE_kg_ha']:.2f} kg/ha)"
        )

    if not district_metrics.empty:
        worst_district = district_metrics.iloc[-1]
        print(
            f"Highest district MAE: "
            f"{worst_district['District']} "
            f"({worst_district['MAE_kg_ha']:.2f} kg/ha)"
        )

    print(
        "Evaluation is based on out-of-fold predictions "
        "from grouped cross-validation."
    )


def main():
    print("=" * 70)
    print("GENERATING MODEL ROBUSTNESS ANALYSIS")
    print("=" * 70)

    dataset, predictions, model, importance = load_data()

    validate_data(dataset, predictions)

    final_predictions = select_final_predictions(predictions)

    overall_metrics = calculate_metrics(final_predictions)
    crop_metrics = calculate_group_metrics(final_predictions, "Crop")
    district_metrics = calculate_group_metrics(final_predictions, "District")
    year_metrics = calculate_group_metrics(final_predictions, "Year")
    season_metrics = calculate_group_metrics(final_predictions, "Season")
    fold_metrics = calculate_fold_metrics(final_predictions)
    fold_stability = calculate_fold_stability(fold_metrics)
    error_stability = calculate_error_stability(final_predictions)
    prediction_range = calculate_prediction_range(final_predictions)
    crop_bias = calculate_bias(final_predictions, "Crop")
    district_bias = calculate_bias(final_predictions, "District")

    feature_importance = calculate_model_feature_importance(
        model,
        importance,
    )

    robustness_score = calculate_robustness_score(
        fold_stability,
        error_stability,
        crop_metrics,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    create_fold_mae_plot(fold_metrics)

    create_group_plot(
        crop_metrics,
        "Crop",
        "crop_robustness.png",
        "Crop-wise Model Robustness",
    )

    create_group_plot(
        district_metrics,
        "District",
        "district_robustness.png",
        "District-wise Model Robustness",
        horizontal=True,
    )

    create_group_plot(
        year_metrics,
        "Year",
        "year_robustness.png",
        "Year-wise Model Robustness",
    )

    create_group_plot(
        season_metrics,
        "Season",
        "season_robustness.png",
        "Season-wise Model Robustness",
    )

    create_error_distribution_plot(final_predictions)
    create_feature_importance_plot(feature_importance)

    save_results(
        overall_metrics,
        crop_metrics,
        district_metrics,
        year_metrics,
        season_metrics,
        fold_metrics,
        fold_stability,
        error_stability,
        prediction_range,
        crop_bias,
        district_bias,
        feature_importance,
        robustness_score,
    )

    print_report(
        overall_metrics,
        crop_metrics,
        district_metrics,
        year_metrics,
        season_metrics,
        fold_metrics,
        fold_stability,
        error_stability,
        prediction_range,
        robustness_score,
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)
    print(f"Results directory: {OUTPUT_DIR}")

    for filename in [
        "overall_robustness_metrics.csv",
        "crop_robustness.csv",
        "district_robustness.csv",
        "year_robustness.csv",
        "season_robustness.csv",
        "fold_robustness.csv",
        "fold_stability.csv",
        "error_stability.csv",
        "prediction_range.csv",
        "crop_bias.csv",
        "district_bias.csv",
        "feature_importance.csv",
        "robustness_score.csv",
    ]:
        output_file = OUTPUT_DIR / filename
        if output_file.exists():
            print(f"{filename}: {output_file}")

    print()
    print("=" * 70)
    print("MODEL ROBUSTNESS ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
