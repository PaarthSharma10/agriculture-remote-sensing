from pathlib import Path
import pandas as pd
import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[2]

BASE_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
)

OUTPUT_DIR = BASE_DIR / "final_model_evaluation"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FILES = {
    "crop_metrics": (
        BASE_DIR
        / "crop_error_analysis"
        / "crop_wise_metrics.csv"
    ),
    "crop_bias": (
        BASE_DIR
        / "crop_error_analysis"
        / "crop_wise_bias.csv"
    ),
    "overall_residual": (
        BASE_DIR
        / "residual_analysis"
        / "overall_residual_metrics.csv"
    ),
    "district_metrics": (
        BASE_DIR
        / "residual_analysis"
        / "district_error_metrics.csv"
    ),
    "year_metrics": (
        BASE_DIR
        / "residual_analysis"
        / "year_error_metrics.csv"
    ),
    "season_metrics": (
        BASE_DIR
        / "residual_analysis"
        / "season_error_metrics.csv"
    ),
    "overall_uncertainty": (
        BASE_DIR
        / "prediction_uncertainty"
        / "overall_uncertainty_metrics.csv"
    ),
    "crop_uncertainty": (
        BASE_DIR
        / "prediction_uncertainty"
        / "crop_uncertainty_metrics.csv"
    ),
    "district_uncertainty": (
        BASE_DIR
        / "prediction_uncertainty"
        / "district_uncertainty_metrics.csv"
    ),
    "calibration": (
        BASE_DIR
        / "calibrated_uncertainty"
        / "overall_calibration.csv"
    ),
    "before_after": (
        BASE_DIR
        / "calibrated_uncertainty"
        / "before_after_calibration.csv"
    ),
    "reliability": (
        BASE_DIR
        / "reliability_analysis"
        / "overall_reliability.csv"
    ),
    "reliability_scores": (
        BASE_DIR
        / "reliability_analysis"
        / "reliability_scores.csv"
    ),
    "risk_summary": (
        BASE_DIR
        / "reliability_analysis"
        / "risk_summary.csv"
    ),
}


def load_file(path):
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def print_section(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def build_overall_summary(data):
    residual = data["overall_residual"]

    if residual.empty:
        return pd.DataFrame()

    result = residual.copy()

    uncertainty = data["overall_uncertainty"]

    if not uncertainty.empty:
        columns = [
            "Mean_Prediction_STD_kg_ha",
            "Median_Prediction_STD_kg_ha",
            "Mean_Interval_Width_kg_ha",
            "Median_Interval_Width_kg_ha",
            "Mean_Uncertainty_Percent",
        ]

        available = [
            column for column in columns if column in uncertainty.columns
        ]

        if available:
            values = uncertainty.iloc[0][available]

            for column in available:
                result[column] = values[column]

    return result


def build_model_quality_summary(data):
    residual = data["overall_residual"]

    if residual.empty:
        return pd.DataFrame()

    row = residual.iloc[0]

    mae = float(row.get("MAE_kg_ha", np.nan))
    rmse = float(row.get("RMSE_kg_ha", np.nan))
    r2 = float(row.get("R2", np.nan))
    mean_residual = float(row.get("Mean_residual_kg_ha", row.get(
        "Mean_Residual_kg_ha", np.nan
    )))

    summary = pd.DataFrame(
        [
            {
                "Metric": "Samples",
                "Value": row.get("Samples", np.nan),
                "Interpretation": "Number of out-of-fold predictions",
            },
            {
                "Metric": "MAE_kg_ha",
                "Value": mae,
                "Interpretation": "Average absolute prediction error",
            },
            {
                "Metric": "RMSE_kg_ha",
                "Value": rmse,
                "Interpretation": "Penalizes larger prediction errors",
            },
            {
                "Metric": "R2",
                "Value": r2,
                "Interpretation": "Variance explained by the model",
            },
            {
                "Metric": "Mean_Residual_kg_ha",
                "Value": mean_residual,
                "Interpretation": "Overall prediction bias",
            },
        ]
    )

    return summary


def build_crop_summary(data):
    metrics = data["crop_metrics"]
    bias = data["crop_bias"]

    if metrics.empty:
        return pd.DataFrame()

    result = metrics.copy()

    if not bias.empty and "Crop" in bias.columns:
        columns = [
            "Crop",
            "Mean_Residual_kg_ha",
            "Median_Residual_kg_ha",
            "Bias_Status",
        ]

        available = [
            column for column in columns if column in bias.columns
        ]

        result = result.merge(
            bias[available],
            on="Crop",
            how="left",
        )

    return result.sort_values("MAE_kg_ha")


def build_district_summary(data):
    district = data["district_metrics"]

    if district.empty:
        return pd.DataFrame()

    return district.sort_values("MAE_kg_ha").copy()


def build_temporal_summary(data):
    year = data["year_metrics"]
    season = data["season_metrics"]

    frames = []

    if not year.empty:
        year_result = year.copy()
        year_result.insert(0, "Analysis_Type", "Year")
        frames.append(year_result)

    if not season.empty:
        season_result = season.copy()
        season_result.insert(0, "Analysis_Type", "Season")
        frames.append(season_result)

    if not frames:
        return pd.DataFrame()

    return pd.concat(frames, ignore_index=True)


def build_calibration_summary(data):
    calibration = data["calibration"]

    if calibration.empty:
        return pd.DataFrame()

    result = calibration.copy()

    if "Coverage_Error_Percent" in result.columns:
        result["Absolute_Coverage_Error_Percent"] = (
            result["Coverage_Error_Percent"].abs()
        )

    if "Absolute_Coverage_Error_Percent" in result.columns:
        result["Calibration_Quality"] = np.select(
            [
                result["Absolute_Coverage_Error_Percent"] <= 2,
                result["Absolute_Coverage_Error_Percent"] <= 5,
                result["Absolute_Coverage_Error_Percent"] <= 10,
            ],
            [
                "Excellent",
                "Good",
                "Moderate",
            ],
            default="Poor",
        )

    return result


def build_risk_summary(data):
    risk = data["risk_summary"]

    if risk.empty:
        return pd.DataFrame()

    return risk.copy()


def generate_findings(
    overall,
    crops,
    districts,
    temporal,
    calibration,
    risk,
):
    findings = []

    if not overall.empty:
        row = overall.iloc[0]

        mae = row.get("MAE_kg_ha", np.nan)
        rmse = row.get("RMSE_kg_ha", np.nan)
        r2 = row.get("R2", np.nan)

        findings.append(
            f"The final model was evaluated using "
            f"{int(row.get('Samples', 0))} out-of-fold predictions."
        )

        findings.append(
            f"The overall MAE was {mae:.2f} kg/ha and RMSE was "
            f"{rmse:.2f} kg/ha."
        )

        findings.append(
            f"The overall R2 was {r2:.4f}."
        )

    if not crops.empty:
        best = crops.iloc[0]
        worst = crops.iloc[-1]

        findings.append(
            f"Wheat had the lowest crop-wise MAE at "
            f"{best['MAE_kg_ha']:.2f} kg/ha."
        )

        findings.append(
            f"{worst['Crop']} had the highest crop-wise MAE at "
            f"{worst['MAE_kg_ha']:.2f} kg/ha."
        )

        if "Samples" in crops.columns:
            small = crops[crops["Samples"] < 10]

            if not small.empty:
                for _, row in small.iterrows():
                    findings.append(
                        f"{row['Crop']} had only {int(row['Samples'])} "
                        f"samples, so its crop-specific metrics should "
                        f"be interpreted cautiously."
                    )

    if not districts.empty:
        best_district = districts.iloc[0]
        worst_district = districts.iloc[-1]

        findings.append(
            f"{best_district['District']} had the lowest district MAE "
            f"at {best_district['MAE_kg_ha']:.2f} kg/ha."
        )

        findings.append(
            f"{worst_district['District']} had the highest district MAE "
            f"at {worst_district['MAE_kg_ha']:.2f} kg/ha."
        )

    if not temporal.empty:
        year_rows = temporal[
            temporal["Analysis_Type"] == "Year"
        ]

        season_rows = temporal[
            temporal["Analysis_Type"] == "Season"
        ]

        if not year_rows.empty:
            best_year = year_rows.loc[
                year_rows["MAE_kg_ha"].idxmin()
            ]

            findings.append(
                f"{best_year['Year']} had the lower yearly MAE at "
                f"{best_year['MAE_kg_ha']:.2f} kg/ha."
            )

        if not season_rows.empty:
            best_season = season_rows.loc[
                season_rows["MAE_kg_ha"].idxmin()
            ]

            findings.append(
                f"{best_season['Season']} had the lower seasonal MAE at "
                f"{best_season['MAE_kg_ha']:.2f} kg/ha."
            )

    if not calibration.empty:
        row_95 = calibration[
            calibration["Confidence_Level_Percent"] == 95
        ]

        if not row_95.empty:
            row = row_95.iloc[0]

            observed = row.get(
                "Observed_Coverage_Percent",
                np.nan,
            )

            error = row.get(
                "Coverage_Error_Percent",
                np.nan,
            )

            findings.append(
                f"The calibrated 95% prediction interval achieved "
                f"{observed:.2f}% observed coverage, with a coverage "
                f"error of {error:.2f} percentage points."
            )

    if not risk.empty:
        risk_counts = risk.groupby(
            "Reliability_Risk_Level"
        )["Samples"].sum()

        for level in [
            "Low Risk",
            "Moderate Risk",
            "High Risk",
            "Very High Risk",
        ]:
            if level in risk_counts.index:
                findings.append(
                    f"{level}: {int(risk_counts[level])} predictions."
                )

    return pd.DataFrame(
        {
            "Finding": findings
        }
    )


def main():
    print("=" * 70)
    print("FINAL AGRICULTURAL YIELD MODEL EVALUATION")
    print("=" * 70)

    data = {}

    for name, path in FILES.items():
        data[name] = load_file(path)

    print()
    print("Evaluation components loaded:")

    for name, frame in data.items():
        status = "OK" if not frame.empty else "MISSING"
        print(f"{name:25s}: {status}")

    overall = build_overall_summary(data)
    quality = build_model_quality_summary(data)
    crops = build_crop_summary(data)
    districts = build_district_summary(data)
    temporal = build_temporal_summary(data)
    calibration = build_calibration_summary(data)
    risk = build_risk_summary(data)

    findings = generate_findings(
        overall,
        crops,
        districts,
        temporal,
        calibration,
        risk,
    )

    print_section("FINAL MODEL QUALITY")

    if not quality.empty:
        print(quality.to_string(index=False))

    print_section("CROP PERFORMANCE")

    if not crops.empty:
        print(crops.to_string(index=False))

    print_section("DISTRICT PERFORMANCE")

    if not districts.empty:
        print(districts.to_string(index=False))

    print_section("TEMPORAL PERFORMANCE")

    if not temporal.empty:
        print(temporal.to_string(index=False))

    print_section("INTERVAL CALIBRATION")

    if not calibration.empty:
        print(calibration.to_string(index=False))

    print_section("RELIABILITY RISK")

    if not risk.empty:
        print(risk.to_string(index=False))

    print_section("KEY FINDINGS")

    if not findings.empty:
        for number, finding in enumerate(
            findings["Finding"],
            start=1,
        ):
            print(f"{number}. {finding}")

    outputs = {
        "final_model_quality.csv": quality,
        "final_crop_performance.csv": crops,
        "final_district_performance.csv": districts,
        "final_temporal_performance.csv": temporal,
        "final_calibration.csv": calibration,
        "final_risk_summary.csv": risk,
        "final_key_findings.csv": findings,
        "final_overall_summary.csv": overall,
    }

    print_section("OUTPUT")

    for filename, frame in outputs.items():
        if frame.empty:
            continue

        path = OUTPUT_DIR / filename
        frame.to_csv(path, index=False)
        print(f"{filename}: {path}")

    print()
    print("=" * 70)
    print("FINAL MODEL EVALUATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
