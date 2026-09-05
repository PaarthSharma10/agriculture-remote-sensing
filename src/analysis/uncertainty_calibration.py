from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "prediction_uncertainty"
    / "prediction_uncertainty_predictions.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "uncertainty_calibration"
)


GROUP_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop"
]

TARGET_COLUMN = "Actual_Yield"

PREDICTION_COLUMN = "Predicted_Yield"

LOWER_COLUMN = "Lower_95_Interval"

UPPER_COLUMN = "Upper_95_Interval"

STD_COLUMN = "Prediction_STD"

CONFIDENCE_LEVELS = {
    "80": 1.2816,
    "90": 1.6449,
    "95": 1.9600,
    "99": 2.5758
}


def load_predictions():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Prediction uncertainty file not found: {INPUT_FILE}"
        )

    data = pd.read_csv(INPUT_FILE)

    print(
        f"Prediction uncertainty rows loaded: {len(data)}"
    )

    print(
        f"Prediction uncertainty columns loaded: {len(data.columns)}"
    )

    return data


def validate_data(data):
    required_columns = (
        GROUP_COLUMNS
        + [
            TARGET_COLUMN,
            PREDICTION_COLUMN,
            STD_COLUMN,
            LOWER_COLUMN,
            UPPER_COLUMN
        ]
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    numeric_columns = [
        TARGET_COLUMN,
        PREDICTION_COLUMN,
        STD_COLUMN,
        LOWER_COLUMN,
        UPPER_COLUMN
    ]

    for column in numeric_columns:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        )

    if data[numeric_columns].isnull().any().any():
        missing = data[numeric_columns].isnull().sum()
        missing = missing[missing > 0]

        raise ValueError(
            f"Missing or invalid numeric values detected:\n{missing}"
        )

    if (data[STD_COLUMN] < 0).any():
        raise ValueError(
            "Negative prediction standard deviations detected."
        )

    return data


def create_intervals(data):
    result = data.copy()

    prediction = result[PREDICTION_COLUMN]
    prediction_std = result[STD_COLUMN]

    for level, z_score in CONFIDENCE_LEVELS.items():
        alpha = 1.0 - (
            float(level) / 100.0
        )

        lower_name = (
            f"Lower_{level}_Interval"
        )

        upper_name = (
            f"Upper_{level}_Interval"
        )

        result[lower_name] = (
            prediction
            - z_score * prediction_std
        )

        result[upper_name] = (
            prediction
            + z_score * prediction_std
        )

        result[
            f"Interval_Width_{level}"
        ] = (
            result[upper_name]
            - result[lower_name]
        )

        result[
            f"Covered_{level}"
        ] = (
            result[TARGET_COLUMN]
            >= result[lower_name]
        ) & (
            result[TARGET_COLUMN]
            <= result[upper_name]
        )

        result[
            f"Coverage_Error_{level}"
        ] = (
            result[f"Covered_{level}"].astype(int)
            - (1.0 - alpha)
        )

    return result


def calculate_overall_calibration(data):
    rows = []

    for level in CONFIDENCE_LEVELS:
        covered = data[
            f"Covered_{level}"
        ]

        nominal_coverage = (
            float(level) / 100.0
        )

        empirical_coverage = (
            covered.mean()
        )

        interval_width = data[
            f"Interval_Width_{level}"
        ]

        rows.append(
            {
                "Confidence_Level_Percent":
                    float(level),
                "Nominal_Coverage":
                    nominal_coverage,
                "Observed_Coverage":
                    empirical_coverage,
                "Coverage_Percent":
                    empirical_coverage * 100.0,
                "Coverage_Error_Percent":
                    (
                        empirical_coverage
                        - nominal_coverage
                    ) * 100.0,
                "Mean_Interval_Width_kg_ha":
                    interval_width.mean(),
                "Median_Interval_Width_kg_ha":
                    interval_width.median(),
                "Minimum_Interval_Width_kg_ha":
                    interval_width.min(),
                "Maximum_Interval_Width_kg_ha":
                    interval_width.max(),
                "Samples":
                    len(data)
            }
        )

    return pd.DataFrame(rows)


def calculate_group_calibration(
    data,
    group_column
):
    rows = []

    for group_value, group in data.groupby(
        group_column
    ):
        row = {
            group_column: group_value,
            "Samples": len(group)
        }

        for level in CONFIDENCE_LEVELS:
            covered = group[
                f"Covered_{level}"
            ]

            nominal = (
                float(level) / 100.0
            )

            observed = covered.mean()

            width = group[
                f"Interval_Width_{level}"
            ]

            row[
                f"Coverage_{level}_Percent"
            ] = observed * 100.0

            row[
                f"Nominal_{level}_Percent"
            ] = nominal * 100.0

            row[
                f"Coverage_Error_{level}_Percent"
            ] = (
                observed - nominal
            ) * 100.0

            row[
                f"Mean_Interval_Width_{level}_kg_ha"
            ] = width.mean()

        rows.append(row)

    return pd.DataFrame(rows)


def calculate_miscoverage(data):
    rows = []

    for level in CONFIDENCE_LEVELS:
        covered = data[
            f"Covered_{level}"
        ]

        nominal = (
            float(level) / 100.0
        )

        miscoverage = (
            1.0 - covered.mean()
        )

        nominal_miscoverage = (
            1.0 - nominal
        )

        rows.append(
            {
                "Confidence_Level_Percent":
                    float(level),
                "Nominal_Miscoverage_Percent":
                    nominal_miscoverage * 100.0,
                "Observed_Miscoverage_Percent":
                    miscoverage * 100.0,
                "Miscoverage_Error_Percent":
                    (
                        miscoverage
                        - nominal_miscoverage
                    ) * 100.0,
                "Outside_Interval_Count":
                    int((~covered).sum()),
                "Samples":
                    len(data)
            }
        )

    return pd.DataFrame(rows)


def calculate_interval_score(
    data,
    confidence_level
):
    z_score = CONFIDENCE_LEVELS[
        str(confidence_level)
    ]

    alpha = 1.0 - (
        confidence_level / 100.0
    )

    lower = (
        data[PREDICTION_COLUMN]
        - z_score * data[STD_COLUMN]
    )

    upper = (
        data[PREDICTION_COLUMN]
        + z_score * data[STD_COLUMN]
    )

    actual = data[TARGET_COLUMN]

    width = upper - lower

    penalty_lower = (
        (2.0 / alpha)
        * (lower - actual)
        * (actual < lower)
    )

    penalty_upper = (
        (2.0 / alpha)
        * (actual - upper)
        * (actual > upper)
    )

    score = (
        width
        + penalty_lower
        + penalty_upper
    )

    return score


def calculate_interval_scores(data):
    rows = []

    for level in CONFIDENCE_LEVELS:
        scores = calculate_interval_score(
            data,
            int(level)
        )

        rows.append(
            {
                "Confidence_Level_Percent":
                    float(level),
                "Mean_Interval_Score":
                    scores.mean(),
                "Median_Interval_Score":
                    scores.median(),
                "Minimum_Interval_Score":
                    scores.min(),
                "Maximum_Interval_Score":
                    scores.max()
            }
        )

    return pd.DataFrame(rows)


def calculate_crop_calibration(data):
    return calculate_group_calibration(
        data,
        "Crop"
    )


def calculate_district_calibration(data):
    return calculate_group_calibration(
        data,
        "District"
    )


def calculate_season_calibration(data):
    return calculate_group_calibration(
        data,
        "Season"
    )


def calculate_year_calibration(data):
    return calculate_group_calibration(
        data,
        "Year"
    )


def calculate_high_miscoverage(data):
    rows = []

    for level in CONFIDENCE_LEVELS:
        lower = data[
            f"Lower_{level}_Interval"
        ]

        upper = data[
            f"Upper_{level}_Interval"
        ]

        actual = data[
            TARGET_COLUMN
        ]

        outside = (
            (actual < lower)
            | (actual > upper)
        )

        subset = data.loc[
            outside,
            GROUP_COLUMNS
            + [
                TARGET_COLUMN,
                PREDICTION_COLUMN,
                STD_COLUMN
            ]
        ].copy()

        if subset.empty:
            continue

        subset[
            "Confidence_Level_Percent"
        ] = float(level)

        subset[
            "Interval_Lower"
        ] = lower[outside].values

        subset[
            "Interval_Upper"
        ] = upper[outside].values

        subset[
            "Absolute_Error"
        ] = (
            subset[TARGET_COLUMN]
            - subset[PREDICTION_COLUMN]
        ).abs()

        subset[
            "Distance_From_Interval"
        ] = np.where(
            subset[TARGET_COLUMN]
            < subset["Interval_Lower"],
            subset["Interval_Lower"]
            - subset[TARGET_COLUMN],
            subset[TARGET_COLUMN]
            - subset["Interval_Upper"]
        )

        rows.append(subset)

    if not rows:
        return pd.DataFrame(
            columns=GROUP_COLUMNS
            + [
                TARGET_COLUMN,
                PREDICTION_COLUMN,
                STD_COLUMN,
                "Confidence_Level_Percent",
                "Interval_Lower",
                "Interval_Upper",
                "Absolute_Error",
                "Distance_From_Interval"
            ]
        )

    result = pd.concat(
        rows,
        ignore_index=True
    )

    return result.sort_values(
        [
            "Confidence_Level_Percent",
            "Distance_From_Interval"
        ],
        ascending=[True, False]
    )


def calculate_calibration_summary(
    overall,
    interval_scores
):
    rows = []

    for _, row in overall.iterrows():
        level = row[
            "Confidence_Level_Percent"
        ]

        score_row = interval_scores[
            interval_scores[
                "Confidence_Level_Percent"
            ] == level
        ]

        interval_score = (
            score_row[
                "Mean_Interval_Score"
            ].iloc[0]
        )

        coverage_error = abs(
            row[
                "Coverage_Error_Percent"
            ]
        )

        if coverage_error <= 5:
            status = "Well calibrated"
        elif coverage_error <= 10:
            status = "Moderately calibrated"
        else:
            status = "Poorly calibrated"

        rows.append(
            {
                "Confidence_Level_Percent":
                    level,
                "Observed_Coverage_Percent":
                    row[
                        "Coverage_Percent"
                    ],
                "Nominal_Coverage_Percent":
                    row[
                        "Nominal_Coverage"
                    ] * 100.0,
                "Absolute_Coverage_Error_Percent":
                    coverage_error,
                "Mean_Interval_Width_kg_ha":
                    row[
                        "Mean_Interval_Width_kg_ha"
                    ],
                "Mean_Interval_Score":
                    interval_score,
                "Calibration_Status":
                    status
            }
        )

    return pd.DataFrame(rows)


def save_results(
    interval_data,
    overall,
    crop,
    district,
    season,
    year,
    miscoverage,
    interval_scores,
    calibration_summary,
    outside
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    interval_data.to_csv(
        OUTPUT_DIR
        / "calibrated_prediction_intervals.csv",
        index=False
    )

    overall.to_csv(
        OUTPUT_DIR
        / "overall_calibration.csv",
        index=False
    )

    crop.to_csv(
        OUTPUT_DIR
        / "crop_calibration.csv",
        index=False
    )

    district.to_csv(
        OUTPUT_DIR
        / "district_calibration.csv",
        index=False
    )

    season.to_csv(
        OUTPUT_DIR
        / "season_calibration.csv",
        index=False
    )

    year.to_csv(
        OUTPUT_DIR
        / "year_calibration.csv",
        index=False
    )

    miscoverage.to_csv(
        OUTPUT_DIR
        / "miscoverage_analysis.csv",
        index=False
    )

    interval_scores.to_csv(
        OUTPUT_DIR
        / "interval_scores.csv",
        index=False
    )

    calibration_summary.to_csv(
        OUTPUT_DIR
        / "calibration_summary.csv",
        index=False
    )

    outside.to_csv(
        OUTPUT_DIR
        / "outside_interval_predictions.csv",
        index=False
    )


def print_overall_results(
    overall,
    calibration_summary
):
    print()
    print("=" * 70)
    print("OVERALL INTERVAL CALIBRATION")
    print("=" * 70)

    display_columns = [
        "Confidence_Level_Percent",
        "Nominal_Coverage",
        "Observed_Coverage",
        "Coverage_Percent",
        "Coverage_Error_Percent",
        "Mean_Interval_Width_kg_ha",
        "Median_Interval_Width_kg_ha"
    ]

    print(
        overall[
            display_columns
        ].round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("CALIBRATION STATUS")
    print("=" * 70)

    print(
        calibration_summary.round(4).to_string(
            index=False
        )
    )


def print_group_results(
    title,
    data,
    group_column
):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)

    columns = [
        group_column,
        "Samples",
        "Coverage_95_Percent",
        "Coverage_Error_95_Percent",
        "Mean_Interval_Width_95_kg_ha"
    ]

    print(
        data[
            columns
        ].round(4).to_string(
            index=False
        )
    )


def print_outside_interval(
    outside
):
    print()
    print("=" * 70)
    print("PREDICTIONS OUTSIDE 95% INTERVAL")
    print("=" * 70)

    if outside.empty:
        print(
            "No observations fell outside the evaluated intervals."
        )
        return

    subset = outside[
        outside[
            "Confidence_Level_Percent"
        ] == 95.0
    ].copy()

    subset = subset.sort_values(
        "Distance_From_Interval",
        ascending=False
    )

    print(
        subset.head(20).round(2).to_string(
            index=False
        )
    )


def main():
    print("=" * 70)
    print("PREDICTION INTERVAL CALIBRATION ANALYSIS")
    print("=" * 70)

    data = load_predictions()

    data = validate_data(
        data
    )

    data = create_intervals(
        data
    )

    overall = calculate_overall_calibration(
        data
    )

    crop = calculate_crop_calibration(
        data
    )

    district = calculate_district_calibration(
        data
    )

    season = calculate_season_calibration(
        data
    )

    year = calculate_year_calibration(
        data
    )

    miscoverage = calculate_miscoverage(
        data
    )

    interval_scores = calculate_interval_scores(
        data
    )

    calibration_summary = (
        calculate_calibration_summary(
            overall,
            interval_scores
        )
    )

    outside = calculate_high_miscoverage(
        data
    )

    print_overall_results(
        overall,
        calibration_summary
    )

    print_group_results(
        "CROP-WISE 95% CALIBRATION",
        crop,
        "Crop"
    )

    print_group_results(
        "DISTRICT-WISE 95% CALIBRATION",
        district,
        "District"
    )

    print_group_results(
        "SEASON-WISE 95% CALIBRATION",
        season,
        "Season"
    )

    print_group_results(
        "YEAR-WISE 95% CALIBRATION",
        year,
        "Year"
    )

    print()
    print("=" * 70)
    print("MIS-COVERAGE ANALYSIS")
    print("=" * 70)

    print(
        miscoverage.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("INTERVAL SCORES")
    print("=" * 70)

    print(
        interval_scores.round(4).to_string(
            index=False
        )
    )

    print_outside_interval(
        outside
    )

    save_results(
        data,
        overall,
        crop,
        district,
        season,
        year,
        miscoverage,
        interval_scores,
        calibration_summary,
        outside
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
        f"Calibrated intervals: "
        f"{OUTPUT_DIR / 'calibrated_prediction_intervals.csv'}"
    )

    print(
        f"Overall calibration: "
        f"{OUTPUT_DIR / 'overall_calibration.csv'}"
    )

    print(
        f"Crop calibration: "
        f"{OUTPUT_DIR / 'crop_calibration.csv'}"
    )

    print(
        f"District calibration: "
        f"{OUTPUT_DIR / 'district_calibration.csv'}"
    )

    print(
        f"Season calibration: "
        f"{OUTPUT_DIR / 'season_calibration.csv'}"
    )

    print(
        f"Year calibration: "
        f"{OUTPUT_DIR / 'year_calibration.csv'}"
    )

    print(
        f"Miscoverage analysis: "
        f"{OUTPUT_DIR / 'miscoverage_analysis.csv'}"
    )

    print(
        f"Interval scores: "
        f"{OUTPUT_DIR / 'interval_scores.csv'}"
    )

    print(
        f"Calibration summary: "
        f"{OUTPUT_DIR / 'calibration_summary.csv'}"
    )

    print(
        f"Outside interval predictions: "
        f"{OUTPUT_DIR / 'outside_interval_predictions.csv'}"
    )

    print()
    print("=" * 70)
    print("PREDICTION INTERVAL CALIBRATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
