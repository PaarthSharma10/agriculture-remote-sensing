from fastapi import APIRouter
from pathlib import Path
import pandas as pd

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ML_DATASET = PROJECT_ROOT / "data" / "ml" / "ml_dataset.csv"

MODEL_METRICS = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "final_model_evaluation"
    / "corrected_overall_metrics.csv"
)


@router.get("/")
def get_overview():
    result = {
        "samples": 0,
        "districts": 0,
        "crops": 0,
        "years": [],
        "seasons": [],
        "mae_kg_ha": None,
        "rmse_kg_ha": None,
        "r2": None
    }

    if ML_DATASET.exists():
        df = pd.read_csv(ML_DATASET)

        result["samples"] = len(df)

        district_column = next(
            (c for c in df.columns if c.lower() == "district"),
            None
        )

        crop_column = next(
            (c for c in df.columns if c.lower() == "crop"),
            None
        )

        year_column = next(
            (c for c in df.columns if c.lower() == "year"),
            None
        )

        season_column = next(
            (c for c in df.columns if c.lower() == "season"),
            None
        )

        if district_column:
            result["districts"] = int(
                df[district_column].dropna().nunique()
            )

        if crop_column:
            result["crops"] = int(
                df[crop_column].dropna().nunique()
            )

        if year_column:
            result["years"] = sorted(
                df[year_column]
                .dropna()
                .astype(int)
                .unique()
                .tolist()
            )

        if season_column:
            result["seasons"] = sorted(
                df[season_column]
                .dropna()
                .astype(str)
                .unique()
                .tolist()
            )

    if MODEL_METRICS.exists():
        metrics = pd.read_csv(MODEL_METRICS)

        if not metrics.empty:
            if "Metric" in metrics.columns and "Value" in metrics.columns:
                metric_map = dict(
                    zip(
                        metrics["Metric"].astype(str),
                        metrics["Value"]
                    )
                )

                if "MAE_kg_ha" in metric_map:
                    result["mae_kg_ha"] = float(
                        metric_map["MAE_kg_ha"]
                    )

                if "RMSE_kg_ha" in metric_map:
                    result["rmse_kg_ha"] = float(
                        metric_map["RMSE_kg_ha"]
                    )

                if "R2" in metric_map:
                    result["r2"] = float(
                        metric_map["R2"]
                    )

    return result
