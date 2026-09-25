from fastapi import APIRouter, HTTPException
import pandas as pd

from src.api.paths import data_path

router = APIRouter()

# Cross-validated predictions with 95% intervals and reliability scores.
# Its row count matches data/features/ml_features.csv exactly (162 rows over
# the same district/season/crop keys), which the frontend asserts so that
# samples and predictions stay in step.
PREDICTIONS_FILE = data_path(
    "analysis",
    "ml",
    "final_evaluation",
    "reliability_analysis",
    "reliability_predictions.csv",
)


def load_predictions():
    if not PREDICTIONS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Reliability predictions file not found"
        )

    return pd.read_csv(PREDICTIONS_FILE)


@router.get("", include_in_schema=False)  # bare form: /api/predictions
@router.get("/")
def get_predictions(
    district: str | None = None,
    crop: str | None = None,
    year: int | None = None,
    season: str | None = None
):
    df = load_predictions()

    if district:
        df = df[
            df["District"].astype(str).str.lower()
            == district.lower()
        ]

    if crop:
        df = df[
            df["Crop"].astype(str).str.lower()
            == crop.lower()
        ]

    if year:
        df = df[df["Year"] == year]

    if season:
        df = df[
            df["Season"].astype(str).str.lower()
            == season.lower()
        ]

    return {
        "count": len(df),
        "filters": {
            "district": district,
            "crop": crop,
            "year": year,
            "season": season
        },
        "predictions": df.to_dict(orient="records")
    }


@router.get("/summary")
def get_prediction_summary():
    df = load_predictions()

    result = {
        "samples": len(df)
    }

    numeric_columns = [
        "Actual_Yield",
        "Predicted_Yield",
        "Absolute_Error",
        "Prediction_STD",
        "Uncertainty_Percent",
        "Reliability_Risk_Score"
    ]

    for column in numeric_columns:
        if column in df.columns:
            result[column] = float(df[column].mean())

    return result
