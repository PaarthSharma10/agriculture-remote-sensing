from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


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

OUTPUT_PATH = OUTPUT_DIR / "ablation_results.csv"

TARGET = "Yield_kg_ha"


FEATURE_GROUPS = {
    "Crop Only": [
        "Crop"
    ],
    "Remote Sensing + Environmental": [
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
    ],
    "Crop + Remote Sensing + Environmental": [
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
}


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("ML ABLATION ANALYSIS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")

    return dataframe


def build_pipeline(feature_columns):
    categorical_features = [
        column
        for column in feature_columns
        if column == "Crop"
    ]

    numerical_features = [
        column
        for column in feature_columns
        if column != "Crop"
    ]

    transformers = []

    if numerical_features:
        numerical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(strategy="median")
                )
            ]
        )

        transformers.append(
            (
                "numerical",
                numerical_pipeline,
                numerical_features
            )
        )

    if categorical_features:
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

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features
            )
        )

    preprocessor = ColumnTransformer(
        transformers=transformers
    )

    model = Pipeline(
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
    )

    return model


def create_groups(dataframe):
    return (
        dataframe["District"].astype(str)
        + "_"
        + dataframe["Year"].astype(str)
        + "_"
        + dataframe["Season"].astype(str)
    )


def evaluate_group(
    dataframe,
    feature_columns,
    train_indices,
    test_indices
):
    feature_data = dataframe[feature_columns]
    target_data = dataframe[TARGET]

    train_features = feature_data.iloc[train_indices]
    test_features = feature_data.iloc[test_indices]

    train_target = target_data.iloc[train_indices]
    test_target = target_data.iloc[test_indices]

    model = build_pipeline(
        feature_columns
    )

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


def run_analysis(dataframe):
    groups = create_groups(
        dataframe
    )

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42
    )

    train_indices, test_indices = next(
        splitter.split(
            dataframe,
            dataframe[TARGET],
            groups=groups
        )
    )

    print()
    print("=" * 70)
    print("GROUPED EVALUATION")
    print("=" * 70)

    print()
    print(f"Training rows: {len(train_indices)}")
    print(f"Testing rows: {len(test_indices)}")

    results = []

    print()
    print("=" * 70)
    print("ABLATION RESULTS")
    print("=" * 70)

    for name, feature_columns in FEATURE_GROUPS.items():
        print()
        print(f"Testing: {name}")

        mae, rmse, r2 = evaluate_group(
            dataframe,
            feature_columns,
            train_indices,
            test_indices
        )

        results.append(
            {
                "Feature_Set": name,
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            }
        )

        print(f"  MAE:  {mae:.2f}")
        print(f"  RMSE: {rmse:.2f}")
        print(f"  R2:   {r2:.4f}")

    results_dataframe = pd.DataFrame(
        results
    )

    return results_dataframe


def save_results(results_dataframe):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results_dataframe.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print()
    print("=" * 70)
    print("ABLATION COMPARISON")
    print("=" * 70)

    print()

    print(
        results_dataframe.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print()
    print(f"Results saved to: {OUTPUT_PATH}")


def main():
    dataframe = load_dataset()

    results_dataframe = run_analysis(
        dataframe
    )

    save_results(
        results_dataframe
    )

    print()
    print("=" * 70)
    print("ABLATION ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
