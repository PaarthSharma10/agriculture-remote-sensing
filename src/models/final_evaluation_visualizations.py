from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "final_model_evaluation"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "visualizations"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_data(filename):
    path = INPUT_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    return pd.read_csv(path)


def save_bar_chart(
    dataframe,
    x_column,
    y_column,
    title,
    xlabel,
    ylabel,
    filename,
    rotation=0,
):
    plt.figure(figsize=(12, 7))

    plt.bar(
        dataframe[x_column].astype(str),
        dataframe[y_column],
    )

    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.xticks(rotation=rotation)
    plt.tight_layout()

    plt.savefig(OUTPUT_DIR / filename, dpi=300)
    plt.close()


def create_crop_mae():
    df = load_data("final_crop_performance.csv")

    df = df.sort_values("MAE_kg_ha")

    save_bar_chart(
        df,
        "Crop",
        "MAE_kg_ha",
        "Crop-wise Mean Absolute Error",
        "Crop",
        "MAE (kg/ha)",
        "crop_mae.png",
    )


def create_crop_r2():
    df = load_data("final_crop_performance.csv")

    df = df.sort_values("R2")

    save_bar_chart(
        df,
        "Crop",
        "R2",
        "Crop-wise R² Performance",
        "Crop",
        "R²",
        "crop_r2.png",
    )


def create_district_mae():
    df = load_data("final_district_performance.csv")

    df = df.sort_values("MAE_kg_ha")

    save_bar_chart(
        df,
        "District",
        "MAE_kg_ha",
        "District-wise Mean Absolute Error",
        "District",
        "MAE (kg/ha)",
        "district_mae.png",
        rotation=75,
    )


def create_year_mae():
    df = load_data("final_temporal_performance.csv")

    df = df[df["Analysis_Type"] == "Year"].copy()

    df["Year"] = df["Year"].astype(int)

    save_bar_chart(
        df,
        "Year",
        "MAE_kg_ha",
        "Year-wise Model Performance",
        "Year",
        "MAE (kg/ha)",
        "year_mae.png",
    )


def create_season_mae():
    df = load_data("final_temporal_performance.csv")

    df = df[df["Analysis_Type"] == "Season"].copy()

    save_bar_chart(
        df,
        "Season",
        "MAE_kg_ha",
        "Season-wise Model Performance",
        "Season",
        "MAE (kg/ha)",
        "season_mae.png",
    )


def create_calibration_chart():
    df = load_data("final_calibration.csv")

    plt.figure(figsize=(10, 7))

    plt.plot(
        df["Nominal_Coverage_Percent"],
        df["Observed_Coverage_Percent"],
        marker="o",
        linewidth=2,
        label="Observed Coverage",
    )

    plt.plot(
        df["Nominal_Coverage_Percent"],
        df["Nominal_Coverage_Percent"],
        linestyle="--",
        linewidth=2,
        label="Ideal Calibration",
    )

    plt.xlabel("Nominal Coverage (%)")
    plt.ylabel("Observed Coverage (%)")
    plt.title("Prediction Interval Calibration")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "prediction_interval_calibration.png",
        dpi=300,
    )

    plt.close()


def create_before_after_calibration():
    path = (
        PROJECT_ROOT
        / "data"
        / "analysis"
        / "ml"
        / "final_evaluation"
        / "calibrated_uncertainty"
        / "before_after_calibration.csv"
    )

    if not path.exists():
        return

    df = pd.read_csv(path)

    plt.figure(figsize=(10, 7))

    plt.plot(
        df["Confidence_Level_Percent"],
        df["Original_Coverage_Percent"],
        marker="o",
        linewidth=2,
        label="Before Calibration",
    )

    plt.plot(
        df["Confidence_Level_Percent"],
        df["Calibrated_Coverage_Percent"],
        marker="o",
        linewidth=2,
        label="After Calibration",
    )

    plt.plot(
        df["Confidence_Level_Percent"],
        df["Nominal_Coverage_Percent"],
        linestyle="--",
        linewidth=2,
        label="Nominal Coverage",
    )

    plt.xlabel("Confidence Level (%)")
    plt.ylabel("Observed Coverage (%)")
    plt.title("Prediction Interval Coverage Before and After Calibration")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "before_after_calibration.png",
        dpi=300,
    )

    plt.close()


def create_risk_summary():
    df = load_data("final_risk_summary.csv")

    plt.figure(figsize=(10, 7))

    plt.bar(
        df["Reliability_Risk_Level"],
        df["Samples"],
    )

    plt.title("Prediction Reliability Risk Distribution")
    plt.xlabel("Reliability Risk Level")
    plt.ylabel("Number of Predictions")
    plt.xticks(rotation=25)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "reliability_risk_distribution.png",
        dpi=300,
    )

    plt.close()


def create_model_quality():
    df = load_data("final_model_quality.csv")

    numeric = df[
        df["Metric"].isin(
            [
                "MAE_kg_ha",
                "RMSE_kg_ha",
            ]
        )
    ].copy()

    plt.figure(figsize=(9, 6))

    plt.bar(
        numeric["Metric"],
        numeric["Value"],
    )

    plt.title("Final Model Error Metrics")
    plt.xlabel("Metric")
    plt.ylabel("Error (kg/ha)")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "final_model_error_metrics.png",
        dpi=300,
    )

    plt.close()


def create_summary_report():
    quality = load_data("final_model_quality.csv")
    calibration = load_data("final_calibration.csv")
    risk = load_data("final_risk_summary.csv")

    mae = quality.loc[
        quality["Metric"] == "MAE_kg_ha",
        "Value",
    ].iloc[0]

    rmse = quality.loc[
        quality["Metric"] == "RMSE_kg_ha",
        "Value",
    ].iloc[0]

    bias = quality.loc[
        quality["Metric"] == "Mean_Residual_kg_ha",
        "Value",
    ].iloc[0]

    calibration_95 = calibration[
        calibration["Confidence_Level_Percent"] == 95
    ].iloc[0]

    total_risk_samples = risk["Samples"].sum()

    summary = pd.DataFrame(
        {
            "Metric": [
                "Evaluation Samples",
                "MAE (kg/ha)",
                "RMSE (kg/ha)",
                "Mean Residual (kg/ha)",
                "95% Nominal Coverage (%)",
                "95% Observed Coverage (%)",
                "95% Coverage Error (%)",
                "Total Risk-Assessed Predictions",
            ],
            "Value": [
                total_risk_samples,
                mae,
                rmse,
                bias,
                calibration_95["Nominal_Coverage_Percent"],
                calibration_95["Observed_Coverage_Percent"],
                calibration_95["Coverage_Error_Percent"],
                total_risk_samples,
            ],
        }
    )

    summary.to_csv(
        OUTPUT_DIR / "final_visualization_summary.csv",
        index=False,
    )


def main():
    print("=" * 70)
    print("FINAL MODEL EVALUATION VISUALIZATIONS")
    print("=" * 70)

    create_crop_mae()
    print("Created: crop_mae.png")

    create_crop_r2()
    print("Created: crop_r2.png")

    create_district_mae()
    print("Created: district_mae.png")

    create_year_mae()
    print("Created: year_mae.png")

    create_season_mae()
    print("Created: season_mae.png")

    create_calibration_chart()
    print("Created: prediction_interval_calibration.png")

    create_before_after_calibration()
    print("Created: before_after_calibration.png")

    create_risk_summary()
    print("Created: reliability_risk_distribution.png")

    create_model_quality()
    print("Created: final_model_error_metrics.png")

    create_summary_report()
    print("Created: final_visualization_summary.csv")

    print("=" * 70)
    print("FINAL VISUALIZATIONS COMPLETED")
    print("=" * 70)
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
