"""
Temporal analysis of agricultural remote sensing features.

Analyzes NDVI, NDWI, and EVI across districts, years, and seasons.
"""

from pathlib import Path

import pandas as pd


DATA_PATH = Path("data/temporal_features.csv")
OUTPUT_DIR = Path("data/analysis")


def load_temporal_data() -> pd.DataFrame:
    """Load the temporal feature dataset."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    return pd.read_csv(DATA_PATH)


def calculate_yearly_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate yearly statistics for vegetation indices."""

    return (
        df.groupby(["District", "Year"])[
            ["NDVI", "NDWI", "EVI"]
        ]
        .mean()
        .reset_index()
    )


def calculate_seasonal_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate seasonal statistics for vegetation indices."""

    return (
        df.groupby(["District", "Season"])[
            ["NDVI", "NDWI", "EVI"]
        ]
        .mean()
        .reset_index()
    )


def calculate_district_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate overall statistics for each district."""

    return (
        df.groupby("District")[
            ["NDVI", "NDWI", "EVI"]
        ]
        .mean()
        .reset_index()
    )


def calculate_yearly_change(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate year-to-year changes in vegetation indices."""

    yearly = (
        df.groupby(["District", "Year"])[
            ["NDVI", "NDWI", "EVI"]
        ]
        .mean()
        .reset_index()
    )

    yearly["NDVI_Change"] = (
        yearly.groupby("District")["NDVI"].diff()
    )

    yearly["NDWI_Change"] = (
        yearly.groupby("District")["NDWI"].diff()
    )

    yearly["EVI_Change"] = (
        yearly.groupby("District")["EVI"].diff()
    )

    return yearly


def calculate_seasonal_difference(df: pd.DataFrame) -> pd.DataFrame:
    """Compare Kharif and Rabi vegetation indices."""

    seasonal = (
        df.groupby(["District", "Season"])[
            ["NDVI", "NDWI", "EVI"]
        ]
        .mean()
        .reset_index()
    )

    pivot = seasonal.pivot(
        index="District",
        columns="Season",
        values=["NDVI", "NDWI", "EVI"],
    )

    result = pd.DataFrame(index=pivot.index)

    result["NDVI_Difference"] = (
        pivot[("NDVI", "Kharif")]
        - pivot[("NDVI", "Rabi")]
    )

    result["NDWI_Difference"] = (
        pivot[("NDWI", "Kharif")]
        - pivot[("NDWI", "Rabi")]
    )

    result["EVI_Difference"] = (
        pivot[("EVI", "Kharif")]
        - pivot[("EVI", "Rabi")]
    )

    return result.reset_index()


def calculate_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate anomalies relative to each district's mean."""

    result = df.copy()

    for feature in ["NDVI", "NDWI", "EVI"]:
        district_mean = result.groupby("District")[feature].transform(
            "mean"
        )

        result[f"{feature}_Anomaly"] = (
            result[feature] - district_mean
        )

    return result


def calculate_correlations(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate correlations between vegetation indices."""

    return df[["NDVI", "NDWI", "EVI"]].corr()


def save_results(
    yearly: pd.DataFrame,
    seasonal: pd.DataFrame,
    district: pd.DataFrame,
    yearly_change: pd.DataFrame,
    seasonal_difference: pd.DataFrame,
    anomalies: pd.DataFrame,
    correlations: pd.DataFrame,
) -> None:
    """Save temporal analysis results."""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    yearly.to_csv(
        OUTPUT_DIR / "yearly_statistics.csv",
        index=False,
    )

    seasonal.to_csv(
        OUTPUT_DIR / "seasonal_statistics.csv",
        index=False,
    )

    district.to_csv(
        OUTPUT_DIR / "district_statistics.csv",
        index=False,
    )

    yearly_change.to_csv(
        OUTPUT_DIR / "yearly_change.csv",
        index=False,
    )

    seasonal_difference.to_csv(
        OUTPUT_DIR / "seasonal_difference.csv",
        index=False,
    )

    anomalies.to_csv(
        OUTPUT_DIR / "anomalies.csv",
        index=False,
    )

    correlations.to_csv(
        OUTPUT_DIR / "correlations.csv",
    )


def main() -> None:
    """Run the complete temporal analysis pipeline."""

    print("Loading temporal dataset...")

    df = load_temporal_data()

    print(f"Rows loaded: {len(df)}")

    print("Calculating yearly statistics...")
    yearly = calculate_yearly_statistics(df)

    print("Calculating seasonal statistics...")
    seasonal = calculate_seasonal_statistics(df)

    print("Calculating district statistics...")
    district = calculate_district_statistics(df)

    print("Calculating yearly changes...")
    yearly_change = calculate_yearly_change(df)

    print("Calculating seasonal differences...")
    seasonal_difference = calculate_seasonal_difference(df)

    print("Calculating anomalies...")
    anomalies = calculate_anomalies(df)

    print("Calculating correlations...")
    correlations = calculate_correlations(df)

    save_results(
        yearly,
        seasonal,
        district,
        yearly_change,
        seasonal_difference,
        anomalies,
        correlations,
    )

    print()
    print("Temporal analysis completed successfully.")
    print(f"Results saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
