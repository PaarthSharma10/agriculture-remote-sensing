from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
)

OUTPUT_PATH = OUTPUT_DIR / "crop_wise_results.csv"

TARGET = "Yield_kg_ha"

FEATURE_COLUMNS = [
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture",
    "NDVI_NDWI_ratio",
    "EVI_NDVI_ratio",
    "Vegetation_Water_Index",
    "Vegetation_Stress_Index",
    "Temperature_Rainfall_ratio",
    "Climate_Index"
]

MINIMUM_SAMPLES = 10


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("CROP-WISE AGRICULTURAL YIELD ANALYSIS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def build_models():
    return {
        "Ridge": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("model", Ridge(alpha=1.0))
            ]
        ),
        "Random Forest": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    RandomForestRegressor(
                        n_estimators=300,
                        random_state=42,
                        min_samples_leaf=2,
                        n_jobs=-1
                    )
                )
            ]
        ),
        "Gradient Boosting": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    GradientBoostingRegressor(
                        n_estimators=200,
                        learning_rate=0.05,
                        max_depth=3,
                        random_state=42
                    )
                )
            ]
        ),
        "Extra Trees": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    ExtraTreesRegressor(
                        n_estimators=300,
                        random_state=42,
                        min_samples_leaf=2,
                        n_jobs=-1
                    )
                )
            ]
        )
    }


def evaluate_crop(crop_dataframe, crop_name):
    crop_dataframe = crop_dataframe.dropna(
        subset=[TARGET]
    ).copy()

    sample_count = len(crop_dataframe)

    if sample_count < MINIMUM_SAMPLES:
        print(
            f"\nSkipping {crop_name}: "
            f"only {sample_count} observations"
        )
        return []

    crop_dataframe = crop_dataframe.sort_values(
        ["Year", "District"]
    )

    feature_data = crop_dataframe[
        FEATURE_COLUMNS
    ]

    target_data = crop_dataframe[
        TARGET
    ]

    split_index = int(sample_count * 0.80)

    train_features = feature_data.iloc[:split_index]
    test_features = feature_data.iloc[split_index:]

    train_target = target_data.iloc[:split_index]
    test_target = target_data.iloc[split_index:]

    print(
        f"\n{crop_name}: "
        f"{sample_count} observations | "
        f"Training: {len(train_features)} | "
        f"Testing: {len(test_features)}"
    )

    results = []

    for model_name, model in build_models().items():
        model.fit(
            train_features,
            train_target
        )

        predictions = model.predict(
            test_features
        )

        mae = mean_absolute_error(
            test_target,
            predictions
        )

        rmse = np.sqrt(
            mean_squared_error(
                test_target,
                predictions
            )
        )

        r2 = r2_score(
            test_target,
            predictions
        )

        results.append(
            {
                "Crop": crop_name,
                "Model": model_name,
                "Samples": sample_count,
                "Training_Samples": len(train_features),
                "Testing_Samples": len(test_features),
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

        print(
            f"  {model_name}: "
            f"MAE={mae:.2f}, "
            f"RMSE={rmse:.2f}, "
            f"R2={r2:.4f}"
        )

    return results


def save_results(results):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results_dataframe = pd.DataFrame(
        results
    )

    results_dataframe.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print()
    print("=" * 70)
    print("CROP-WISE RESULTS")
    print("=" * 70)

    print()

    print(
        results_dataframe.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print(
        f"Results saved to: {OUTPUT_PATH}"
    )


def main():
    dataframe = load_dataset()

    print()
    print("=" * 70)
    print("CROP-WISE MODEL EVALUATION")
    print("=" * 70)

    results = []

    for crop_name in sorted(
        dataframe["Crop"].dropna().unique()
    ):
        crop_dataframe = dataframe[
            dataframe["Crop"] == crop_name
        ].copy()

        crop_results = evaluate_crop(
            crop_dataframe,
            crop_name
        )

        results.extend(
            crop_results
        )

    if not results:
        print("\nNo crops had enough observations.")
        return

    save_results(results)

    print()
    print("=" * 70)
    print("CROP-WISE ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
