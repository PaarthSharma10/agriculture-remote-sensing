from fastapi import APIRouter
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ML_DATASET = PROJECT_ROOT / "data" / "ml" / "ml_dataset.csv"


@router.get("/")
def get_districts():
    if not ML_DATASET.exists():
        return {
            "count": 0,
            "districts": []
        }

    df = pd.read_csv(ML_DATASET)

    district_column = next(
        (
            column
            for column in df.columns
            if column.lower() == "district"
        ),
        None
    )

    if district_column is None:
        return {
            "count": 0,
            "districts": []
        }

    districts = sorted(
        df[district_column]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    return {
        "count": len(districts),
        "districts": districts
    }


@router.get("/{district_name}")
def get_district(district_name: str):
    if not ML_DATASET.exists():
        return {
            "error": "ML dataset not found"
        }

    df = pd.read_csv(ML_DATASET)

    district_column = next(
        (
            column
            for column in df.columns
            if column.lower() == "district"
        ),
        None
    )

    if district_column is None:
        return {
            "error": "District column not found"
        }

    district_df = df[
        df[district_column]
        .astype(str)
        .str.lower()
        == district_name.lower()
    ]

    if district_df.empty:
        return {
            "error": f"District '{district_name}' not found"
        }

    return {
        "district": district_name,
        "samples": len(district_df),
        "data": district_df.to_dict(orient="records")
    }
