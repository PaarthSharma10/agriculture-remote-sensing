from fastapi import APIRouter
import pandas as pd

from src.api.paths import data_path

router = APIRouter()


def reliability_file(name: str):
    """Path to a file inside data/analysis/ml/final_evaluation/
    reliability_analysis/, falling back to the bundled copy on hosts where
    the full data/ tree is not deployed."""
    return data_path(
        "analysis",
        "ml",
        "final_evaluation",
        "reliability_analysis",
        name,
    )


@router.get("", include_in_schema=False)  # bare form: /api/reliability
@router.get("/")
def get_reliability():
    file_path = reliability_file("overall_reliability.csv")

    if not file_path.exists():
        return {"reliability": []}

    df = pd.read_csv(file_path)

    return {
        "reliability": df.to_dict(orient="records")
    }


@router.get("/scores")
def get_reliability_scores():
    file_path = reliability_file("reliability_scores.csv")

    if not file_path.exists():
        return {"scores": []}

    df = pd.read_csv(file_path)

    return {
        "scores": df.to_dict(orient="records")
    }


@router.get("/risk")
def get_risk_summary():
    file_path = reliability_file("risk_summary.csv")

    if not file_path.exists():
        return {"risk": []}

    df = pd.read_csv(file_path)

    return {
        "risk": df.to_dict(orient="records")
    }
