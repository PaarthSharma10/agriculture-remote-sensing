from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "out_of_fold_predictions.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "residual_analysis"
)


def load_predictions():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Prediction file not found: {INPUT_FILE}"
        )

    data = pd.read_csv(INPUT_FILE)

    required_columns = [
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

    missing_columns = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    data = data[
        (data["Model"] == "Extra Trees")
        & (
            data["Feature_Set"]
            == "Crop + Remote Sensing + Environmental"
        )
    ].copy()

    if data.empty:
        raise ValueError(
            "No final Extra Trees OOF predictions found."
        )

    return data


def calculate_group_metrics(data, group_column):
    rows = []

    for group_value, group in data.groupby(
        group_column
    ):
        actual = group["Actual_Yield"]
        residual = group["Residual"]
        absolute_error = group["Absolute_Error"]

        mae = absolute_error.mean()

        rmse = np.sqrt(
            np.mean(
                residual ** 2
            )
        )

        ss_res = np.sum(
            residual ** 2
        )

        ss_tot = np.sum(
            (
                actual
                - actual.mean()
            ) ** 2
        )

        if ss_tot == 0:
            r2 = np.nan
        else:
            r2 = 1 - (
                ss_res
                / ss_tot
            )

        rows.append(
            {
                group_column: group_value,
                "Samples": len(group),
                "MAE_kg_ha": mae,
                "RMSE_kg_ha": rmse,
                "R2": r2,
                "Mean_Residual_kg_ha": residual.mean(),
                "Mean_Absolute_Error_kg_ha": absolute_error.mean(),
                "Max_Absolute_Error_kg_ha": absolute_error.max()
            }
        )

    return pd.DataFrame(rows)


def calculate_overall_metrics(data):
    actual = data["Actual_Yield"]
    predicted = data["Predicted_Yield"]
    residual = data["Residual"]

    return pd.DataFrame(
        [
            {
                "Samples": len(data),
                "MAE_kg_ha": np.mean(
                    np.abs(residual)
                ),
                "RMSE_kg_ha": np.sqrt(
                    np.mean(
                        residual ** 2
                    )
                ),
                "Mean_Residual_kg_ha": residual.mean(),
                "Median_Residual_kg_ha": residual.median(),
                "Maximum_Absolute_Error_kg_ha": np.abs(
                    residual
                ).max(),
                "Minimum_Actual_Yield_kg_ha": actual.min(),
                "Maximum_Actual_Yield_kg_ha": actual.max(),
                "Minimum_Predicted_Yield_kg_ha": predicted.min(),
                "Maximum_Predicted_Yield_kg_ha": predicted.max()
            }
        ]
    )


def calculate_error_rate(data):
    mean_actual = data["Actual_Yield"].abs()

    error_percentage = (
        data["Absolute_Error"]
        / mean_actual
    ) * 100

    result = data[
        [
            "District",
            "Year",
            "Season",
            "Crop",
            "Actual_Yield",
            "Predicted_Yield",
            "Residual",
            "Absolute_Error",
            "Fold"
        ]
    ].copy()

    result[
        "Absolute_Error_Percent"
    ] = error_percentage

    return result


def calculate_feature_error_relationships(data):
    feature_file = (
        PROJECT_ROOT
        / "data"
        / "features"
        / "ml_features.csv"
    )

    if not feature_file.exists():
        return pd.DataFrame()

    features = pd.read_csv(
        feature_file
    )

    key_columns = [
        "District",
        "Year",
        "Season",
        "Crop"
    ]

    feature_columns = [
        column
        for column in features.columns
        if column not in key_columns
        and pd.api.types.is_numeric_dtype(
            features[column]
        )
    ]

    merged = data.merge(
        features,
        on=key_columns,
        how="left"
    )

    rows = []

    for feature in feature_columns:
        if feature not in merged.columns:
            continue

        valid = merged[
            [
                feature,
                "Residual",
                "Absolute_Error"
            ]
        ].dropna()

        if len(valid) < 3:
            continue

        residual_correlation = valid[
            feature
        ].corr(
            valid["Residual"]
        )

        error_correlation = valid[
            feature
        ].corr(
            valid["Absolute_Error"]
        )

        rows.append(
            {
                "Feature": feature,
                "Residual_Correlation": (
                    residual_correlation
                ),
                "Absolute_Error_Correlation": (
                    error_correlation
                ),
                "Samples": len(valid)
            }
        )

    return (
        pd.DataFrame(rows)
        .sort_values(
            "Absolute_Error_Correlation",
            key=lambda x: x.abs(),
            ascending=False
        )
    )


def identify_largest_errors(data):
    errors = data.copy()

    errors[
        "Absolute_Error_Percent"
    ] = (
        errors["Absolute_Error"]
        / errors["Actual_Yield"].abs()
    ) * 100

    return (
        errors[
            [
                "District",
                "Year",
                "Season",
                "Crop",
                "Actual_Yield",
                "Predicted_Yield",
                "Residual",
                "Absolute_Error",
                "Absolute_Error_Percent",
                "Fold"
            ]
        ]
        .sort_values(
            "Absolute_Error",
            ascending=False
        )
        .head(20)
    )


def create_actual_predicted_plot(data):
    plt.figure(
        figsize=(9, 8)
    )

    plt.scatter(
        data["Actual_Yield"],
        data["Predicted_Yield"],
        alpha=0.7
    )

    minimum = min(
        data["Actual_Yield"].min(),
        data["Predicted_Yield"].min()
    )

    maximum = max(
        data["Actual_Yield"].max(),
        data["Predicted_Yield"].max()
    )

    plt.plot(
        [minimum, maximum],
        [minimum, maximum],
        linestyle="--"
    )

    plt.xlabel(
        "Actual Yield (kg/ha)"
    )

    plt.ylabel(
        "Predicted Yield (kg/ha)"
    )

    plt.title(
        "Actual vs Predicted Yield"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "actual_vs_predicted.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_residual_vs_predicted_plot(data):
    plt.figure(
        figsize=(9, 8)
    )

    plt.scatter(
        data["Predicted_Yield"],
        data["Residual"],
        alpha=0.7
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xlabel(
        "Predicted Yield (kg/ha)"
    )

    plt.ylabel(
        "Residual (kg/ha)"
    )

    plt.title(
        "Residuals vs Predicted Yield"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "residuals_vs_predicted.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_residual_histogram(data):
    plt.figure(
        figsize=(9, 7)
    )

    plt.hist(
        data["Residual"],
        bins=20
    )

    plt.axvline(
        0,
        linestyle="--"
    )

    plt.xlabel(
        "Residual (kg/ha)"
    )

    plt.ylabel(
        "Frequency"
    )

    plt.title(
        "Residual Distribution"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "residual_distribution.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_district_mae_plot(district_metrics):
    plot_data = district_metrics.sort_values(
        "MAE_kg_ha"
    )

    plt.figure(
        figsize=(12, 8)
    )

    plt.bar(
        plot_data["District"],
        plot_data["MAE_kg_ha"]
    )

    plt.xlabel(
        "District"
    )

    plt.ylabel(
        "MAE (kg/ha)"
    )

    plt.title(
        "District-wise Prediction Error"
    )

    plt.xticks(
        rotation=60,
        ha="right"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "district_wise_mae.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_year_mae_plot(year_metrics):
    plot_data = year_metrics.sort_values(
        "Year"
    )

    plt.figure(
        figsize=(9, 7)
    )

    plt.plot(
        plot_data["Year"],
        plot_data["MAE_kg_ha"],
        marker="o"
    )

    plt.xlabel(
        "Year"
    )

    plt.ylabel(
        "MAE (kg/ha)"
    )

    plt.title(
        "Year-wise Prediction Error"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "year_wise_mae.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_season_mae_plot(season_metrics):
    plot_data = season_metrics.sort_values(
        "MAE_kg_ha"
    )

    plt.figure(
        figsize=(8, 6)
    )

    plt.bar(
        plot_data["Season"],
        plot_data["MAE_kg_ha"]
    )

    plt.xlabel(
        "Season"
    )

    plt.ylabel(
        "MAE (kg/ha)"
    )

    plt.title(
        "Season-wise Prediction Error"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "season_wise_mae.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_crop_residual_plot(data):
    crops = sorted(
        data["Crop"].unique()
    )

    values = [
        data.loc[
            data["Crop"] == crop,
            "Residual"
        ]
        for crop in crops
    ]

    plt.figure(
        figsize=(11, 7)
    )

    plt.boxplot(
        values,
        tick_labels=crops
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "Residual (kg/ha)"
    )

    plt.title(
        "Residual Distribution by Crop"
    )

    plt.xticks(
        rotation=45,
        ha="right"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "crop_residual_distribution.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def print_summary(
    overall,
    district_metrics,
    year_metrics,
    season_metrics,
    largest_errors
):
    row = overall.iloc[0]

    print()
    print("=" * 70)
    print("OVERALL RESIDUAL DIAGNOSTICS")
    print("=" * 70)

    print()

    print(
        f"Samples: {row['Samples']:.0f}"
    )

    print(
        f"MAE: {row['MAE_kg_ha']:.2f} kg/ha"
    )

    print(
        f"RMSE: {row['RMSE_kg_ha']:.2f} kg/ha"
    )

    print(
        f"Mean residual: "
        f"{row['Mean_Residual_kg_ha']:.2f} kg/ha"
    )

    print(
        f"Median residual: "
        f"{row['Median_Residual_kg_ha']:.2f} kg/ha"
    )

    print(
        f"Maximum absolute error: "
        f"{row['Maximum_Absolute_Error_kg_ha']:.2f} kg/ha"
    )

    print()
    print("=" * 70)
    print("DISTRICT ERROR SUMMARY")
    print("=" * 70)

    print()

    print(
        district_metrics
        .sort_values("MAE_kg_ha")
        .round(2)
        .to_string(index=False)
    )

    print()
    print("=" * 70)
    print("YEAR ERROR SUMMARY")
    print("=" * 70)

    print()

    print(
        year_metrics
        .sort_values("Year")
        .round(2)
        .to_string(index=False)
    )

    print()
    print("=" * 70)
    print("SEASON ERROR SUMMARY")
    print("=" * 70)

    print()

    print(
        season_metrics
        .sort_values("MAE_kg_ha")
        .round(2)
        .to_string(index=False)
    )

    print()
    print("=" * 70)
    print("LARGEST PREDICTION ERRORS")
    print("=" * 70)

    print()

    print(
        largest_errors.round(2).to_string(
            index=False
        )
    )


def main():
    print("=" * 70)
    print("FINAL MODEL RESIDUAL DIAGNOSTICS")
    print("=" * 70)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    data = load_predictions()

    print()
    print(
        f"OOF predictions loaded: {len(data)}"
    )

    overall = calculate_overall_metrics(
        data
    )

    district_metrics = calculate_group_metrics(
        data,
        "District"
    )

    year_metrics = calculate_group_metrics(
        data,
        "Year"
    )

    season_metrics = calculate_group_metrics(
        data,
        "Season"
    )

    crop_metrics = calculate_group_metrics(
        data,
        "Crop"
    )

    error_rates = calculate_error_rate(
        data
    )

    feature_relationships = (
        calculate_feature_error_relationships(
            data
        )
    )

    largest_errors = identify_largest_errors(
        data
    )

    overall.to_csv(
        OUTPUT_DIR
        / "overall_residual_metrics.csv",
        index=False
    )

    district_metrics.to_csv(
        OUTPUT_DIR
        / "district_error_metrics.csv",
        index=False
    )

    year_metrics.to_csv(
        OUTPUT_DIR
        / "year_error_metrics.csv",
        index=False
    )

    season_metrics.to_csv(
        OUTPUT_DIR
        / "season_error_metrics.csv",
        index=False
    )

    crop_metrics.to_csv(
        OUTPUT_DIR
        / "crop_error_metrics.csv",
        index=False
    )

    error_rates.to_csv(
        OUTPUT_DIR
        / "prediction_error_percentages.csv",
        index=False
    )

    largest_errors.to_csv(
        OUTPUT_DIR
        / "largest_prediction_errors.csv",
        index=False
    )

    if not feature_relationships.empty:
        feature_relationships.to_csv(
            OUTPUT_DIR
            / "feature_error_correlations.csv",
            index=False
        )

    create_actual_predicted_plot(
        data
    )

    create_residual_vs_predicted_plot(
        data
    )

    create_residual_histogram(
        data
    )

    create_district_mae_plot(
        district_metrics
    )

    create_year_mae_plot(
        year_metrics
    )

    create_season_mae_plot(
        season_metrics
    )

    create_crop_residual_plot(
        data
    )

    print_summary(
        overall,
        district_metrics,
        year_metrics,
        season_metrics,
        largest_errors
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print()
    print(
        f"Results directory: {OUTPUT_DIR}"
    )

    print(
        "Overall metrics: "
        f"{OUTPUT_DIR / 'overall_residual_metrics.csv'}"
    )

    print(
        "District metrics: "
        f"{OUTPUT_DIR / 'district_error_metrics.csv'}"
    )

    print(
        "Year metrics: "
        f"{OUTPUT_DIR / 'year_error_metrics.csv'}"
    )

    print(
        "Season metrics: "
        f"{OUTPUT_DIR / 'season_error_metrics.csv'}"
    )

    print(
        "Crop metrics: "
        f"{OUTPUT_DIR / 'crop_error_metrics.csv'}"
    )

    print(
        "Largest errors: "
        f"{OUTPUT_DIR / 'largest_prediction_errors.csv'}"
    )

    print()
    print("=" * 70)
    print("RESIDUAL ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
