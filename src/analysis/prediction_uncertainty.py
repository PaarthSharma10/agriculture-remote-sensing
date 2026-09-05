from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

OOF_FILE = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "out_of_fold_predictions.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "ml"
    / "final_evaluation"
    / "prediction_uncertainty"
)

TARGET = "Yield_kg_ha"

CROP_FEATURES = [
    "Crop"
]

REMOTE_SENSING_FEATURES = [
    "NDVI",
    "NDWI",
    "EVI"
]

ENVIRONMENTAL_FEATURES = [
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture"
]

ENGINEERED_FEATURES = [
    "NDVI_NDWI_ratio",
    "EVI_NDVI_ratio",
    "Vegetation_Water_Index",
    "Vegetation_Stress_Index",
    "Temperature_Rainfall_ratio",
    "Climate_Index"
]

ALL_FEATURES = (
    CROP_FEATURES
    + REMOTE_SENSING_FEATURES
    + ENVIRONMENTAL_FEATURES
    + ENGINEERED_FEATURES
)

GROUP_COLUMNS = [
    "District",
    "Year",
    "Season"
]

N_SPLITS = 5
RANDOM_STATE = 42
N_ESTIMATORS = 300


def load_dataset():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}"
        )

    data = pd.read_csv(DATA_FILE)

    print(
        f"Dataset rows loaded: {len(data)}"
    )

    print(
        f"Dataset columns loaded: {len(data.columns)}"
    )

    return data


def load_oof_predictions():
    if not OOF_FILE.exists():
        raise FileNotFoundError(
            f"OOF predictions not found: {OOF_FILE}"
        )

    predictions = pd.read_csv(
        OOF_FILE
    )

    print(
        f"OOF predictions loaded: {len(predictions)}"
    )

    return predictions


def validate_dataset(data):
    required_columns = (
        GROUP_COLUMNS
        + [TARGET]
        + ALL_FEATURES
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    if data[
        required_columns
    ].isnull().any().any():
        missing = data[
            required_columns
        ].isnull().sum()

        missing = missing[
            missing > 0
        ]

        raise ValueError(
            f"Missing values detected:\n{missing}"
        )

    if data[TARGET].le(0).any():
        raise ValueError(
            "Non-positive target values detected."
        )


def create_groups(data):
    return (
        data[
            GROUP_COLUMNS
        ]
        .astype(str)
        .agg(
            "_".join,
            axis=1
        )
    )


def create_preprocessor(features):
    categorical_features = [
        feature
        for feature in features
        if feature in CROP_FEATURES
    ]

    numerical_features = [
        feature
        for feature in features
        if feature not in CROP_FEATURES
    ]

    transformers = []

    if categorical_features:
        categorical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="most_frequent"
                    )
                ),
                (
                    "encoder",
                    OneHotEncoder(
                        handle_unknown="ignore"
                    )
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

    if numerical_features:
        numerical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="median"
                    )
                ),
                (
                    "scaler",
                    StandardScaler()
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

    return ColumnTransformer(
        transformers=transformers
    )


def create_model():
    return ExtraTreesRegressor(
        n_estimators=N_ESTIMATORS,
        max_depth=None,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )


def create_pipeline(features):
    return Pipeline(
        steps=[
            (
                "preprocessor",
                create_preprocessor(
                    features
                )
            ),
            (
                "model",
                create_model()
            )
        ]
    )


def calculate_tree_predictions(
    pipeline,
    x_test
):
    transformed_x = (
        pipeline.named_steps[
            "preprocessor"
        ].transform(
            x_test
        )
    )

    model = pipeline.named_steps[
        "model"
    ]

    tree_predictions = np.column_stack(
        [
            estimator.predict(
                transformed_x
            )
            for estimator in model.estimators_
        ]
    )

    return tree_predictions


def run_uncertainty_analysis(
    data,
    oof_predictions
):
    features = ALL_FEATURES

    x = data[
        features
    ]

    y = data[
        TARGET
    ]

    groups = create_groups(
        data
    )

    folds = GroupKFold(
        n_splits=N_SPLITS
    )

    results = []

    for fold_number, (
        train_indices,
        test_indices
    ) in enumerate(
        folds.split(
            x,
            y,
            groups
        ),
        start=1
    ):
        print()
        print(
            f"Processing fold {fold_number}/{N_SPLITS}"
        )

        x_train = x.iloc[
            train_indices
        ]

        x_test = x.iloc[
            test_indices
        ]

        y_test = y.iloc[
            test_indices
        ]

        pipeline = create_pipeline(
            features
        )

        pipeline.fit(
            x_train,
            y.iloc[
                train_indices
            ]
        )

        tree_predictions = (
            calculate_tree_predictions(
                pipeline,
                x_test
            )
        )

        prediction_mean = (
            tree_predictions.mean(
                axis=1
            )
        )

        prediction_std = (
            tree_predictions.std(
                axis=1
            )
        )

        lower_interval = (
            prediction_mean
            - 1.96 * prediction_std
        )

        upper_interval = (
            prediction_mean
            + 1.96 * prediction_std
        )

        interval_width = (
            upper_interval
            - lower_interval
        )

        residual = (
            y_test.values
            - prediction_mean
        )

        absolute_error = np.abs(
            residual
        )

        absolute_percentage_error = (
            absolute_error
            / np.maximum(
                np.abs(
                    y_test.values
                ),
                1e-8
            )
            * 100
        )

        fold_frame = data.iloc[
            test_indices
        ][
            GROUP_COLUMNS
            + CROP_FEATURES
        ].copy()

        fold_frame[
            "Actual_Yield"
        ] = y_test.values

        fold_frame[
            "Predicted_Yield"
        ] = prediction_mean

        fold_frame[
            "Prediction_STD"
        ] = prediction_std

        fold_frame[
            "Lower_95_Interval"
        ] = lower_interval

        fold_frame[
            "Upper_95_Interval"
        ] = upper_interval

        fold_frame[
            "Interval_Width"
        ] = interval_width

        fold_frame[
            "Residual"
        ] = residual

        fold_frame[
            "Absolute_Error"
        ] = absolute_error

        fold_frame[
            "Absolute_Error_Percent"
        ] = absolute_percentage_error

        fold_frame[
            "Uncertainty_Percent"
        ] = (
            prediction_std
            / np.maximum(
                np.abs(
                    prediction_mean
                ),
                1e-8
            )
            * 100
        )

        fold_frame[
            "Fold"
        ] = fold_number

        results.append(
            fold_frame
        )

        print(
            f"Fold {fold_number} | "
            f"MAE: "
            f"{mean_absolute_error(y_test, prediction_mean):.2f} | "
            f"RMSE: "
            f"{np.sqrt(mean_squared_error(y_test, prediction_mean)):.2f} | "
            f"R2: "
            f"{r2_score(y_test, prediction_mean):.4f}"
        )

    result = pd.concat(
        results,
        ignore_index=True
    )

    if len(oof_predictions) == len(result):
        result = result.sort_values(
            GROUP_COLUMNS
            + CROP_FEATURES
        ).reset_index(
            drop=True
        )

    return result


def create_overall_summary(
    predictions
):
    actual = predictions[
        "Actual_Yield"
    ]

    predicted = predictions[
        "Predicted_Yield"
    ]

    residual = predictions[
        "Residual"
    ]

    summary = pd.DataFrame(
        [
            {
                "Samples": len(predictions),
                "MAE_kg_ha": mean_absolute_error(
                    actual,
                    predicted
                ),
                "RMSE_kg_ha": np.sqrt(
                    mean_squared_error(
                        actual,
                        predicted
                    )
                ),
                "R2": r2_score(
                    actual,
                    predicted
                ),
                "Mean_Residual_kg_ha": residual.mean(),
                "Median_Residual_kg_ha": residual.median(),
                "Mean_Prediction_STD_kg_ha": predictions[
                    "Prediction_STD"
                ].mean(),
                "Median_Prediction_STD_kg_ha": predictions[
                    "Prediction_STD"
                ].median(),
                "Mean_Interval_Width_kg_ha": predictions[
                    "Interval_Width"
                ].mean(),
                "Median_Interval_Width_kg_ha": predictions[
                    "Interval_Width"
                ].median(),
                "Mean_Uncertainty_Percent": predictions[
                    "Uncertainty_Percent"
                ].mean()
            }
        ]
    )

    return summary


def create_crop_summary(
    predictions
):
    summary = (
        predictions
        .groupby("Crop")
        .agg(
            Samples=(
                "Actual_Yield",
                "count"
            ),
            MAE_kg_ha=(
                "Absolute_Error",
                "mean"
            ),
            RMSE_kg_ha=(
                "Absolute_Error",
                lambda values: np.sqrt(
                    np.mean(
                        values ** 2
                    )
                )
            ),
            Mean_Actual_kg_ha=(
                "Actual_Yield",
                "mean"
            ),
            Mean_Predicted_kg_ha=(
                "Predicted_Yield",
                "mean"
            ),
            Mean_Prediction_STD_kg_ha=(
                "Prediction_STD",
                "mean"
            ),
            Mean_Interval_Width_kg_ha=(
                "Interval_Width",
                "mean"
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean"
            ),
            Mean_Absolute_Error_Percent=(
                "Absolute_Error_Percent",
                "mean"
            )
        )
        .reset_index()
    )

    return summary.sort_values(
        "Mean_Prediction_STD_kg_ha",
        ascending=False
    )


def create_district_summary(
    predictions
):
    summary = (
        predictions
        .groupby("District")
        .agg(
            Samples=(
                "Actual_Yield",
                "count"
            ),
            MAE_kg_ha=(
                "Absolute_Error",
                "mean"
            ),
            RMSE_kg_ha=(
                "Absolute_Error",
                lambda values: np.sqrt(
                    np.mean(
                        values ** 2
                    )
                )
            ),
            Mean_Prediction_STD_kg_ha=(
                "Prediction_STD",
                "mean"
            ),
            Mean_Interval_Width_kg_ha=(
                "Interval_Width",
                "mean"
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean"
            ),
            Mean_Absolute_Error_Percent=(
                "Absolute_Error_Percent",
                "mean"
            )
        )
        .reset_index()
    )

    return summary.sort_values(
        "Mean_Prediction_STD_kg_ha",
        ascending=False
    )


def create_season_summary(
    predictions
):
    summary = (
        predictions
        .groupby("Season")
        .agg(
            Samples=(
                "Actual_Yield",
                "count"
            ),
            MAE_kg_ha=(
                "Absolute_Error",
                "mean"
            ),
            RMSE_kg_ha=(
                "Absolute_Error",
                lambda values: np.sqrt(
                    np.mean(
                        values ** 2
                    )
                )
            ),
            Mean_Prediction_STD_kg_ha=(
                "Prediction_STD",
                "mean"
            ),
            Mean_Interval_Width_kg_ha=(
                "Interval_Width",
                "mean"
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean"
            )
        )
        .reset_index()
    )

    return summary.sort_values(
        "Mean_Prediction_STD_kg_ha",
        ascending=False
    )


def create_year_summary(
    predictions
):
    summary = (
        predictions
        .groupby("Year")
        .agg(
            Samples=(
                "Actual_Yield",
                "count"
            ),
            MAE_kg_ha=(
                "Absolute_Error",
                "mean"
            ),
            RMSE_kg_ha=(
                "Absolute_Error",
                lambda values: np.sqrt(
                    np.mean(
                        values ** 2
                    )
                )
            ),
            Mean_Prediction_STD_kg_ha=(
                "Prediction_STD",
                "mean"
            ),
            Mean_Interval_Width_kg_ha=(
                "Interval_Width",
                "mean"
            ),
            Mean_Uncertainty_Percent=(
                "Uncertainty_Percent",
                "mean"
            )
        )
        .reset_index()
    )

    return summary.sort_values(
        "Year"
    )


def create_high_uncertainty(
    predictions
):
    threshold = predictions[
        "Prediction_STD"
    ].quantile(
        0.90
    )

    high_uncertainty = predictions[
        predictions[
            "Prediction_STD"
        ] >= threshold
    ].copy()

    high_uncertainty[
        "High_Uncertainty_Threshold"
    ] = threshold

    return high_uncertainty.sort_values(
        "Prediction_STD",
        ascending=False
    )


def create_high_error(
    predictions
):
    return predictions.sort_values(
        "Absolute_Error",
        ascending=False
    ).head(
        20
    )


def create_uncertainty_error_relationship(
    predictions
):
    uncertainty = predictions[
        "Prediction_STD"
    ]

    error = predictions[
        "Absolute_Error"
    ]

    correlation = uncertainty.corr(
        error
    )

    result = pd.DataFrame(
        [
            {
                "Samples": len(predictions),
                "Uncertainty_Error_Correlation": correlation,
                "Mean_Uncertainty_kg_ha": uncertainty.mean(),
                "Mean_Absolute_Error_kg_ha": error.mean()
            }
        ]
    )

    return result


def save_results(
    predictions,
    overall,
    crop_summary,
    district_summary,
    season_summary,
    year_summary,
    high_uncertainty,
    high_error,
    relationship
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    predictions.to_csv(
        OUTPUT_DIR
        / "prediction_uncertainty_predictions.csv",
        index=False
    )

    overall.to_csv(
        OUTPUT_DIR
        / "overall_uncertainty_metrics.csv",
        index=False
    )

    crop_summary.to_csv(
        OUTPUT_DIR
        / "crop_uncertainty_metrics.csv",
        index=False
    )

    district_summary.to_csv(
        OUTPUT_DIR
        / "district_uncertainty_metrics.csv",
        index=False
    )

    season_summary.to_csv(
        OUTPUT_DIR
        / "season_uncertainty_metrics.csv",
        index=False
    )

    year_summary.to_csv(
        OUTPUT_DIR
        / "year_uncertainty_metrics.csv",
        index=False
    )

    high_uncertainty.to_csv(
        OUTPUT_DIR
        / "high_uncertainty_predictions.csv",
        index=False
    )

    high_error.to_csv(
        OUTPUT_DIR
        / "highest_error_predictions.csv",
        index=False
    )

    relationship.to_csv(
        OUTPUT_DIR
        / "uncertainty_error_relationship.csv",
        index=False
    )


def print_results(
    overall,
    crop_summary,
    district_summary,
    season_summary,
    year_summary,
    high_uncertainty,
    relationship
):
    print()
    print("=" * 70)
    print("OVERALL PREDICTION UNCERTAINTY")
    print("=" * 70)

    print(
        overall.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("CROP-WISE UNCERTAINTY")
    print("=" * 70)

    print(
        crop_summary.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("DISTRICT-WISE UNCERTAINTY")
    print("=" * 70)

    print(
        district_summary.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("SEASON-WISE UNCERTAINTY")
    print("=" * 70)

    print(
        season_summary.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("YEAR-WISE UNCERTAINTY")
    print("=" * 70)

    print(
        year_summary.round(4).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("HIGHEST UNCERTAINTY OBSERVATIONS")
    print("=" * 70)

    display_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Actual_Yield",
        "Predicted_Yield",
        "Prediction_STD",
        "Lower_95_Interval",
        "Upper_95_Interval",
        "Interval_Width",
        "Absolute_Error",
        "Uncertainty_Percent"
    ]

    print(
        high_uncertainty[
            display_columns
        ].head(20).round(2).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("UNCERTAINTY AND ERROR RELATIONSHIP")
    print("=" * 70)

    print(
        relationship.round(4).to_string(
            index=False
        )
    )


def main():
    print("=" * 70)
    print("FINAL MODEL PREDICTION UNCERTAINTY ANALYSIS")
    print("=" * 70)

    data = load_dataset()

    oof_predictions = (
        load_oof_predictions()
    )

    validate_dataset(
        data
    )

    print()
    print("=" * 70)
    print("EXTRA TREES ENSEMBLE UNCERTAINTY")
    print("=" * 70)

    predictions = run_uncertainty_analysis(
        data,
        oof_predictions
    )

    overall = create_overall_summary(
        predictions
    )

    crop_summary = create_crop_summary(
        predictions
    )

    district_summary = (
        create_district_summary(
            predictions
        )
    )

    season_summary = create_season_summary(
        predictions
    )

    year_summary = create_year_summary(
        predictions
    )

    high_uncertainty = (
        create_high_uncertainty(
            predictions
        )
    )

    high_error = create_high_error(
        predictions
    )

    relationship = (
        create_uncertainty_error_relationship(
            predictions
        )
    )

    print_results(
        overall,
        crop_summary,
        district_summary,
        season_summary,
        year_summary,
        high_uncertainty,
        relationship
    )

    save_results(
        predictions,
        overall,
        crop_summary,
        district_summary,
        season_summary,
        year_summary,
        high_uncertainty,
        high_error,
        relationship
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print()
    print(
        f"Results directory: {OUTPUT_DIR}"
    )

    print(
        "Prediction uncertainty predictions: "
        f"{OUTPUT_DIR / 'prediction_uncertainty_predictions.csv'}"
    )

    print(
        "Overall uncertainty metrics: "
        f"{OUTPUT_DIR / 'overall_uncertainty_metrics.csv'}"
    )

    print(
        "Crop uncertainty metrics: "
        f"{OUTPUT_DIR / 'crop_uncertainty_metrics.csv'}"
    )

    print(
        "District uncertainty metrics: "
        f"{OUTPUT_DIR / 'district_uncertainty_metrics.csv'}"
    )

    print(
        "Season uncertainty metrics: "
        f"{OUTPUT_DIR / 'season_uncertainty_metrics.csv'}"
    )

    print(
        "Year uncertainty metrics: "
        f"{OUTPUT_DIR / 'year_uncertainty_metrics.csv'}"
    )

    print(
        "High uncertainty predictions: "
        f"{OUTPUT_DIR / 'high_uncertainty_predictions.csv'}"
    )

    print(
        "Highest error predictions: "
        f"{OUTPUT_DIR / 'highest_error_predictions.csv'}"
    )

    print(
        "Uncertainty-error relationship: "
        f"{OUTPUT_DIR / 'uncertainty_error_relationship.csv'}"
    )

    print()
    print("=" * 70)
    print("PREDICTION UNCERTAINTY ANALYSIS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
