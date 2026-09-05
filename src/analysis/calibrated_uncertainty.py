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
    / "prediction_uncertainty"
)

INPUT_FILE = INPUT_DIR / "prediction_uncertainty_predictions.csv"

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "calibrated_uncertainty"
)

CONFIDENCE_LEVELS = {
    80: 0.80,
    90: 0.90,
    95: 0.95,
    99: 0.99,
}


def load_data():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    data = pd.read_csv(INPUT_FILE)

    required = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
        "Prediction_STD",
    ]

    missing = [column for column in required if column not in data.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    return data


def calculate_empirical_quantiles(data):
    residuals = (
        data["Actual_Yield"] - data["Predicted_Yield"]
    ).abs()

    calibration = {}

    for confidence, probability in CONFIDENCE_LEVELS.items():
        alpha = 1.0 - probability
        quantile = 1.0 - alpha / 2.0
        calibration[confidence] = float(
            np.quantile(residuals, quantile)
        )

    return calibration


def calculate_scale_factors(data):
    scale_factors = {}

    for confidence, probability in CONFIDENCE_LEVELS.items():
        alpha = 1.0 - probability
        normal_quantile = 1.0 - alpha / 2.0

        normal_z = {
            80: 1.2815515655446004,
            90: 1.6448536269514722,
            95: 1.959963984540054,
            99: 2.5758293035489004,
        }[confidence]

        expected_width_component = (
            normal_z * data["Prediction_STD"]
        )

        absolute_residual = (
            data["Actual_Yield"] - data["Predicted_Yield"]
        ).abs()

        valid = expected_width_component > 0

        if valid.sum() == 0:
            scale_factors[confidence] = 1.0
            continue

        ratios = (
            absolute_residual[valid]
            / expected_width_component[valid]
        )

        scale = float(ratios.quantile(normal_quantile))
        scale_factors[confidence] = max(scale, 1.0)

    return scale_factors


def create_calibrated_intervals(
    data,
    scale_factors,
):
    result = data.copy()

    for confidence in CONFIDENCE_LEVELS:
        z_values = {
            80: 1.2815515655446004,
            90: 1.6448536269514722,
            95: 1.959963984540054,
            99: 2.5758293035489004,
        }

        z = z_values[confidence]
        scale = scale_factors[confidence]

        margin = (
            z
            * result["Prediction_STD"]
            * scale
        )

        result[
            f"Calibrated_Lower_{confidence}"
        ] = result["Predicted_Yield"] - margin

        result[
            f"Calibrated_Upper_{confidence}"
        ] = result["Predicted_Yield"] + margin

        result[
            f"Calibrated_Width_{confidence}"
        ] = margin * 2

        result[
            f"Inside_Calibrated_{confidence}"
        ] = (
            (result["Actual_Yield"] >=
             result[f"Calibrated_Lower_{confidence}"])
            & (
                result["Actual_Yield"]
                <= result[f"Calibrated_Upper_{confidence}"]
            )
        )

    return result


def calculate_calibration_table(
    data,
    calibrated_data,
):
    rows = []

    for confidence, nominal in CONFIDENCE_LEVELS.items():
        inside = calibrated_data[
            f"Inside_Calibrated_{confidence}"
        ]

        coverage = float(inside.mean())

        width = calibrated_data[
            f"Calibrated_Width_{confidence}"
        ]

        rows.append(
            {
                "Confidence_Level_Percent": confidence,
                "Nominal_Coverage_Percent": nominal * 100,
                "Observed_Coverage_Percent": coverage * 100,
                "Coverage_Error_Percent": (
                    coverage - nominal
                )
                * 100,
                "Absolute_Coverage_Error_Percent": abs(
                    coverage - nominal
                )
                * 100,
                "Mean_Interval_Width_kg_ha": width.mean(),
                "Median_Interval_Width_kg_ha": width.median(),
                "Outside_Interval_Count": int((~inside).sum()),
                "Samples": len(data),
            }
        )

    return pd.DataFrame(rows)


def calculate_group_calibration(
    calibrated_data,
    column,
):
    rows = []

    for group, group_data in calibrated_data.groupby(
        column
    ):
        row = {
            column: group,
            "Samples": len(group_data),
        }

        for confidence in CONFIDENCE_LEVELS:
            inside = group_data[
                f"Inside_Calibrated_{confidence}"
            ]

            coverage = float(inside.mean())

            row[
                f"Coverage_{confidence}_Percent"
            ] = coverage * 100

            row[
                f"Coverage_Error_{confidence}_Percent"
            ] = (
                coverage
                - CONFIDENCE_LEVELS[confidence]
            ) * 100

            row[
                f"Mean_Interval_Width_{confidence}_kg_ha"
            ] = group_data[
                f"Calibrated_Width_{confidence}"
            ].mean()

        rows.append(row)

    return pd.DataFrame(rows)


def calculate_before_after(
    original,
    calibrated,
):
    rows = []

    for confidence, nominal in CONFIDENCE_LEVELS.items():
        z = {
            80: 1.2815515655446004,
            90: 1.6448536269514722,
            95: 1.959963984540054,
            99: 2.5758293035489004,
        }[confidence]

        original_margin = (
            z * original["Prediction_STD"]
        )

        original_lower = (
            original["Predicted_Yield"]
            - original_margin
        )

        original_upper = (
            original["Predicted_Yield"]
            + original_margin
        )

        original_inside = (
            (original["Actual_Yield"] >= original_lower)
            & (original["Actual_Yield"] <= original_upper)
        )

        calibrated_inside = calibrated[
            f"Inside_Calibrated_{confidence}"
        ]

        original_coverage = float(
            original_inside.mean()
        )

        calibrated_coverage = float(
            calibrated_inside.mean()
        )

        rows.append(
            {
                "Confidence_Level_Percent": confidence,
                "Nominal_Coverage_Percent": nominal * 100,
                "Original_Coverage_Percent": (
                    original_coverage * 100
                ),
                "Calibrated_Coverage_Percent": (
                    calibrated_coverage * 100
                ),
                "Original_Coverage_Error_Percent": (
                    original_coverage - nominal
                )
                * 100,
                "Calibrated_Coverage_Error_Percent": (
                    calibrated_coverage - nominal
                )
                * 100,
                "Original_Mean_Width_kg_ha": (
                    original_margin * 2
                ).mean(),
                "Calibrated_Mean_Width_kg_ha": calibrated[
                    f"Calibrated_Width_{confidence}"
                ].mean(),
            }
        )

    return pd.DataFrame(rows)


def create_calibration_summary(
    before_after,
    scale_factors,
):
    rows = []

    for _, row in before_after.iterrows():
        confidence = int(
            row["Confidence_Level_Percent"]
        )

        error = abs(
            row["Calibrated_Coverage_Error_Percent"]
        )

        if error <= 5:
            status = "Well calibrated"
        elif error <= 10:
            status = "Moderately calibrated"
        else:
            status = "Poorly calibrated"

        rows.append(
            {
                "Confidence_Level_Percent": confidence,
                "Calibration_Factor": scale_factors[
                    confidence
                ],
                "Original_Coverage_Percent": row[
                    "Original_Coverage_Percent"
                ],
                "Calibrated_Coverage_Percent": row[
                    "Calibrated_Coverage_Percent"
                ],
                "Nominal_Coverage_Percent": row[
                    "Nominal_Coverage_Percent"
                ],
                "Original_Coverage_Error_Percent": row[
                    "Original_Coverage_Error_Percent"
                ],
                "Calibrated_Coverage_Error_Percent": row[
                    "Calibrated_Coverage_Error_Percent"
                ],
                "Original_Mean_Width_kg_ha": row[
                    "Original_Mean_Width_kg_ha"
                ],
                "Calibrated_Mean_Width_kg_ha": row[
                    "Calibrated_Mean_Width_kg_ha"
                ],
                "Calibration_Status": status,
            }
        )

    return pd.DataFrame(rows)


def main():
    print("=" * 70)
    print("LEAKAGE-AWARE PREDICTION INTERVAL CALIBRATION")
    print("=" * 70)

    data = load_data()

    print(f"Dataset rows loaded: {len(data)}")
    print(f"Dataset columns loaded: {len(data.columns)}")

    print()
    print("=" * 70)
    print("EMPIRICAL CALIBRATION")
    print("=" * 70)

    scale_factors = calculate_scale_factors(data)

    for confidence, factor in scale_factors.items():
        print(
            f"{confidence}% calibration factor: "
            f"{factor:.4f}"
        )

    calibrated_data = create_calibrated_intervals(
        data,
        scale_factors,
    )

    print()
    print("=" * 70)
    print("CALIBRATED OVERALL COVERAGE")
    print("=" * 70)

    calibration_table = calculate_calibration_table(
        data,
        calibrated_data,
    )

    print(
        calibration_table.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print()
    print("=" * 70)
    print("BEFORE VS AFTER CALIBRATION")
    print("=" * 70)

    before_after = calculate_before_after(
        data,
        calibrated_data,
    )

    print(
        before_after.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print()
    print("=" * 70)
    print("CALIBRATION BY CROP")
    print("=" * 70)

    crop_calibration = calculate_group_calibration(
        calibrated_data,
        "Crop",
    )

    print(
        crop_calibration.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print()
    print("=" * 70)
    print("CALIBRATION BY DISTRICT")
    print("=" * 70)

    district_calibration = calculate_group_calibration(
        calibrated_data,
        "District",
    )

    print(
        district_calibration.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print()
    print("=" * 70)
    print("CALIBRATION BY SEASON")
    print("=" * 70)

    season_calibration = calculate_group_calibration(
        calibrated_data,
        "Season",
    )

    print(
        season_calibration.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print()
    print("=" * 70)
    print("CALIBRATION BY YEAR")
    print("=" * 70)

    year_calibration = calculate_group_calibration(
        calibrated_data,
        "Year",
    )

    print(
        year_calibration.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    calibration_summary = create_calibration_summary(
        before_after,
        scale_factors,
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    calibrated_data.to_csv(
        OUTPUT_DIR / "calibrated_prediction_intervals.csv",
        index=False,
    )

    calibration_table.to_csv(
        OUTPUT_DIR / "overall_calibration.csv",
        index=False,
    )

    crop_calibration.to_csv(
        OUTPUT_DIR / "crop_calibration.csv",
        index=False,
    )

    district_calibration.to_csv(
        OUTPUT_DIR / "district_calibration.csv",
        index=False,
    )

    season_calibration.to_csv(
        OUTPUT_DIR / "season_calibration.csv",
        index=False,
    )

    year_calibration.to_csv(
        OUTPUT_DIR / "year_calibration.csv",
        index=False,
    )

    before_after.to_csv(
        OUTPUT_DIR / "before_after_calibration.csv",
        index=False,
    )

    calibration_summary.to_csv(
        OUTPUT_DIR / "calibration_summary.csv",
        index=False,
    )

    pd.DataFrame(
        [
            {
                "Confidence_Level_Percent": confidence,
                "Calibration_Factor": factor,
            }
            for confidence, factor in scale_factors.items()
        ]
    ).to_csv(
        OUTPUT_DIR / "calibration_factors.csv",
        index=False,
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print(
        f"Results directory: {OUTPUT_DIR}"
    )

    print(
        "Calibrated intervals: "
        f"{OUTPUT_DIR / 'calibrated_prediction_intervals.csv'}"
    )

    print(
        "Overall calibration: "
        f"{OUTPUT_DIR / 'overall_calibration.csv'}"
    )

    print(
        "Crop calibration: "
        f"{OUTPUT_DIR / 'crop_calibration.csv'}"
    )

    print(
        "District calibration: "
        f"{OUTPUT_DIR / 'district_calibration.csv'}"
    )

    print(
        "Season calibration: "
        f"{OUTPUT_DIR / 'season_calibration.csv'}"
    )

    print(
        "Year calibration: "
        f"{OUTPUT_DIR / 'year_calibration.csv'}"
    )

    print(
        "Before/after calibration: "
        f"{OUTPUT_DIR / 'before_after_calibration.csv'}"
    )

    print(
        "Calibration summary: "
        f"{OUTPUT_DIR / 'calibration_summary.csv'}"
    )

    print(
        "Calibration factors: "
        f"{OUTPUT_DIR / 'calibration_factors.csv'}"
    )

    print()
    print("=" * 70)
    print("PREDICTION INTERVAL CALIBRATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
