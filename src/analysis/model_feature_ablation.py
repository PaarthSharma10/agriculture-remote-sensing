# pylint: disable=too-many-lines

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_FILE = (
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
    / "feature_ablation"
)

TARGET = "Yield_kg_ha"
RANDOM_STATE = 42
N_ESTIMATORS = 300
N_SPLITS = 5

CROP_FEATURES = [
    "Crop",
]

REMOTE_SENSING_FEATURES = [
    "NDVI",
    "NDWI",
    "EVI",
    "NDVI_change",
    "NDVI_relative_change",
    "NDVI_rolling_mean",
    "NDWI_change",
    "NDWI_relative_change",
    "NDWI_rolling_mean",
    "EVI_change",
    "EVI_relative_change",
    "EVI_rolling_mean",
    "NDVI_NDWI_ratio",
    "EVI_NDVI_ratio",
    "Vegetation_Water_Index",
]

ENVIRONMENTAL_FEATURES = [
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture",
    "Temperature_Rainfall_ratio",
    "Climate_Index",
]

GROUP_COLUMNS = [
    "District",
    "Year",
    "Season",
]

METADATA_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop",
]


def load_dataset():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}"
        )

    dataset = pd.read_csv(DATA_FILE)

    if TARGET not in dataset.columns:
        raise ValueError(
            f"Target column '{TARGET}' was not found."
        )

    dataset = dataset.dropna(
        subset=[TARGET]
    ).reset_index(drop=True)

    print(
        f"Dataset rows loaded: {len(dataset)}"
    )
    print(
        f"Dataset columns loaded: {len(dataset.columns)}"
    )

    return dataset


def get_available_features(dataset):
    crop_features = [
        column
        for column in CROP_FEATURES
        if column in dataset.columns
    ]

    remote_features = [
        column
        for column in REMOTE_SENSING_FEATURES
        if column in dataset.columns
    ]

    environmental_features = [
        column
        for column in ENVIRONMENTAL_FEATURES
        if column in dataset.columns
    ]

    return (
        crop_features,
        remote_features,
        environmental_features,
    )


def validate_numeric_features(dataset, feature_sets):
    for model_name, features in feature_sets.items():
        for feature in features:
            if feature in CROP_FEATURES:
                continue

            if not pd.api.types.is_numeric_dtype(
                dataset[feature]
            ):
                raise TypeError(
                    f"Feature '{feature}' in '{model_name}' "
                    f"is not numeric. Detected dtype: "
                    f"{dataset[feature].dtype}"
                )


def build_pipeline(
    dataset,
    features
):
    categorical_features = [
        feature
        for feature in features
        if feature in CROP_FEATURES
    ]

    numerical_features = [
        feature
        for feature in features
        if feature not in categorical_features
    ]

    transformers = []

    if categorical_features:
        transformers.append(
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                categorical_features,
            )
        )

    if numerical_features:
        transformers.append(
            (
                "numerical",
                "passthrough",
                numerical_features,
            )
        )

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    estimator = ExtraTreesRegressor(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        max_features=1.0,
        min_samples_leaf=1,
    )

    return Pipeline(
        [
            (
                "preprocessor",
                preprocessor
            ),
            (
                "model",
                estimator
            ),
        ]
    )


def create_feature_sets(
    crop_features,
    remote_features,
    environmental_features,
):
    full_features = (
        crop_features
        + remote_features
        + environmental_features
    )

    no_crop_features = (
        remote_features
        + environmental_features
    )

    remote_only_features = remote_features.copy()

    return {
        "Full: Crop + Remote Sensing + Environmental":
            full_features,
        "No Crop: Remote Sensing + Environmental":
            no_crop_features,
        "Remote Sensing Only":
            remote_only_features,
    }


def validate_feature_sets(
    dataset,
    feature_sets,
):
    for name, features in feature_sets.items():
        if not features:
            raise ValueError(
                f"No features available for model: {name}"
            )

        missing = [
            feature
            for feature in features
            if feature not in dataset.columns
        ]

        if missing:
            raise ValueError(
                f"Missing features for {name}: {missing}"
            )

        print()
        print(name)
        print(
            f"Features: {len(features)}"
        )
        print(
            ", ".join(features)
        )


def identify_feature_types(
    dataset,
    features,
):
    categorical_features = []
    numerical_features = []

    for feature in features:
        if (
            dataset[feature].dtype == "object"
            or str(dataset[feature].dtype).startswith(
                "category"
            )
        ):
            categorical_features.append(feature)
        else:
            numerical_features.append(feature)

    return (
        categorical_features,
        numerical_features,
    )


def build_preprocessor(
    categorical_features,
    numerical_features,
):
    transformers = []

    if categorical_features:
        transformers.append(
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
                categorical_features,
            )
        )

    if numerical_features:
        transformers.append(
            (
                "numerical",
                "passthrough",
                numerical_features,
            )
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )


def build_pipeline(
    dataset,
    features
):
    categorical_features = [
        feature
        for feature in features
        if feature in CROP_FEATURES
    ]

    numerical_features = [
        feature
        for feature in features
        if feature not in categorical_features
    ]

    transformers = []

    if categorical_features:
        transformers.append(
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                categorical_features,
            )
        )

    if numerical_features:
        transformers.append(
            (
                "numerical",
                "passthrough",
                numerical_features,
            )
        )

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    estimator = ExtraTreesRegressor(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        max_features=1.0,
        min_samples_leaf=1,
    )

    return Pipeline(
        [
            (
                "preprocessor",
                preprocessor
            ),
            (
                "model",
                estimator
            ),
        ]
    )


def create_groups(dataset):
    missing = [
        column
        for column in GROUP_COLUMNS
        if column not in dataset.columns
    ]

    if missing:
        raise ValueError(
            f"Missing grouping columns: {missing}"
        )

    return (
        dataset["District"].astype(str)
        + "_"
        + dataset["Year"].astype(str)
        + "_"
        + dataset["Season"].astype(str)
    )


def calculate_metrics(
    actual,
    predicted,
):
    actual_array = np.asarray(actual)
    predicted_array = np.asarray(predicted)

    error = (
        actual_array
        - predicted_array
    )

    mae = mean_absolute_error(
        actual_array,
        predicted_array,
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual_array,
            predicted_array,
        )
    )

    r2 = r2_score(
        actual_array,
        predicted_array,
    )

    return {
        "Samples": len(actual_array),
        "MAE_kg_ha": mae,
        "RMSE_kg_ha": rmse,
        "R2": r2,
        "Mean_Error_kg_ha": np.mean(error),
        "Median_Absolute_Error_kg_ha": np.median(
            np.abs(error)
        ),
    }


def run_cross_validation(
    dataset,
    features,
    model_name,
):
    x = dataset[features].copy()
    y = dataset[TARGET].copy()
    groups = create_groups(dataset)

    unique_groups = groups.nunique()

    if unique_groups < N_SPLITS:
        raise ValueError(
            f"Only {unique_groups} groups are available "
            f"for {N_SPLITS}-fold cross-validation."
        )

    splitter = GroupKFold(
        n_splits=N_SPLITS
    )

    predictions = []
    fold_results = []

    for fold, (
        train_index,
        test_index,
    ) in enumerate(
        splitter.split(
            x,
            y,
            groups,
        ),
        start=1,
    ):
        x_train = x.iloc[train_index]
        x_test = x.iloc[test_index]

        y_train = y.iloc[train_index]
        y_test = y.iloc[test_index]

        model = build_pipeline(
            dataset,
            features,
        )

        model.fit(
            x_train,
            y_train,
        )

        predicted = model.predict(
            x_test
        )

        metrics = calculate_metrics(
            y_test,
            predicted,
        )

        metrics["Model"] = model_name
        metrics["Fold"] = fold

        fold_results.append(
            metrics
        )

        fold_predictions = pd.DataFrame(
            {
                "Row_Index": test_index,
                "Actual_Yield": y_test.to_numpy(),
                "Predicted_Yield": predicted,
                "Fold": fold,
                "Model": model_name,
            }
        )

        fold_predictions["Residual"] = (
            fold_predictions["Actual_Yield"]
            - fold_predictions["Predicted_Yield"]
        )

        fold_predictions["Absolute_Error"] = (
            fold_predictions["Residual"].abs()
        )

        predictions.append(
            fold_predictions
        )

        print(
            f"{model_name} | Fold {fold} | "
            f"MAE: {metrics['MAE_kg_ha']:.2f} | "
            f"RMSE: {metrics['RMSE_kg_ha']:.2f} | "
            f"R2: {metrics['R2']:.4f}"
        )

    prediction_data = pd.concat(
        predictions,
        ignore_index=True,
    )

    overall = calculate_metrics(
        prediction_data["Actual_Yield"],
        prediction_data["Predicted_Yield"],
    )

    fold_data = pd.DataFrame(
        fold_results
    )

    overall["Model"] = model_name
    overall["Fold_MAE_Mean"] = (
        fold_data["MAE_kg_ha"].mean()
    )
    overall["Fold_MAE_STD"] = (
        fold_data["MAE_kg_ha"].std()
    )
    overall["Fold_R2_Mean"] = (
        fold_data["R2"].mean()
    )
    overall["Fold_R2_STD"] = (
        fold_data["R2"].std()
    )

    return (
        overall,
        fold_data,
        prediction_data,
    )


def fit_final_model(
    dataset,
    features,
):
    x = dataset[features].copy()
    y = dataset[TARGET].copy()

    model = build_pipeline(
        dataset,
        features,
    )

    model.fit(
        x,
        y,
    )

    return model


def extract_feature_importance(
    model,
    feature_set,
):
    preprocessor = model.named_steps[
        "preprocessor"
    ]

    estimator = model.named_steps[
        "model"
    ]

    values = np.asarray(
        estimator.feature_importances_
    )

    try:
        transformed_names = (
            preprocessor.get_feature_names_out()
        )
    except (AttributeError, ValueError):
        transformed_names = np.array(
            [
                f"Feature_{index + 1}"
                for index in range(
                    len(values)
                )
            ]
        )

    if len(transformed_names) != len(values):
        transformed_names = np.array(
            [
                f"Feature_{index + 1}"
                for index in range(
                    len(values)
                )
            ]
        )

    result = pd.DataFrame(
        {
            "Transformed_Feature":
                transformed_names,
            "Importance": values,
        }
    )

    total_importance = result[
        "Importance"
    ].sum()

    if total_importance != 0:
        result["Importance_Percent"] = (
            result["Importance"]
            / total_importance
            * 100
        )
    else:
        result["Importance_Percent"] = 0.0

    result["Model"] = feature_set

    return result.sort_values(
        "Importance",
        ascending=False,
    ).reset_index(drop=True)


def aggregate_original_importance(
    importance,
):
    result = importance.copy()

    result["Original_Feature"] = (
        result["Transformed_Feature"]
        .astype(str)
        .str.replace(
            "categorical__",
            "",
            regex=False,
        )
        .str.replace(
            "numerical__",
            "",
            regex=False,
        )
    )

    result["Original_Feature"] = (
        result["Original_Feature"]
        .str.replace(
            r"^Crop_",
            "Crop",
            regex=True,
        )
    )

    aggregated = (
        result
        .groupby(
            [
                "Model",
                "Original_Feature",
            ],
            as_index=False,
        )
        .agg(
            Importance=(
                "Importance",
                "sum",
            )
        )
    )

    totals = (
        aggregated
        .groupby("Model")[
            "Importance"
        ]
        .transform("sum")
    )

    aggregated["Importance_Percent"] = np.where(
        totals != 0,
        aggregated["Importance"]
        / totals
        * 100,
        0.0,
    )

    return (
        aggregated
        .sort_values(
            [
                "Model",
                "Importance",
            ],
            ascending=[
                True,
                False,
            ],
        )
        .reset_index(drop=True)
    )


def calculate_model_comparison(
    results,
):
    comparison = pd.DataFrame(
        results
    )

    full = comparison[
        comparison["Model"].str.startswith(
            "Full:"
        )
    ]

    if full.empty:
        return comparison

    full_mae = float(
        full.iloc[0]["MAE_kg_ha"]
    )

    full_rmse = float(
        full.iloc[0]["RMSE_kg_ha"]
    )

    full_r2 = float(
        full.iloc[0]["R2"]
    )

    comparison[
        "MAE_Change_vs_Full_kg_ha"
    ] = (
        comparison["MAE_kg_ha"]
        - full_mae
    )

    comparison[
        "RMSE_Change_vs_Full_kg_ha"
    ] = (
        comparison["RMSE_kg_ha"]
        - full_rmse
    )

    comparison[
        "R2_Change_vs_Full"
    ] = (
        comparison["R2"]
        - full_r2
    )

    comparison[
        "MAE_Percent_Change_vs_Full"
    ] = (
        (
            comparison["MAE_kg_ha"]
            - full_mae
        )
        / full_mae
        * 100
        if full_mae != 0
        else np.nan
    )

    comparison[
        "R2_Percent_Change_vs_Full"
    ] = (
        (
            comparison["R2"]
            - full_r2
        )
        / abs(full_r2)
        * 100
        if full_r2 != 0
        else np.nan
    )

    return comparison


def calculate_crop_dominance(
    importance,
):
    crop_rows = importance[
        importance["Original_Feature"]
        .str.startswith("Crop")
    ].copy()

    if crop_rows.empty:
        return pd.DataFrame(
            [
                {
                    "Crop_Importance_Percent": 0.0,
                    "Crop_Dominance_Status":
                        "No crop feature detected",
                }
            ]
        )

    crop_importance = (
        crop_rows["Importance_Percent"]
        .sum()
    )

    if crop_importance >= 90:
        status = "Extreme dominance"
    elif crop_importance >= 70:
        status = "Strong dominance"
    elif crop_importance >= 50:
        status = "Moderate dominance"
    elif crop_importance >= 25:
        status = "Low dominance"
    else:
        status = "Minimal dominance"

    return pd.DataFrame(
        [
            {
                "Crop_Importance_Percent":
                    crop_importance,
                "Crop_Dominance_Status":
                    status,
            }
        ]
    )


def create_comparison_plot(
    comparison,
):
    labels = [
        "Full Model",
        "No Crop",
        "Remote Sensing Only",
    ]

    prefixes = [
        "Full:",
        "No Crop:",
        "Remote Sensing Only:",
    ]

    values = []

    for prefix in prefixes:
        match = comparison[
            comparison["Model"].str.startswith(
                prefix
            )
        ]

        if match.empty:
            values.append(np.nan)
        else:
            values.append(
                match.iloc[0]["MAE_kg_ha"]
            )

    figure, axis = plt.subplots(
        figsize=(9, 6)
    )

    axis.bar(
        labels,
        values,
    )

    axis.set_ylabel(
        "MAE (kg/ha)"
    )

    axis.set_title(
        "Feature Ablation: Model MAE Comparison"
    )

    axis.grid(
        axis="y",
        alpha=0.3,
    )

    figure.tight_layout()

    figure.savefig(
        OUTPUT_DIR
        / "model_mae_comparison.png",
        dpi=300,
    )

    plt.close(figure)


def create_r2_plot(
    comparison,
):
    labels = [
        "Full Model",
        "No Crop",
        "Remote Sensing Only",
    ]

    prefixes = [
        "Full:",
        "No Crop:",
        "Remote Sensing Only:",
    ]

    values = []

    for prefix in prefixes:
        match = comparison[
            comparison["Model"].str.startswith(
                prefix
            )
        ]

        if match.empty:
            values.append(np.nan)
        else:
            values.append(
                match.iloc[0]["R2"]
            )

    figure, axis = plt.subplots(
        figsize=(9, 6)
    )

    axis.bar(
        labels,
        values,
    )

    axis.set_ylabel(
        "R²"
    )

    axis.set_title(
        "Feature Ablation: Model R² Comparison"
    )

    axis.grid(
        axis="y",
        alpha=0.3,
    )

    figure.tight_layout()

    figure.savefig(
        OUTPUT_DIR
        / "model_r2_comparison.png",
        dpi=300,
    )

    plt.close(figure)


def create_importance_plot(
    importance,
):
    if importance.empty:
        return

    full = importance[
        importance["Model"].str.startswith(
            "Full:"
        )
    ].head(15)

    if full.empty:
        return

    plot_data = full.sort_values(
        "Importance_Percent"
    )

    figure, axis = plt.subplots(
        figsize=(10, 8)
    )

    axis.barh(
        plot_data["Original_Feature"],
        plot_data["Importance_Percent"],
    )

    axis.set_xlabel(
        "Importance (%)"
    )

    axis.set_ylabel(
        "Feature"
    )

    axis.set_title(
        "Full Model Feature Importance"
    )

    figure.tight_layout()

    figure.savefig(
        OUTPUT_DIR
        / "full_model_feature_importance.png",
        dpi=300,
    )

    plt.close(figure)


def create_prediction_plot(
    predictions,
    model_name,
    filename,
):
    if predictions.empty:
        return

    figure, axis = plt.subplots(
        figsize=(8, 7)
    )

    axis.scatter(
        predictions["Actual_Yield"],
        predictions["Predicted_Yield"],
        alpha=0.7,
    )

    minimum = min(
        predictions["Actual_Yield"].min(),
        predictions["Predicted_Yield"].min(),
    )

    maximum = max(
        predictions["Actual_Yield"].max(),
        predictions["Predicted_Yield"].max(),
    )

    axis.plot(
        [minimum, maximum],
        [minimum, maximum],
        linestyle="--",
    )

    axis.set_xlabel(
        "Actual Yield (kg/ha)"
    )

    axis.set_ylabel(
        "Predicted Yield (kg/ha)"
    )

    axis.set_title(
        f"{model_name}: Actual vs Predicted"
    )

    figure.tight_layout()

    figure.savefig(
        OUTPUT_DIR / filename,
        dpi=300,
    )

    plt.close(figure)


def add_metadata(
    predictions,
    dataset,
):
    metadata_columns = [
        column
        for column in METADATA_COLUMNS
        if column in dataset.columns
    ]

    metadata = dataset[
        metadata_columns
    ].copy()

    metadata["Row_Index"] = metadata.index

    return predictions.merge(
        metadata,
        on="Row_Index",
        how="left",
    )


def save_results(
    comparison,
    fold_results,
    predictions,
    transformed_importance,
    original_importance,
    dominance,
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    comparison.to_csv(
        OUTPUT_DIR
        / "model_comparison.csv",
        index=False,
    )

    fold_results.to_csv(
        OUTPUT_DIR
        / "fold_comparison.csv",
        index=False,
    )

    predictions.to_csv(
        OUTPUT_DIR
        / "ablation_predictions.csv",
        index=False,
    )

    transformed_importance.to_csv(
        OUTPUT_DIR
        / "transformed_feature_importance.csv",
        index=False,
    )

    original_importance.to_csv(
        OUTPUT_DIR
        / "original_feature_importance.csv",
        index=False,
    )

    dominance.to_csv(
        OUTPUT_DIR
        / "crop_dominance.csv",
        index=False,
    )


def print_report(
    comparison,
    dominance,
):
    print()
    print("=" * 70)
    print(
        "FEATURE ABLATION AND CROP DOMINANCE ANALYSIS"
    )
    print("=" * 70)

    print()
    print("MODEL COMPARISON")
    print("-" * 70)

    display_columns = [
        "Model",
        "Samples",
        "MAE_kg_ha",
        "RMSE_kg_ha",
        "R2",
        "Fold_MAE_Mean",
        "Fold_MAE_STD",
        "Fold_R2_Mean",
        "Fold_R2_STD",
    ]

    available_display_columns = [
        column
        for column in display_columns
        if column in comparison.columns
    ]

    print(
        comparison[
            available_display_columns
        ].round(4).to_string(
            index=False
        )
    )

    print()
    print("CROP DOMINANCE")
    print("-" * 70)

    if not dominance.empty:
        result = dominance.iloc[0]

        print(
            "Crop importance: "
            f"{result['Crop_Importance_Percent']:.4f}%"
        )

        print(
            "Dominance status: "
            f"{result['Crop_Dominance_Status']}"
        )

    print()
    print("INTERPRETATION")
    print("-" * 70)

    full = comparison[
        comparison["Model"].str.startswith(
            "Full:"
        )
    ]

    no_crop = comparison[
        comparison["Model"].str.startswith(
            "No Crop:"
        )
    ]

    remote_only = comparison[
        comparison["Model"].str.startswith(
            "Remote Sensing Only:"
        )
    ]

    if not full.empty and not no_crop.empty:
        full_mae = full.iloc[0]["MAE_kg_ha"]
        no_crop_mae = no_crop.iloc[0]["MAE_kg_ha"]
        full_r2 = full.iloc[0]["R2"]
        no_crop_r2 = no_crop.iloc[0]["R2"]

        mae_change = (
            no_crop_mae
            - full_mae
        )

        r2_change = (
            no_crop_r2
            - full_r2
        )

        if mae_change > 0:
            print(
                "Removing Crop increased MAE by "
                f"{mae_change:.2f} kg/ha."
            )
        else:
            print(
                "Removing Crop reduced MAE by "
                f"{abs(mae_change):.2f} kg/ha."
            )

        if r2_change < 0:
            print(
                "Removing Crop reduced R² by "
                f"{abs(r2_change):.4f}."
            )
        else:
            print(
                "Removing Crop increased R² by "
                f"{r2_change:.4f}."
            )

    if not remote_only.empty:
        print(
            "The Remote Sensing Only model provides "
            "a direct test of predictive information "
            "from satellite-derived features."
        )

    print()
    print(
        "All models use the same grouped cross-validation "
        "strategy and the same Extra Trees algorithm."
    )


def main():
    print("=" * 70)
    print(
        "GENERATING FEATURE ABLATION ANALYSIS"
    )
    print("=" * 70)

    dataset = load_dataset()

    (
        crop_features,
        remote_features,
        environmental_features,
    ) = get_available_features(
        dataset
    )

    feature_sets = create_feature_sets(
        crop_features,
        remote_features,
        environmental_features,
    )

    validate_feature_sets(
        dataset,
        feature_sets,
    )

    validate_numeric_features(
        dataset,
        feature_sets
    )

    all_results = []
    all_folds = []
    all_predictions = []
    all_importance = []

    for model_name, features in feature_sets.items():
        print()
        print("=" * 70)
        print(model_name)
        print("=" * 70)

        (
            overall,
            folds,
            predictions,
        ) = run_cross_validation(
            dataset,
            features,
            model_name,
        )

        all_results.append(
            overall
        )

        all_folds.append(
            folds
        )

        predictions = add_metadata(
            predictions,
            dataset,
        )

        all_predictions.append(
            predictions
        )

        final_model = fit_final_model(
            dataset,
            features,
        )

        importance = extract_feature_importance(
            final_model,
            model_name,
        )

        all_importance.append(
            importance
        )

    comparison = calculate_model_comparison(
        all_results
    )

    fold_results = pd.concat(
        all_folds,
        ignore_index=True,
    )

    prediction_results = pd.concat(
        all_predictions,
        ignore_index=True,
    )

    transformed_importance = pd.concat(
        all_importance,
        ignore_index=True,
    )

    original_importance = (
        aggregate_original_importance(
            transformed_importance
        )
    )

    full_importance = original_importance[
        original_importance["Model"].str.startswith(
            "Full:"
        )
    ]

    dominance = calculate_crop_dominance(
        full_importance
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    create_comparison_plot(
        comparison
    )

    create_r2_plot(
        comparison
    )

    create_importance_plot(
        original_importance
    )

    full_predictions = prediction_results[
        prediction_results["Model"].str.startswith(
            "Full:"
        )
    ]

    no_crop_predictions = prediction_results[
        prediction_results["Model"].str.startswith(
            "No Crop:"
        )
    ]

    remote_predictions = prediction_results[
        prediction_results["Model"].str.startswith(
            "Remote Sensing Only:"
        )
    ]

    create_prediction_plot(
        full_predictions,
        "Full Model",
        "full_model_actual_vs_predicted.png",
    )

    create_prediction_plot(
        no_crop_predictions,
        "No Crop Model",
        "no_crop_actual_vs_predicted.png",
    )

    create_prediction_plot(
        remote_predictions,
        "Remote Sensing Only",
        "remote_sensing_actual_vs_predicted.png",
    )

    save_results(
        comparison,
        fold_results,
        prediction_results,
        transformed_importance,
        original_importance,
        dominance,
    )

    print_report(
        comparison,
        dominance,
    )

    print()
    print("=" * 70)
    print("OUTPUT")
    print("=" * 70)

    print(
        f"Results directory: {OUTPUT_DIR}"
    )

    print(
        f"Model comparison: "
        f"{OUTPUT_DIR / 'model_comparison.csv'}"
    )

    print(
        f"Fold comparison: "
        f"{OUTPUT_DIR / 'fold_comparison.csv'}"
    )

    print(
        f"Ablation predictions: "
        f"{OUTPUT_DIR / 'ablation_predictions.csv'}"
    )

    print(
        f"Transformed feature importance: "
        f"{OUTPUT_DIR / 'transformed_feature_importance.csv'}"
    )

    print(
        f"Original feature importance: "
        f"{OUTPUT_DIR / 'original_feature_importance.csv'}"
    )

    print(
        f"Crop dominance: "
        f"{OUTPUT_DIR / 'crop_dominance.csv'}"
    )

    print()
    print(
        f"Plots saved in: {OUTPUT_DIR}"
    )

    print()
    print("=" * 70)
    print(
        "FEATURE ABLATION ANALYSIS COMPLETED"
    )
    print("=" * 70)


if __name__ == "__main__":
    main()
