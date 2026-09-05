from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "calibrated_uncertainty"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "reliability_analysis"
)

INPUT_FILE = INPUT_DIR / "calibrated_prediction_intervals.csv"

CONFIDENCE_LEVELS = [80, 90, 95, 99]


def load_data():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Required file not found: {INPUT_FILE}"
        )

    df = pd.read_csv(INPUT_FILE)

    print(f"Dataset rows loaded: {len(df)}")
    print(f"Dataset columns loaded: {len(df.columns)}")

    return df


def detect_columns(df):
    required = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
    ]

    missing = [
        column
        for column in required
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing required columns: {', '.join(missing)}"
        )


def find_interval_columns(df, confidence):
    confidence = str(confidence)

    lower_candidates = [
        f"Calibrated_Lower_{confidence}",
        f"Calibrated_Interval_Lower_{confidence}",
        f"Lower_{confidence}_Interval",
        f"Interval_Lower_{confidence}",
        f"Calibrated_Lower_{confidence}_Interval",
    ]

    upper_candidates = [
        f"Calibrated_Upper_{confidence}",
        f"Calibrated_Interval_Upper_{confidence}",
        f"Upper_{confidence}_Interval",
        f"Interval_Upper_{confidence}",
        f"Calibrated_Upper_{confidence}_Interval",
    ]

    lower = next(
        (
            column
            for column in lower_candidates
            if column in df.columns
        ),
        None,
    )

    upper = next(
        (
            column
            for column in upper_candidates
            if column in df.columns
        ),
        None,
    )

    if lower is None or upper is None:
        return None, None

    return lower, upper


def create_reliability_features(df):
    result = df.copy()

    result["Absolute_Error"] = (
        result["Actual_Yield"]
        - result["Predicted_Yield"]
    ).abs()

    result["Absolute_Error_Percent"] = np.where(
        result["Actual_Yield"].abs() > 0,
        result["Absolute_Error"]
        / result["Actual_Yield"].abs()
        * 100,
        np.nan,
    )

    if "Prediction_STD" in result.columns:
        result["Uncertainty_Percent"] = np.where(
            result["Predicted_Yield"].abs() > 0,
            result["Prediction_STD"].abs()
            / result["Predicted_Yield"].abs()
            * 100,
            np.nan,
        )
    else:
        result["Uncertainty_Percent"] = np.nan

    result["Confidence_Category"] = pd.cut(
        result["Uncertainty_Percent"],
        bins=[-np.inf, 5, 10, 20, np.inf],
        labels=[
            "Very High Confidence",
            "High Confidence",
            "Moderate Confidence",
            "Low Confidence",
        ],
    )

    result["Error_Category"] = pd.cut(
        result["Absolute_Error_Percent"],
        bins=[-np.inf, 5, 10, 20, np.inf],
        labels=[
            "Low Error",
            "Moderate Error",
            "High Error",
            "Very High Error",
        ],
    )

    result["Reliability_Risk_Score"] = (
        result["Absolute_Error_Percent"].fillna(0)
        + result["Uncertainty_Percent"].fillna(0)
    )

    result["Reliability_Risk_Level"] = pd.cut(
        result["Reliability_Risk_Score"],
        bins=[-np.inf, 10, 20, 40, np.inf],
        labels=[
            "Low Risk",
            "Moderate Risk",
            "High Risk",
            "Very High Risk",
        ],
    )

    return result


def calculate_overall_reliability(df):
    rows = []

    for confidence in CONFIDENCE_LEVELS:
        lower, upper = find_interval_columns(
            df,
            confidence,
        )

        if lower is None or upper is None:
            continue

        inside = (
            (df["Actual_Yield"] >= df[lower])
            & (df["Actual_Yield"] <= df[upper])
        )

        coverage = inside.mean()
        nominal = confidence / 100

        width = df[upper] - df[lower]

        coverage_error = (
            coverage - nominal
        )

        rows.append(
            {
                "Confidence_Level_Percent": confidence,
                "Samples": len(df),
                "Nominal_Coverage_Percent": nominal * 100,
                "Observed_Coverage_Percent": coverage * 100,
                "Coverage_Error_Percent": (
                    coverage_error * 100
                ),
                "Absolute_Coverage_Error_Percent": (
                    abs(coverage_error) * 100
                ),
                "Mean_Interval_Width_kg_ha": width.mean(),
                "Median_Interval_Width_kg_ha": width.median(),
                "Mean_Absolute_Error_kg_ha": (
                    df["Absolute_Error"].mean()
                ),
                "Median_Absolute_Error_kg_ha": (
                    df["Absolute_Error"].median()
                ),
                "Mean_Absolute_Error_Percent": (
                    df["Absolute_Error_Percent"].mean()
                ),
                "Outside_Interval_Count": int(
                    (~inside).sum()
                ),
            }
        )

    return pd.DataFrame(rows)


def calculate_group_reliability(df, group_column):
    rows = []

    grouped = df.groupby(
        group_column,
        observed=False,
    )

    for group_value, group in grouped:
        for confidence in CONFIDENCE_LEVELS:
            lower, upper = find_interval_columns(
                group,
                confidence,
            )

            if lower is None or upper is None:
                continue

            inside = (
                (group["Actual_Yield"] >= group[lower])
                & (group["Actual_Yield"] <= group[upper])
            )

            coverage = inside.mean()
            nominal = confidence / 100
            width = group[upper] - group[lower]

            rows.append(
                {
                    group_column: group_value,
                    "Confidence_Level_Percent": confidence,
                    "Samples": len(group),
                    "Nominal_Coverage_Percent": (
                        nominal * 100
                    ),
                    "Observed_Coverage_Percent": (
                        coverage * 100
                    ),
                    "Coverage_Error_Percent": (
                        coverage - nominal
                    )
                    * 100,
                    "Absolute_Coverage_Error_Percent": (
                        abs(coverage - nominal)
                    )
                    * 100,
                    "Mean_Interval_Width_kg_ha": (
                        width.mean()
                    ),
                    "Median_Interval_Width_kg_ha": (
                        width.median()
                    ),
                    "Mean_Absolute_Error_kg_ha": (
                        group["Absolute_Error"].mean()
                    ),
                    "Mean_Absolute_Error_Percent": (
                        group[
                            "Absolute_Error_Percent"
                        ].mean()
                    ),
                    "Outside_Interval_Count": int(
                        (~inside).sum()
                    ),
                }
            )

    return pd.DataFrame(rows)


def calculate_confidence_summary(df):
    summary = (
        df.groupby(
            "Confidence_Category",
            observed=False,
        )
        .agg(
            Samples=("Actual_Yield", "size"),
            Mean_Absolute_Error_kg_ha=(
                "Absolute_Error",
                "mean",
            ),
            Median_Absolute_Error_kg_ha=(
                "Absolute_Error",
                "median",
            ),
            Mean_Absolute_Error_Percent=(
                "Absolute_Error_Percent",
                "mean",
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean",
            ),
        )
        .reset_index()
    )

    return summary


def calculate_risk_summary(df):
    summary = (
        df.groupby(
            "Reliability_Risk_Level",
            observed=False,
        )
        .agg(
            Samples=("Actual_Yield", "size"),
            Mean_Absolute_Error_kg_ha=(
                "Absolute_Error",
                "mean",
            ),
            Mean_Absolute_Error_Percent=(
                "Absolute_Error_Percent",
                "mean",
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean",
            ),
            Mean_Risk_Score=(
                "Reliability_Risk_Score",
                "mean",
            ),
        )
        .reset_index()
    )

    return summary


def calculate_reliability_scores(overall):
    if overall.empty:
        return pd.DataFrame()

    rows = []

    for _, row in overall.iterrows():
        coverage_error = row[
            "Absolute_Coverage_Error_Percent"
        ]

        width = row[
            "Mean_Interval_Width_kg_ha"
        ]

        error = row[
            "Mean_Absolute_Error_kg_ha"
        ]

        coverage_score = max(
            0,
            100 - coverage_error * 5,
        )

        width_score = (
            100
            / (1 + width / 5000)
        )

        error_score = (
            100
            / (1 + error / 1000)
        )

        reliability_score = (
            coverage_score * 0.5
            + width_score * 0.2
            + error_score * 0.3
        )

        rows.append(
            {
                "Confidence_Level_Percent": row[
                    "Confidence_Level_Percent"
                ],
                "Coverage_Score": coverage_score,
                "Interval_Width_Score": width_score,
                "Prediction_Error_Score": error_score,
                "Overall_Reliability_Score": (
                    reliability_score
                ),
            }
        )

    return pd.DataFrame(rows)


def identify_high_risk_predictions(df):
    columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
        "Absolute_Error",
        "Absolute_Error_Percent",
        "Prediction_STD",
        "Uncertainty_Percent",
        "Reliability_Risk_Score",
        "Reliability_Risk_Level",
    ]

    available = [
        column
        for column in columns
        if column in df.columns
    ]

    result = df[available].copy()

    result = result.sort_values(
        "Reliability_Risk_Score",
        ascending=False,
    )

    return result


def identify_miscovered_predictions(df):
    lower, upper = find_interval_columns(
        df,
        95,
    )

    if lower is None or upper is None:
        return pd.DataFrame()

    result = df.copy()

    result["Inside_95_Interval"] = (
        (result["Actual_Yield"] >= result[lower])
        & (result["Actual_Yield"] <= result[upper])
    )

    result = result[
        ~result["Inside_95_Interval"]
    ].copy()

    result["Distance_From_95_Interval"] = np.where(
        result["Actual_Yield"] < result[lower],
        result[lower] - result["Actual_Yield"],
        result["Actual_Yield"] - result[upper],
    )

    columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
        "Prediction_STD",
        lower,
        upper,
        "Absolute_Error",
        "Absolute_Error_Percent",
        "Distance_From_95_Interval",
    ]

    available = [
        column
        for column in columns
        if column in result.columns
    ]

    result = result[available].sort_values(
        "Distance_From_95_Interval",
        ascending=False,
    )

    return result


def save_outputs(
    df,
    overall,
    crop,
    district,
    season,
    year,
    confidence,
    risk,
    scores,
    high_risk,
    miscovered,
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    outputs = {
        "reliability_predictions.csv": df,
        "overall_reliability.csv": overall,
        "crop_reliability.csv": crop,
        "district_reliability.csv": district,
        "season_reliability.csv": season,
        "year_reliability.csv": year,
        "confidence_summary.csv": confidence,
        "risk_summary.csv": risk,
        "reliability_scores.csv": scores,
        "high_risk_predictions.csv": high_risk,
        "miscovered_predictions.csv": miscovered,
    }

    for filename, data in outputs.items():
        data.to_csv(
            OUTPUT_DIR / filename,
            index=False,
        )


def print_section(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main():
    print("=" * 70)
    print("FINAL MODEL RELIABILITY ANALYSIS")
    print("=" * 70)

    df = load_data()

    detect_columns(df)

    df = create_reliability_features(df)

    overall = calculate_overall_reliability(df)

    crop = calculate_group_reliability(
        df,
        "Crop",
    )

    district = calculate_group_reliability(
        df,
        "District",
    )

    season = calculate_group_reliability(
        df,
        "Season",
    )

    year = calculate_group_reliability(
        df,
        "Year",
    )

    confidence = calculate_confidence_summary(
        df
    )

    risk = calculate_risk_summary(df)

    scores = calculate_reliability_scores(
        overall
    )

    high_risk = identify_high_risk_predictions(
        df
    )

    miscovered = identify_miscovered_predictions(
        df
    )

    print_section("OVERALL RELIABILITY")

    if not overall.empty:
        display_overall = overall[
            [
                "Confidence_Level_Percent",
                "Nominal_Coverage_Percent",
                "Observed_Coverage_Percent",
                "Coverage_Error_Percent",
                "Mean_Interval_Width_kg_ha",
                "Mean_Absolute_Error_kg_ha",
                "Outside_Interval_Count",
            ]
        ]

        print(
            display_overall.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("RELIABILITY SCORES")

    if not scores.empty:
        print(
            scores.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("CONFIDENCE SUMMARY")

    if not confidence.empty:
        print(
            confidence.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("RISK SUMMARY")

    if not risk.empty:
        print(
            risk.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("CROP RELIABILITY AT 95%")

    if not crop.empty:
        crop_95 = crop[
            crop["Confidence_Level_Percent"] == 95
        ]

        print(
            crop_95.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("DISTRICT RELIABILITY AT 95%")

    if not district.empty:
        district_95 = district[
            district["Confidence_Level_Percent"] == 95
        ]

        print(
            district_95.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("SEASON RELIABILITY AT 95%")

    if not season.empty:
        season_95 = season[
            season["Confidence_Level_Percent"] == 95
        ]

        print(
            season_95.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("YEAR RELIABILITY AT 95%")

    if not year.empty:
        year_95 = year[
            year["Confidence_Level_Percent"] == 95
        ]

        print(
            year_95.to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section("HIGHEST RELIABILITY RISK")

    if not high_risk.empty:
        print(
            high_risk.head(20).to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )

    print_section(
        "PREDICTIONS OUTSIDE CALIBRATED 95% INTERVAL"
    )

    if not miscovered.empty:
        print(
            miscovered.head(20).to_string(
                index=False,
                float_format=lambda x: f"{x:.4f}",
            )
        )
    else:
        print(
            "No predictions were found outside "
            "the calibrated 95% interval."
        )

    save_outputs(
        df,
        overall,
        crop,
        district,
        season,
        year,
        confidence,
        risk,
        scores,
        high_risk,
        miscovered,
    )

    print_section("OUTPUT")

    print(f"Results directory: {OUTPUT_DIR}")
    print(
        f"Reliability predictions: "
        f"{OUTPUT_DIR / 'reliability_predictions.csv'}"
    )
    print(
        f"Overall reliability: "
        f"{OUTPUT_DIR / 'overall_reliability.csv'}"
    )
    print(
        f"Crop reliability: "
        f"{OUTPUT_DIR / 'crop_reliability.csv'}"
    )
    print(
        f"District reliability: "
        f"{OUTPUT_DIR / 'district_reliability.csv'}"
    )
    print(
        f"Season reliability: "
        f"{OUTPUT_DIR / 'season_reliability.csv'}"
    )
    print(
        f"Year reliability: "
        f"{OUTPUT_DIR / 'year_reliability.csv'}"
    )
    print(
        f"Confidence summary: "
        f"{OUTPUT_DIR / 'confidence_summary.csv'}"
    )
    print(
        f"Risk summary: "
        f"{OUTPUT_DIR / 'risk_summary.csv'}"
    )
    print(
        f"Reliability scores: "
        f"{OUTPUT_DIR / 'reliability_scores.csv'}"
    )
    print(
        f"High-risk predictions: "
        f"{OUTPUT_DIR / 'high_risk_predictions.csv'}"
    )
    print(
        f"Miscovered predictions: "
        f"{OUTPUT_DIR / 'miscovered_predictions.csv'}"
    )

    print()
    print("=" * 70)
    print("RELIABILITY ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
