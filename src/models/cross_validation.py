from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesRegressor,
    RandomForestRegressor,
    GradientBoostingRegressor
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
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
    / "analysis"
    / "ml"
)

RESULTS_PATH = OUTPUT_DIR / "cross_validation_results.csv"

TARGET = "Yield_kg_ha"

FEATURE_COLUMNS = [
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

CATEGORICAL_FEATURES = [
    "Crop"
]

NUMERICAL_FEATURES = [
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


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("AGRICULTURAL YIELD CROSS-VALIDATION")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def prepare_data(dataframe):
    feature_data = dataframe[FEATURE_COLUMNS].copy()
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
                NUMERICAL_FEATURES
            ),
            (
                "categorical",
                categorical_pipeline,
                CATEGORICAL_FEATURES
            )
        ]
    )

    return preprocessor


def build_models():
    models = {}

    models["Ridge"] = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor()
            ),
            (
                "model",
                Ridge(alpha=1.0)
            )
        ]
    )

    models["Random Forest"] = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor()
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
    )

    models["Gradient Boosting"] = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor()
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
    )

    models["Extra Trees"] = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor()
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

    return models


def calculate_metrics(actual_values, predicted_values):
    mae = mean_absolute_error(
        actual_values,
        predicted_values
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual_values,
            predicted_values
        )
    )

    r2 = r2_score(
        actual_values,
        predicted_values
    )

    return mae, rmse, r2


def run_cross_validation(
    feature_data,
    target_data,
    groups
):
    unique_groups = groups.nunique()

    fold_count = min(
        5,
        unique_groups
    )

    group_kfold = GroupKFold(
        n_splits=fold_count
    )

    models = build_models()

    results = []

    print()
    print("=" * 70)
    print("GROUPED CROSS-VALIDATION")
    print("=" * 70)

    print()
    print(f"Unique groups: {unique_groups}")
    print(f"Cross-validation folds: {fold_count}")

    for model_name, model in models.items():
        print()
        print(f"Evaluating {model_name}...")

        fold_mae = []
        fold_rmse = []
        fold_r2 = []

        for train_index, test_index in group_kfold.split(
            feature_data,
            target_data,
            groups
        ):
            train_features = feature_data.iloc[train_index]
            test_features = feature_data.iloc[test_index]

            train_target = target_data.iloc[train_index]
            test_target = target_data.iloc[test_index]

            model.fit(
                train_features,
                train_target
            )

            predictions = model.predict(
                test_features
            )

            mae, rmse, r2 = calculate_metrics(
                test_target,
                predictions
            )

            fold_mae.append(mae)
            fold_rmse.append(rmse)
            fold_r2.append(r2)

        mean_mae = np.mean(fold_mae)
        std_mae = np.std(fold_mae)

        mean_rmse = np.mean(fold_rmse)
        std_rmse = np.std(fold_rmse)

        mean_r2 = np.mean(fold_r2)
        std_r2 = np.std(fold_r2)

        results.append(
            {
                "Model": model_name,
                "MAE_Mean": mean_mae,
                "MAE_STD": std_mae,
                "RMSE_Mean": mean_rmse,
                "RMSE_STD": std_rmse,
                "R2_Mean": mean_r2,
                "R2_STD": std_r2,
                "Folds": fold_count
            }
        )

        print(
            f"  MAE:  {mean_mae:.2f} +/- {std_mae:.2f}"
        )

        print(
            f"  RMSE: {mean_rmse:.2f} +/- {std_rmse:.2f}"
        )

        print(
            f"  R2:   {mean_r2:.4f} +/- {std_r2:.4f}"
        )

    results_dataframe = pd.DataFrame(
        results
    ).sort_values(
        "R2_Mean",
        ascending=False
    )

    return results_dataframe


def save_results(results_dataframe):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results_dataframe.to_csv(
        RESULTS_PATH,
        index=False
    )

    print()
    print("=" * 70)
    print("CROSS-VALIDATION RESULTS")
    print("=" * 70)

    print()

    print(
        results_dataframe.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    best_model = results_dataframe.iloc[0]["Model"]

    print()
    print(
        f"Best cross-validated model: {best_model}"
    )

    print(
        f"Results saved to: {RESULTS_PATH}"
    )


def main():
    dataframe = load_dataset()

    feature_data, target_data, groups = prepare_data(
        dataframe
    )

    results_dataframe = run_cross_validation(
        feature_data,
        target_data,
        groups
    )

    save_results(
        results_dataframe
    )

    print()
    print("=" * 70)
    print("CROSS-VALIDATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
