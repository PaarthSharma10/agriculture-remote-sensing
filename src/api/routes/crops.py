from fastapi import APIRouter
import pandas as pd

from src.api.paths import data_path

router = APIRouter()

# Dashboard dataset (see dataset.py for why this is ml_features.csv).
ML_DATASET = data_path("features", "ml_features.csv")


@router.get("", include_in_schema=False)  # bare form: /api/crops
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
