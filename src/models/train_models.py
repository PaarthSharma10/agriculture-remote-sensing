from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


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
    / "models"
)

RESULTS_PATH = OUTPUT_DIR / "model_results.csv"
BEST_MODEL_PATH = OUTPUT_DIR / "best_model.joblib"

TARGET = "Yield_kg_ha"


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("AGRICULTURAL YIELD MODEL TRAINING")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def prepare_data(dataframe):
    feature_columns = [
        "District",
        "Crop",
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

    feature_data = dataframe[feature_columns].copy()
    target_data = dataframe[TARGET].copy()

    groups = (
        dataframe["District"].astype(str)
        + "_"
        + dataframe["Year"].astype(str)
        + "_"
        + dataframe["Season"].astype(str)
    )

    return feature_data, target_data, groups


def build_preprocessor():
    categorical_features = [
        "District",
        "Crop"
    ]

    numerical_features = [
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

    numerical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "scaler",
                StandardScaler()
            )
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent")
            ),
            (
                "encoder",
                OneHotEncoder(handle_unknown="ignore")
            )
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numerical",
                numerical_pipeline,
                numerical_features
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_features
            )
        ]
    )

    return preprocessor


def build_models(preprocessor):
    models = {
        "Ridge": Pipeline(
            steps=[
                (
                    "preprocessor",
                    preprocessor
                ),
                (
                    "model",
                    Ridge(alpha=1.0)
                )
            ]
        ),
        "Random Forest": Pipeline(
            steps=[
                (
                    "preprocessor",
                    preprocessor
                ),
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
                (
                    "preprocessor",
                    preprocessor
                ),
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
                (
                    "preprocessor",
                    preprocessor
                ),
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

    return models


def evaluate_model(
    model,
    train_features,
    test_features,
    train_target,
    test_target
):
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

    return mae, rmse, r2


def train_models(
    feature_data,
    target_data,
    groups
):
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42
    )

    train_indices, test_indices = next(
        splitter.split(
            feature_data,
            target_data,
            groups=groups
        )
    )

    train_features = feature_data.iloc[train_indices]
    test_features = feature_data.iloc[test_indices]

    train_target = target_data.iloc[train_indices]
    test_target = target_data.iloc[test_indices]

    train_groups = groups.iloc[train_indices]
    test_groups = groups.iloc[test_indices]

    print()
    print("=" * 70)
    print("GROUPED TRAIN-TEST SPLIT")
    print("=" * 70)

    print()
    print(f"Training rows: {len(train_features)}")
    print(f"Testing rows: {len(test_features)}")
    print(f"Training groups: {train_groups.nunique()}")
    print(f"Testing groups: {test_groups.nunique()}")

    overlap = set(train_groups) & set(test_groups)

    print(f"Group overlap: {len(overlap)}")

    preprocessor = build_preprocessor()

    models = build_models(
        preprocessor
    )

    results = []
    trained_models = {}

    print()
    print("=" * 70)
    print("MODEL TRAINING")
    print("=" * 70)

    for name, model in models.items():
        print()
        print(f"Training {name}...")

        mae, rmse, r2 = evaluate_model(
            model,
            train_features,
            test_features,
            train_target,
            test_target
        )

        results.append(
            {
                "Model": name,
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

        trained_models[name] = model

        print(f"  MAE:  {mae:.2f}")
        print(f"  RMSE: {rmse:.2f}")
        print(f"  R2:   {r2:.4f}")

    results_dataframe = (
        pd.DataFrame(results)
        .sort_values(
            "R2",
            ascending=False
        )
        .reset_index(drop=True)
    )

    return results_dataframe, trained_models


def save_results(
    results_dataframe,
    trained_models
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results_dataframe.to_csv(
        RESULTS_PATH,
        index=False
    )

    best_model_name = results_dataframe.iloc[0]["Model"]

    best_model = trained_models[
        best_model_name
    ]

    joblib.dump(
        best_model,
        BEST_MODEL_PATH
    )

    print()
    print("=" * 70)
    print("MODEL COMPARISON")
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
        f"Best model: {best_model_name}"
    )

    print(
        f"Results saved to: {RESULTS_PATH}"
    )

    print(
        f"Best model saved to: {BEST_MODEL_PATH}"
    )


def main():
    dataframe = load_dataset()

    feature_data, target_data, groups = prepare_data(
        dataframe
    )

    results_dataframe, trained_models = train_models(
        feature_data,
        target_data,
        groups
    )

    save_results(
        results_dataframe,
        trained_models
    )

    print()
    print("=" * 70)
    print("ML MODEL TRAINING COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
