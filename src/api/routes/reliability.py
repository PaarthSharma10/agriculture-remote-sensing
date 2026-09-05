from fastapi import APIRouter
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

RELIABILITY_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "reliability_analysis"
)


@router.get("/")
def get_reliability():
    file_path = RELIABILITY_DIR / "overall_reliability.csv"

    if not file_path.exists():
        return {"reliability": []}

    df = pd.read_csv(file_path)

    return {
        "reliability": df.to_dict(orient="records")
    }


@router.get("/scores")
def get_reliability_scores():
    file_path = RELIABILITY_DIR / "reliability_scores.csv"

    if not file_path.exists():
        return {"scores": []}

    df = pd.read_csv(file_path)

    return {
        "scores": df.to_dict(orient="records")
    }


@router.get("/risk")
def get_risk_summary():
    file_path = RELIABILITY_DIR / "risk_summary.csv"

    if not file_path.exists():
        return {"risk": []}

    df = pd.read_csv(file_path)

    return {
        "risk": df.to_dict(orient="records")
    }
