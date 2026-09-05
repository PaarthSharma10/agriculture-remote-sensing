from pathlib import Path

import joblib
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

MODEL_DIR = (
    PROJECT_ROOT
    / "data"
    / "models"
)

RESULTS_PATH = OUTPUT_DIR / "final_model_evaluation.csv"
PREDICTIONS_PATH = OUTPUT_DIR / "final_model_predictions.csv"
FINAL_MODEL_PATH = MODEL_DIR / "final_model.joblib"


TARGET = "Yield_kg_ha"

FEATURE_COLUMNS = [
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

CATEGORICAL_FEATURES = [
    "District",
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


def print_header(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print_header("FINAL AGRICULTURAL YIELD MODEL EVALUATION")

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


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

    return ColumnTransformer(
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


def create_groups(dataframe):
    return (
        dataframe["District"].astype(str)
        + "_"
        + dataframe["Crop"].astype(str)
    )


def evaluate_model(model, features, target, groups):
    splitter = GroupKFold(n_splits=5)

    fold_results = []
    prediction_rows = []

    for fold_number, (train_index, test_index) in enumerate(
        splitter.split(features, target, groups),
        start=1
    ):
        train_features = features.iloc[train_index]
        test_features = features.iloc[test_index]

        train_target = target.iloc[train_index]
        test_target = target.iloc[test_index]

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

        fold_results.append(
            {
                "Fold": fold_number,
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

        fold_predictions = test_features[
            ["District", "Crop"]
        ].copy()

        fold_predictions["Actual_Yield"] = (
            test_target.values
        )

        fold_predictions["Predicted_Yield"] = (
            predictions
        )

        fold_predictions["Residual"] = (
            test_target.values - predictions
        )

        fold_predictions["Fold"] = fold_number

        prediction_rows.append(
            fold_predictions
        )

    fold_dataframe = pd.DataFrame(
        fold_results
    )

    predictions_dataframe = pd.concat(
        prediction_rows,
        ignore_index=True
    )

    return fold_dataframe, predictions_dataframe


def calculate_summary(
    model_name,
    fold_dataframe
):
    return {
        "Model": model_name,
        "MAE_Mean": fold_dataframe["MAE"].mean(),
        "MAE_STD": fold_dataframe["MAE"].std(),
        "RMSE_Mean": fold_dataframe["RMSE"].mean(),
        "RMSE_STD": fold_dataframe["RMSE"].std(),
        "R2_Mean": fold_dataframe["R2"].mean(),
        "R2_STD": fold_dataframe["R2"].std(),
        "Folds": len(fold_dataframe)
    }


def evaluate_all_models(
    features,
    target,
    groups
):
    models = build_models()

    results = {}
    predictions = {}

    print_header("GROUPED CROSS-VALIDATION")

    print()
    print(f"Unique groups: {groups.nunique()}")
    print("Cross-validation folds: 5")

    for model_name, model in models.items():
        print()
        print(f"Evaluating {model_name}...")

        fold_dataframe, prediction_dataframe = evaluate_model(
            model,
            features,
            target,
            groups
        )

        results[model_name] = calculate_summary(
            model_name,
            fold_dataframe
        )

        predictions[model_name] = prediction_dataframe

        print(
            f"  MAE:  "
            f"{fold_dataframe['MAE'].mean():.2f} "
            f"+/- "
            f"{fold_dataframe['MAE'].std():.2f}"
        )

        print(
            f"  RMSE: "
            f"{fold_dataframe['RMSE'].mean():.2f} "
            f"+/- "
            f"{fold_dataframe['RMSE'].std():.2f}"
        )

        print(
            f"  R2:   "
            f"{fold_dataframe['R2'].mean():.4f} "
            f"+/- "
            f"{fold_dataframe['R2'].std():.4f}"
        )

    results_dataframe = pd.DataFrame(
        list(results.values())
    ).sort_values(
        "R2_Mean",
        ascending=False
    )

    return (
        results_dataframe,
        predictions,
        models
    )


def select_best_model(results_dataframe):
    best_model_name = (
        results_dataframe.iloc[0]["Model"]
    )

    print_header("FINAL MODEL SELECTION")

    print()
    print(
        f"Best cross-validated model: "
        f"{best_model_name}"
    )

    best_row = results_dataframe.iloc[0]

    print(
        f"Mean MAE:  {best_row['MAE_Mean']:.2f}"
    )

    print(
        f"Mean RMSE: {best_row['RMSE_Mean']:.2f}"
    )

    print(
        f"Mean R2:   {best_row['R2_Mean']:.4f}"
    )

    return best_model_name


def train_final_model(
    model,
    features,
    target
):
    model.fit(
        features,
        target
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(
        model,
        FINAL_MODEL_PATH
    )


def save_outputs(
    results_dataframe,
    predictions_dataframe
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results_dataframe.to_csv(
        RESULTS_PATH,
        index=False
    )

    predictions_dataframe.to_csv(
        PREDICTIONS_PATH,
        index=False
    )


def main():
    dataframe = load_dataset()

    features = dataframe[
        FEATURE_COLUMNS
    ].copy()

    target = dataframe[
        TARGET
    ].copy()

    groups = create_groups(
        dataframe
    )

    (
        results_dataframe,
        predictions,
        models
    ) = evaluate_all_models(
        features,
        target,
        groups
    )

    best_model_name = select_best_model(
        results_dataframe
    )

    best_predictions = predictions[
        best_model_name
    ].copy()

    best_model = models[
        best_model_name
    ]

    train_final_model(
        best_model,
        features,
        target
    )

    save_outputs(
        results_dataframe,
        best_predictions
    )

    print_header("FINAL MODEL COMPARISON")

    print()

    print(
        results_dataframe.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print(
        f"Results saved to: {RESULTS_PATH}"
    )

    print(
        f"Predictions saved to: {PREDICTIONS_PATH}"
    )

    print(
        f"Final model saved to: {FINAL_MODEL_PATH}"
    )

    print()
    print("=" * 70)
    print("FINAL MODEL EVALUATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
