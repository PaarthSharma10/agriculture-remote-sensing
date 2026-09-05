from fastapi import APIRouter, HTTPException
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ML_DATASET = PROJECT_ROOT / "data" / "ml" / "ml_dataset.csv"


@router.get("/")
def get_dataset(limit: int | None = None):
    """Return the full ML dataset (optionally limited) as row records."""
    if not ML_DATASET.exists():
        raise HTTPException(
            status_code=404,
            detail="ML dataset not found",
        )

    df = pd.read_csv(ML_DATASET)

    if limit is not None and limit > 0:
        df = df.head(limit)

    return {
        "count": len(df),
        "dataset": df.to_dict(orient="records"),
    }