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
    / "crop_error_analysis"
)


def load_predictions():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Prediction file not found: {INPUT_FILE}"
        )

    data = pd.read_csv(INPUT_FILE)

    required_columns = [
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
        data["Model"] == "Extra Trees"
    ].copy()

    data = data[
        data["Feature_Set"]
        == "Crop + Remote Sensing + Environmental"
    ].copy()

    if data.empty:
        raise ValueError(
            "No Extra Trees predictions found for the selected feature set."
        )

    return data


def calculate_crop_metrics(data):
    rows = []

    for crop, group in data.groupby("Crop"):
        actual = group["Actual_Yield"]
        predicted = group["Predicted_Yield"]
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

        mean_actual = actual.mean()

        if mean_actual != 0:
            mape = (
                absolute_error
                / actual.abs()
            ).mean() * 100
        else:
            mape = np.nan

        bias = residual.mean()

        rows.append(
            {
                "Crop": crop,
                "Samples": len(group),
                "MAE_kg_ha": mae,
                "RMSE_kg_ha": rmse,
                "R2": r2,
                "MAPE_percent": mape,
                "Mean_Actual_kg_ha": mean_actual,
                "Mean_Predicted_kg_ha": predicted.mean(),
                "Mean_Residual_kg_ha": bias,
                "Max_Absolute_Error_kg_ha": absolute_error.max()
            }
        )

    return (
        pd.DataFrame(rows)
        .sort_values(
            "MAE_kg_ha"
        )
        .reset_index(drop=True)
    )


def calculate_bias_summary(data):
    summary = (
        data.groupby("Crop")
        .agg(
            Samples=("Residual", "count"),
            Mean_Residual_kg_ha=("Residual", "mean"),
            Median_Residual_kg_ha=("Residual", "median"),
            Mean_Absolute_Error_kg_ha=(
                "Absolute_Error",
                "mean"
            ),
            Maximum_Absolute_Error_kg_ha=(
                "Absolute_Error",
                "max"
            )
        )
        .reset_index()
    )

    summary["Bias_Status"] = np.where(
        summary["Mean_Residual_kg_ha"] > 0,
        "Underprediction",
        np.where(
            summary["Mean_Residual_kg_ha"] < 0,
            "Overprediction",
            "Balanced"
        )
    )

    return summary


def create_actual_vs_predicted_plot(data):
    crops = sorted(
        data["Crop"].unique()
    )

    plt.figure(
        figsize=(10, 8)
    )

    for crop in crops:
        group = data[
            data["Crop"] == crop
        ]

        plt.scatter(
            group["Actual_Yield"],
            group["Predicted_Yield"],
            alpha=0.7,
            label=crop
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
        "Actual vs Predicted Yield by Crop"
    )

    plt.legend(
        bbox_to_anchor=(1.05, 1),
        loc="upper left"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "actual_vs_predicted_by_crop.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_crop_mae_plot(metrics):
    plot_data = metrics.sort_values(
        "MAE_kg_ha"
    )

    plt.figure(
        figsize=(11, 7)
    )

    plt.bar(
        plot_data["Crop"],
        plot_data["MAE_kg_ha"]
    )

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "MAE (kg/ha)"
    )

    plt.title(
        "Crop-wise Mean Absolute Error"
    )

    plt.xticks(
        rotation=45,
        ha="right"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "crop_wise_mae.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_crop_rmse_plot(metrics):
    plot_data = metrics.sort_values(
        "RMSE_kg_ha"
    )

    plt.figure(
        figsize=(11, 7)
    )

    plt.bar(
        plot_data["Crop"],
        plot_data["RMSE_kg_ha"]
    )

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "RMSE (kg/ha)"
    )

    plt.title(
        "Crop-wise Root Mean Squared Error"
    )

    plt.xticks(
        rotation=45,
        ha="right"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "crop_wise_rmse.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_crop_r2_plot(metrics):
    plot_data = metrics.sort_values(
        "R2"
    )

    plt.figure(
        figsize=(11, 7)
    )

    plt.bar(
        plot_data["Crop"],
        plot_data["R2"]
    )

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "R²"
    )

    plt.title(
        "Crop-wise R² Performance"
    )

    plt.xticks(
        rotation=45,
        ha="right"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "crop_wise_r2.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_residual_plot(data):
    crops = sorted(
        data["Crop"].unique()
    )

    crop_positions = {
        crop: index
        for index, crop in enumerate(crops)
    }

    x_values = [
        crop_positions[crop]
        for crop in data["Crop"]
    ]

    plt.figure(
        figsize=(12, 7)
    )

    plt.scatter(
        x_values,
        data["Residual"],
        alpha=0.7
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xticks(
        range(len(crops)),
        crops,
        rotation=45,
        ha="right"
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

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "residual_distribution_by_crop.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_error_distribution_plot(data):
    plt.figure(
        figsize=(11, 7)
    )

    data.boxplot(
        column="Absolute_Error",
        by="Crop",
        rot=45
    )

    plt.suptitle(
        ""
    )

    plt.title(
        "Absolute Prediction Error by Crop"
    )

    plt.xlabel(
        "Crop"
    )

    plt.ylabel(
        "Absolute Error (kg/ha)"
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR
        / "absolute_error_distribution.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def create_fold_stability(data):
    fold_summary = (
        data.groupby(
            [
                "Crop",
                "Fold"
            ]
        )
        .agg(
            MAE=("Absolute_Error", "mean"),
            RMSE=(
                "Residual",
                lambda x: np.sqrt(
                    np.mean(x ** 2)
                )
            ),
            Bias=("Residual", "mean"),
            Samples=("Residual", "count")
        )
        .reset_index()
    )

    fold_summary.to_csv(
        OUTPUT_DIR
        / "crop_fold_stability.csv",
        index=False
    )

    return fold_summary


def print_results(metrics, bias_summary):
    print()
    print("=" * 70)
    print("CROP-WISE OOF ERROR ANALYSIS")
    print("=" * 70)

    print()

    print(
        metrics.round(3).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("CROP-WISE BIAS")
    print("=" * 70)

    print()

    print(
        bias_summary.round(3).to_string(
            index=False
        )
    )

    best_crop = metrics.iloc[
        metrics["MAE_kg_ha"].argmin()
    ]

    worst_crop = metrics.iloc[
        metrics["MAE_kg_ha"].argmax()
    ]

    print()
    print("=" * 70)
    print("BEST AND WORST CROPS")
    print("=" * 70)

    print()

    print(
        f"Lowest MAE: "
        f"{best_crop['Crop']} "
        f"({best_crop['MAE_kg_ha']:.2f} kg/ha)"
    )

    print(
        f"Highest MAE: "
        f"{worst_crop['Crop']} "
        f"({worst_crop['MAE_kg_ha']:.2f} kg/ha)"
    )

    largest_bias = bias_summary.loc[
        bias_summary[
            "Mean_Residual_kg_ha"
        ].abs().idxmax()
    ]

    print(
        f"Largest absolute bias: "
        f"{largest_bias['Crop']} "
        f"({largest_bias['Mean_Residual_kg_ha']:.2f} kg/ha)"
    )


def main():
    print("=" * 70)
    print("CROP-WISE AGRICULTURAL YIELD ERROR ANALYSIS")
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

    print(
        f"Crops detected: "
        f"{data['Crop'].nunique()}"
    )

    metrics = calculate_crop_metrics(
        data
    )

    bias_summary = calculate_bias_summary(
        data
    )

    fold_summary = create_fold_stability(
        data
    )

    metrics.to_csv(
        OUTPUT_DIR
        / "crop_wise_metrics.csv",
        index=False
    )

    bias_summary.to_csv(
        OUTPUT_DIR
        / "crop_wise_bias.csv",
        index=False
    )

    create_actual_vs_predicted_plot(
        data
    )

    create_crop_mae_plot(
        metrics
    )

    create_crop_rmse_plot(
        metrics
    )

    create_crop_r2_plot(
        metrics
    )

    create_residual_plot(
        data
    )

    create_error_distribution_plot(
        data
    )

    print_results(
        metrics,
        bias_summary
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
        f"Crop metrics: "
        f"{OUTPUT_DIR / 'crop_wise_metrics.csv'}"
    )

    print(
        f"Crop bias: "
        f"{OUTPUT_DIR / 'crop_wise_bias.csv'}"
    )

    print(
        f"Fold stability: "
        f"{OUTPUT_DIR / 'crop_fold_stability.csv'}"
    )

    print()
    print("=" * 70)
    print("CROP ERROR ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
