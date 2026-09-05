from pathlib import Path

import pandas as pd
from sklearn.metrics import r2_score


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "reliability_analysis"
    / "reliability_predictions.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "final_model_evaluation"
)

OUTPUT_FILE = OUTPUT_DIR / "corrected_overall_metrics.csv"


def main():
    print("=" * 70)
    print("CORRECTING OVERALL R2")
    print("=" * 70)

    df = pd.read_csv(INPUT_FILE)

    actual = pd.to_numeric(
        df["Actual_Yield"],
        errors="coerce",
    )

    predicted = pd.to_numeric(
        df["Predicted_Yield"],
        errors="coerce",
    )

    valid = actual.notna() & predicted.notna()

    actual = actual[valid]
    predicted = predicted[valid]

    if len(actual) < 2:
        raise ValueError("Not enough valid predictions for R2 calculation.")

    r2 = r2_score(actual, predicted)

    mae = (actual - predicted).abs().mean()

    rmse = (
        ((actual - predicted) ** 2).mean()
        ** 0.5
    )

    mean_residual = (actual - predicted).mean()

    result = pd.DataFrame(
        {
            "Metric": [
                "Samples",
                "MAE_kg_ha",
                "RMSE_kg_ha",
                "R2",
                "Mean_Residual_kg_ha",
            ],
            "Value": [
                len(actual),
                mae,
                rmse,
                r2,
                mean_residual,
            ],
        }
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    result.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("CORRECTED OVERALL METRICS")
    print("-" * 70)
    print(f"Samples:              {len(actual)}")
    print(f"MAE:                  {mae:.4f} kg/ha")
    print(f"RMSE:                 {rmse:.4f} kg/ha")
    print(f"R2:                   {r2:.6f}")
    print(f"Mean Residual:        {mean_residual:.4f} kg/ha")
    print()
    print(f"Output: {OUTPUT_FILE}")
    print("=" * 70)
    print("OVERALL R2 CORRECTION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
