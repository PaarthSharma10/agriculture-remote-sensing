from fastapi import APIRouter
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ML_DATASET = PROJECT_ROOT / "data" / "ml" / "ml_dataset.csv"


@router.get("/")
def get_crops():
    if not ML_DATASET.exists():
        return {
            "count": 0,
            "crops": []
        }

    df = pd.read_csv(ML_DATASET)

    crop_column = next(
        (column for column in df.columns if column.lower() == "crop"),
        None
    )

    if crop_column is None:
        return {
            "count": 0,
            "crops": []
        }

    crops = sorted(
        df[crop_column]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    return {
        "count": len(crops),
        "crops": crops
    }


@router.get("/{crop_name}")
def get_crop(crop_name: str):
    if not ML_DATASET.exists():
        return {
            "error": "ML dataset not found"
        }

    df = pd.read_csv(ML_DATASET)

    crop_column = next(
        (column for column in df.columns if column.lower() == "crop"),
        None
    )

    if crop_column is None:
        return {
            "error": "Crop column not found"
        }

    crop_df = df[
        df[crop_column]
        .astype(str)
        .str.lower()
        == crop_name.lower()
    ]

    if crop_df.empty:
        return {
            "error": f"Crop '{crop_name}' not found"
        }

    return {
        "crop": crop_name,
        "samples": len(crop_df),
        "data": crop_df.to_dict(orient="records")
    }
