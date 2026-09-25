from fastapi import APIRouter, HTTPException
import pandas as pd

from src.api.paths import data_path

router = APIRouter()

# The dashboard dataset: one row per district/season/crop observation carrying
# Area, Production, Yield_kg_ha and the remote-sensing features (NDVI, NDWI,
# EVI, rainfall, temperature, soil moisture).
#
# This deliberately points at data/features/ml_features.csv rather than the
# model's training matrix (data/ml/ml_dataset.csv): that matrix has no
# District, Crop or Yield_kg_ha column, so the frontend rejects it and falls
# back to synthetic demo data.
ML_DATASET = data_path("features", "ml_features.csv")


@router.get("", include_in_schema=False)  # bare form: /api/dataset
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