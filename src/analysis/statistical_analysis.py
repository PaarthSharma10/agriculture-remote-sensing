from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "engineered_features.csv"
)

OUTPUT_DIRECTORY = (
    PROJECT_ROOT
    / "data"
    / "analysis"
)


def load_data() -> pd.DataFrame:

    print("Loading engineered dataset...")

    dataframe = pd.read_csv(
        INPUT_FILE,
    )

    print(
        f"Rows loaded: {len(dataframe)}"
    )

    return dataframe


def calculate_correlation_analysis(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    features = [
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture",
    ]

    results = []

    for feature in features:

        valid_data = dataframe[
            [
                feature,
                "NDVI",
            ]
        ].dropna()

        pearson_r, pearson_p = (
            stats.pearsonr(
                valid_data[feature],
                valid_data["NDVI"],
            )
        )

        spearman_r, spearman_p = (
            stats.spearmanr(
                valid_data[feature],
                valid_data["NDVI"],
            )
        )

        results.append(
            {
                "Feature": feature,
                "Pearson_Correlation": pearson_r,
                "Pearson_P_Value": pearson_p,
                "Spearman_Correlation": spearman_r,
                "Spearman_P_Value": spearman_p,
            }
        )

    results_dataframe = pd.DataFrame(
        results,
    )

    return results_dataframe


def calculate_regression_analysis(
    dataframe: pd.DataFrame,
) -> dict:

    features = [
        "Rainfall_mm",
        "Temperature_C",
        "Soil_Moisture",
    ]

    model_data = dataframe[
        features + ["NDVI"]
    ].dropna()

    x = model_data[
        features
    ]

    y = model_data[
        "NDVI"
    ]

    model = LinearRegression()

    model.fit(
        x,
        y,
    )

    predictions = model.predict(
        x,
    )

    r2 = r2_score(
        y,
        predictions,
    )

    mae = mean_absolute_error(
        y,
        predictions,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y,
            predictions,
        )
    )

    coefficients = pd.DataFrame(
        {
            "Feature": features,
            "Coefficient": model.coef_,
        }
    )

    return {
        "model": model,
        "coefficients": coefficients,
        "intercept": model.intercept_,
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
        "observations": len(model_data),
    }


def calculate_seasonal_statistics(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    rabi = dataframe[
        dataframe["Season"] == "Rabi"
    ]["NDVI"]

    kharif = dataframe[
        dataframe["Season"] == "Kharif"
    ]["NDVI"]

    statistic, p_value = (
        stats.ttest_ind(
            rabi,
            kharif,
            equal_var=False,
        )
    )

    result = pd.DataFrame(
        [
            {
                "Group": "Season",
                "Comparison": "Rabi vs Kharif",
                "Statistic": statistic,
                "P_Value": p_value,
                "Rabi_Mean_NDVI": rabi.mean(),
                "Kharif_Mean_NDVI": kharif.mean(),
            }
        ]
    )

    return result


def calculate_district_statistics(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    groups = []

    for district in dataframe[
        "District"
    ].unique():

        values = dataframe[
            dataframe["District"] == district
        ]["NDVI"]

        groups.append(
            values
        )

    statistic, p_value = (
        stats.f_oneway(
            *groups
        )
    )

    district_means = (
        dataframe
        .groupby("District")["NDVI"]
        .mean()
        .reset_index()
    )

    district_means[
        "ANOVA_Statistic"
    ] = statistic

    district_means[
        "ANOVA_P_Value"
    ] = p_value

    return district_means


def calculate_yearly_statistics(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    yearly = (
        dataframe
        .groupby("Year")["NDVI"]
        .agg(
            [
                "mean",
                "std",
                "count",
            ]
        )
        .reset_index()
    )

    yearly = yearly.rename(
        columns={
            "mean": "Mean_NDVI",
            "std": "Std_NDVI",
            "count": "Observations",
        }
    )

    return yearly


def save_results(
    correlation_results: pd.DataFrame,
    regression_results: dict,
    seasonal_results: pd.DataFrame,
    district_results: pd.DataFrame,
    yearly_results: pd.DataFrame,
) -> None:

    OUTPUT_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    correlation_file = (
        OUTPUT_DIRECTORY
        / "correlation_statistics.csv"
    )

    regression_file = (
        OUTPUT_DIRECTORY
        / "regression_coefficients.csv"
    )

    seasonal_file = (
        OUTPUT_DIRECTORY
        / "seasonal_statistics.csv"
    )

    district_file = (
        OUTPUT_DIRECTORY
        / "district_statistics.csv"
    )

    yearly_file = (
        OUTPUT_DIRECTORY
        / "yearly_statistics.csv"
    )

    model_file = (
        OUTPUT_DIRECTORY
        / "regression_model_metrics.csv"
    )

    correlation_results.to_csv(
        correlation_file,
        index=False,
    )

    regression_results[
        "coefficients"
    ].to_csv(
        regression_file,
        index=False,
    )

    seasonal_results.to_csv(
        seasonal_file,
        index=False,
    )

    district_results.to_csv(
        district_file,
        index=False,
    )

    yearly_results.to_csv(
        yearly_file,
        index=False,
    )

    metrics = pd.DataFrame(
        [
            {
                "Observations": regression_results[
                    "observations"
                ],
                "R2": regression_results[
                    "r2"
                ],
                "MAE": regression_results[
                    "mae"
                ],
                "RMSE": regression_results[
                    "rmse"
                ],
                "Intercept": regression_results[
                    "intercept"
                ],
            }
        ]
    )

    metrics.to_csv(
        model_file,
        index=False,
    )


def print_results(
    correlation_results: pd.DataFrame,
    regression_results: dict,
    seasonal_results: pd.DataFrame,
    district_results: pd.DataFrame,
) -> None:

    print()
    print("=" * 60)
    print("STATISTICAL ANALYSIS RESULTS")
    print("=" * 60)

    print()
    print("Correlation analysis:")

    for _, row in correlation_results.iterrows():

        print(
            f"  {row['Feature']}: "
            f"Pearson r = "
            f"{row['Pearson_Correlation']:.4f}, "
            f"p = "
            f"{row['Pearson_P_Value']:.4f}, "
            f"Spearman r = "
            f"{row['Spearman_Correlation']:.4f}"
        )

    print()
    print("Multiple linear regression:")

    print(
        f"  Observations: "
        f"{regression_results['observations']}"
    )

    print(
        f"  R²: "
        f"{regression_results['r2']:.4f}"
    )

    print(
        f"  MAE: "
        f"{regression_results['mae']:.4f}"
    )

    print(
        f"  RMSE: "
        f"{regression_results['rmse']:.4f}"
    )

    print()
    print("Regression coefficients:")

    for _, row in (
        regression_results[
            "coefficients"
        ].iterrows()
    ):

        print(
            f"  {row['Feature']}: "
            f"{row['Coefficient']:.6f}"
        )

    print()
    print("Seasonal comparison:")

    row = seasonal_results.iloc[0]

    print(
        f"  Rabi mean NDVI: "
        f"{row['Rabi_Mean_NDVI']:.4f}"
    )

    print(
        f"  Kharif mean NDVI: "
        f"{row['Kharif_Mean_NDVI']:.4f}"
    )

    print(
        f"  t-statistic: "
        f"{row['Statistic']:.4f}"
    )

    print(
        f"  p-value: "
        f"{row['P_Value']:.4f}"
    )

    print()
    print("District comparison:")

    for _, row in district_results.iterrows():

        print(
            f"  {row['District']}: "
            f"mean NDVI = "
            f"{row['NDVI']:.4f}"
        )

    print()
    print(
        f"  ANOVA F-statistic: "
        f"{district_results['ANOVA_Statistic'].iloc[0]:.4f}"
    )

    print(
        f"  ANOVA p-value: "
        f"{district_results['ANOVA_P_Value'].iloc[0]:.4f}"
    )


def main() -> None:

    print("=" * 60)
    print("AGRICULTURAL STATISTICAL ANALYSIS")
    print("=" * 60)

    dataframe = load_data()

    print()
    print("Calculating Pearson and Spearman correlations...")

    correlation_results = (
        calculate_correlation_analysis(
            dataframe,
        )
    )

    print(
        "Calculating multiple linear regression..."
    )

    regression_results = (
        calculate_regression_analysis(
            dataframe,
        )
    )

    print(
        "Calculating seasonal statistics..."
    )

    seasonal_results = (
        calculate_seasonal_statistics(
            dataframe,
        )
    )

    print(
        "Calculating district statistics..."
    )

    district_results = (
        calculate_district_statistics(
            dataframe,
        )
    )

    print(
        "Calculating yearly statistics..."
    )

    yearly_results = (
        calculate_yearly_statistics(
            dataframe,
        )
    )

    print_results(
        correlation_results,
        regression_results,
        seasonal_results,
        district_results,
    )

    save_results(
        correlation_results,
        regression_results,
        seasonal_results,
        district_results,
        yearly_results,
    )

    print()
    print("=" * 60)
    print("STATISTICAL ANALYSIS COMPLETED")
    print("=" * 60)

    print()
    print(
        f"Results saved to: "
        f"{OUTPUT_DIRECTORY}"
    )


if __name__ == "__main__":
    main()
