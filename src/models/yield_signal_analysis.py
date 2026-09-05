from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline


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

RESULTS_PATH = (
    OUTPUT_DIR
    / "yield_signal_analysis.csv"
)

TARGET = "Yield_kg_ha"

REMOTE_ENVIRONMENTAL_FEATURES = [
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

MINIMUM_SAMPLES = 20
NUMBER_OF_SPLITS = 5


def load_dataset():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("YIELD SIGNAL ANALYSIS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def print_yield_distribution(dataframe):
    print()
    print("=" * 70)
    print("YIELD DISTRIBUTION BY CROP")
    print("=" * 70)

    print()

    summary = (
        dataframe
        .groupby("Crop")[TARGET]
        .agg(
            Samples="count",
            Mean="mean",
            Std="std",
            Minimum="min",
            Maximum="max"
        )
        .sort_values("Mean")
    )

    print(
        summary.to_string(
            float_format=lambda value: f"{value:.2f}"
        )
    )


def calculate_crop_baseline(dataframe):
    crop_means = (
        dataframe
        .groupby("Crop")[TARGET]
        .mean()
    )

    predictions = dataframe["Crop"].map(
        crop_means
    )

    actual = dataframe[TARGET]

    mae = mean_absolute_error(
        actual,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predictions
        )
    )

    r2 = r2_score(
        actual,
        predictions
    )

    return mae, rmse, r2


def evaluate_remote_environmental_model(dataframe):
    working_dataframe = dataframe.copy()

    working_dataframe["Group"] = (
        working_dataframe["District"].astype(str)
        + "_"
        + working_dataframe["Year"].astype(str)
        + "_"
        + working_dataframe["Season"].astype(str)
    )

    feature_data = working_dataframe[
        REMOTE_ENVIRONMENTAL_FEATURES
    ]

    target_data = working_dataframe[
        TARGET
    ]

    groups = working_dataframe[
        "Group"
    ]

    group_count = groups.nunique()

    fold_count = min(
        NUMBER_OF_SPLITS,
        group_count
    )

    splitter = GroupKFold(
        n_splits=fold_count
    )

    model = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
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

    fold_mae = []
    fold_rmse = []
    fold_r2 = []

    for train_index, test_index in splitter.split(
        feature_data,
        target_data,
        groups
    ):
        train_features = feature_data.iloc[
            train_index
        ]

        test_features = feature_data.iloc[
            test_index
        ]

        train_target = target_data.iloc[
            train_index
        ]

        test_target = target_data.iloc[
            test_index
        ]

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

        fold_mae.append(mae)
        fold_rmse.append(rmse)
        fold_r2.append(r2)

    return {
        "MAE": np.mean(fold_mae),
        "RMSE": np.mean(fold_rmse),
        "R2": np.mean(fold_r2)
    }


def evaluate_crop_plus_environment_model(dataframe):
    working_dataframe = dataframe.copy()

    crop_means = (
        working_dataframe
        .groupby("Crop")[TARGET]
        .mean()
    )

    crop_prediction = working_dataframe[
        "Crop"
    ].map(
        crop_means
    )

    residual_target = (
        working_dataframe[TARGET]
        - crop_prediction
    )

    working_dataframe["Group"] = (
        working_dataframe["District"].astype(str)
        + "_"
        + working_dataframe["Year"].astype(str)
        + "_"
        + working_dataframe["Season"].astype(str)
    )

    feature_data = working_dataframe[
        REMOTE_ENVIRONMENTAL_FEATURES
    ]

    groups = working_dataframe[
        "Group"
    ]

    fold_count = min(
        NUMBER_OF_SPLITS,
        groups.nunique()
    )

    splitter = GroupKFold(
        n_splits=fold_count
    )

    model = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
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

    fold_mae = []
    fold_rmse = []
    fold_r2 = []

    for train_index, test_index in splitter.split(
        feature_data,
        residual_target,
        groups
    ):
        train_features = feature_data.iloc[
            train_index
        ]

        test_features = feature_data.iloc[
            test_index
        ]

        train_residual = residual_target.iloc[
            train_index
        ]

        model.fit(
            train_features,
            train_residual
        )

        residual_predictions = model.predict(
            test_features
        )

        test_crop_baseline = crop_prediction.iloc[
            test_index
        ]

        final_predictions = (
            test_crop_baseline
            + residual_predictions
        )

        actual_values = working_dataframe[
            TARGET
        ].iloc[
            test_index
        ]

        mae = mean_absolute_error(
            actual_values,
            final_predictions
        )

        rmse = np.sqrt(
            mean_squared_error(
                actual_values,
                final_predictions
            )
        )

        r2 = r2_score(
            actual_values,
            final_predictions
        )

        fold_mae.append(mae)
        fold_rmse.append(rmse)
        fold_r2.append(r2)

    return {
        "MAE": np.mean(fold_mae),
        "RMSE": np.mean(fold_rmse),
        "R2": np.mean(fold_r2)
    }


def analyze_crop_residuals(dataframe):
    crop_means = (
        dataframe
        .groupby("Crop")[TARGET]
        .transform("mean")
    )

    residuals = (
        dataframe[TARGET]
        - crop_means
    )

    dataframe = dataframe.copy()

    dataframe["Crop_Baseline_Yield"] = crop_means
    dataframe["Yield_Residual"] = residuals

    residual_summary = (
        dataframe
        .groupby("Crop")["Yield_Residual"]
        .agg(
            Mean_Residual="mean",
            Std_Residual="std",
            Minimum_Residual="min",
            Maximum_Residual="max"
        )
    )

    print()
    print("=" * 70)
    print("CROP-ADJUSTED YIELD VARIATION")
    print("=" * 70)

    print()

    print(
        residual_summary.to_string(
            float_format=lambda value: f"{value:.2f}"
        )
    )


def main():
    dataframe = load_dataset()

    print_yield_distribution(
        dataframe
    )

    baseline_mae, baseline_rmse, baseline_r2 = (
        calculate_crop_baseline(
            dataframe
        )
    )

    print()
    print("=" * 70)
    print("CROP-ONLY BASELINE")
    print("=" * 70)

    print()
    print(
        f"MAE:  {baseline_mae:.2f}"
    )

    print(
        f"RMSE: {baseline_rmse:.2f}"
    )

    print(
        f"R2:   {baseline_r2:.4f}"
    )

    print()
    print("=" * 70)
    print("REMOTE-SENSING + ENVIRONMENTAL MODEL")
    print("=" * 70)

    remote_results = (
        evaluate_remote_environmental_model(
            dataframe
        )
    )

    print()
    print(
        f"MAE:  {remote_results['MAE']:.2f}"
    )

    print(
        f"RMSE: {remote_results['RMSE']:.2f}"
    )

    print(
        f"R2:   {remote_results['R2']:.4f}"
    )

    print()
    print("=" * 70)
    print("CROP + REMOTE-SENSING + ENVIRONMENTAL MODEL")
    print("=" * 70)

    combined_results = (
        evaluate_crop_plus_environment_model(
            dataframe
        )
    )

    print()
    print(
        f"MAE:  {combined_results['MAE']:.2f}"
    )

    print(
        f"RMSE: {combined_results['RMSE']:.2f}"
    )

    print(
        f"R2:   {combined_results['R2']:.4f}"
    )

    analyze_crop_residuals(
        dataframe
    )

    results = pd.DataFrame(
        [
            {
                "Model": "Crop Only Baseline",
                "MAE": baseline_mae,
                "RMSE": baseline_rmse,
                "R2": baseline_r2
            },
            {
                "Model": "Remote Sensing + Environmental",
                "MAE": remote_results["MAE"],
                "RMSE": remote_results["RMSE"],
                "R2": remote_results["R2"]
            },
            {
                "Model": "Crop + Remote Sensing + Environmental",
                "MAE": combined_results["MAE"],
                "RMSE": combined_results["RMSE"],
                "R2": combined_results["R2"]
            }
        ]
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results.to_csv(
        RESULTS_PATH,
        index=False
    )

    print()
    print("=" * 70)
    print("YIELD SIGNAL ANALYSIS COMPLETED")
    print("=" * 70)

    print()
    print(
        f"Results saved to: {RESULTS_PATH}"
    )


if __name__ == "__main__":
    main()
