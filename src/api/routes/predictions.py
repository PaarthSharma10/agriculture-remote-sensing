from fastapi import APIRouter, HTTPException
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

PREDICTIONS_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "reliability_analysis"
    / "reliability_predictions.csv"
)


def load_predictions():
    if not PREDICTIONS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Reliability predictions file not found"
        )

    return pd.read_csv(PREDICTIONS_FILE)


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
