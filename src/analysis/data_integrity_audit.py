from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "data" / "features" / "ml_features.csv"
OUTPUT_DIR = PROJECT_ROOT / "data" / "analysis" / "data_integrity"

REQUIRED_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop",
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture",
    "Yield_kg_ha",
]

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
    "Climate_Index",
]


def load_data():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE)

    print(f"Rows loaded: {len(df)}")
    print(f"Columns loaded: {len(df.columns)}")

    return df


def check_required_columns(df):
    print("\n" + "=" * 70)
    print("REQUIRED COLUMN CHECK")
    print("=" * 70)

    missing_columns = [
        column for column in REQUIRED_COLUMNS if column not in df.columns
    ]

    if missing_columns:
        print("Missing required columns:")
        for column in missing_columns:
            print(f"  {column}")
        return False

    print("All required columns are present.")
    return True


def check_missing_values(df):
    print("\n" + "=" * 70)
    print("MISSING VALUE CHECK")
    print("=" * 70)

    missing = df.isna().sum()
    missing = missing[missing > 0]

    if missing.empty:
        print("No missing values detected.")
        return 0

    print("Missing values detected:")
    print(missing.to_string())

    return int(missing.sum())


def check_duplicates(df):
    print("\n" + "=" * 70)
    print("DUPLICATE ROW CHECK")
    print("=" * 70)

    duplicate_count = int(df.duplicated().sum())

    print(f"Duplicate rows: {duplicate_count}")

    return duplicate_count


def analyze_group_structure(df):
    print("\n" + "=" * 70)
    print("DISTRICT-YEAR-SEASON GROUP STRUCTURE")
    print("=" * 70)

    group_columns = ["District", "Year", "Season"]

    grouped = df.groupby(group_columns)

    group_sizes = grouped.size()

    multi_crop_groups = int(
        grouped["Crop"].nunique().gt(1).sum()
    )

    print(f"Unique District-Year-Season groups: {len(group_sizes)}")
    print(f"Groups containing multiple crops: {multi_crop_groups}")

    print("\nObservations per group:")
    print(
        group_sizes.value_counts()
        .sort_index()
        .rename("Observations")
        .to_string()
    )

    return grouped, group_sizes, multi_crop_groups


def analyze_cross_crop_identity(df):
    print("\n" + "=" * 70)
    print("CROSS-CROP FEATURE IDENTITY CHECK")
    print("=" * 70)

    available_features = [
        column for column in FEATURE_COLUMNS if column in df.columns
    ]

    grouped = df.groupby(["District", "Year", "Season"])

    multi_crop = grouped.filter(
        lambda group: group["Crop"].nunique() > 1
    )

    if multi_crop.empty:
        print("No multi-crop groups found.")
        return 0, 0

    identity_results = []

    for group_key, group in multi_crop.groupby(
        ["District", "Year", "Season"]
    ):
        feature_identity = all(
            group[column].nunique(dropna=False) == 1
            for column in available_features
        )

        identity_results.append(
            {
                "District": group_key[0],
                "Year": group_key[1],
                "Season": group_key[2],
                "All_Features_Identical": feature_identity,
            }
        )

    identity_df = pd.DataFrame(identity_results)

    total_groups = len(identity_df)
    identical_groups = int(
        identity_df["All_Features_Identical"].sum()
    )

    print(f"Multi-crop groups analyzed: {total_groups}")
    print(
        "Groups with all features identical across crops: "
        f"{identical_groups}"
    )

    return total_groups, identical_groups


def analyze_feature_uniqueness(df):
    print("\n" + "=" * 70)
    print("FEATURE UNIQUENESS")
    print("=" * 70)

    available_features = [
        column for column in FEATURE_COLUMNS if column in df.columns
    ]

    records = []

    for feature in available_features:
        unique_values = df[feature].nunique(dropna=False)
        total_values = len(df)

        records.append(
            {
                "Feature": feature,
                "Unique_Values": unique_values,
                "Total_Values": total_values,
                "Uniqueness_Ratio": (
                    unique_values / total_values
                    if total_values
                    else np.nan
                ),
            }
        )

    result = pd.DataFrame(records)

    if result.empty:
        print("No feature columns available.")
        return result

    print(
        result.to_string(
            index=False,
            formatters={
                "Uniqueness_Ratio": "{:.4f}".format
            },
        )
    )

    return result


def analyze_repeated_feature_groups(df):
    print("\n" + "=" * 70)
    print("YIELD VARIATION WITH IDENTICAL FEATURES")
    print("=" * 70)

    available_features = [
        column for column in FEATURE_COLUMNS if column in df.columns
    ]

    grouped = df.groupby(
        ["District", "Year", "Season"]
    )

    repeated_groups = 0
    varying_yield_groups = 0

    for _, group in grouped:
        if len(group) <= 1:
            continue

        identical_features = all(
            group[column].nunique(dropna=False) == 1
            for column in available_features
        )

        if identical_features:
            repeated_groups += 1

            if group["Yield_kg_ha"].nunique(dropna=False) > 1:
                varying_yield_groups += 1

    print(f"Repeated feature groups: {repeated_groups}")
    print(
        "Repeated feature groups with varying yields: "
        f"{varying_yield_groups}"
    )

    return repeated_groups, varying_yield_groups


def analyze_crop_distribution(df):
    print("\n" + "=" * 70)
    print("CROP DISTRIBUTION")
    print("=" * 70)

    result = (
        df.groupby("Crop")
        .size()
        .rename("Samples")
        .reset_index()
        .sort_values("Samples", ascending=False)
    )

    print(result.to_string(index=False))

    return result


def analyze_temporal_distribution(df):
    print("\n" + "=" * 70)
    print("TEMPORAL DISTRIBUTION")
    print("=" * 70)

    result = (
        df.groupby(["Year", "Season"])
        .size()
        .rename("Samples")
        .reset_index()
        .sort_values(["Year", "Season"])
    )

    print(result.to_string(index=False))

    return result


def analyze_crop_feature_variation(df):
    print("\n" + "=" * 70)
    print("CROP-WISE FEATURE VARIATION")
    print("=" * 70)

    available_features = [
        column for column in FEATURE_COLUMNS if column in df.columns
    ]

    records = []

    for crop, group in df.groupby("Crop"):
        for feature in available_features:
            records.append(
                {
                    "Crop": crop,
                    "Feature": feature,
                    "Unique_Values": group[feature].nunique(
                        dropna=False
                    ),
                    "Samples": len(group),
                }
            )

    result = pd.DataFrame(records)

    if result.empty:
        return result

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    result.to_csv(
        OUTPUT_DIR / "crop_feature_variation.csv",
        index=False,
    )

    return result


def analyze_potential_leakage(df):
    print("\n" + "=" * 70)
    print("POTENTIAL LEAKAGE CHECK")
    print("=" * 70)

    numeric_features = [
        column
        for column in FEATURE_COLUMNS
        if column in df.columns
        and pd.api.types.is_numeric_dtype(df[column])
    ]

    records = []

    for feature in numeric_features:
        correlation = df[feature].corr(df["Yield_kg_ha"])

        records.append(
            {
                "Feature": feature,
                "Correlation_with_Yield": correlation,
            }
        )

    crop_encoded = pd.factorize(df["Crop"])[0]

    crop_correlation = np.corrcoef(
        crop_encoded,
        df["Yield_kg_ha"].to_numpy()
    )[0, 1]

    records.insert(
        0,
        {
            "Feature": "Crop",
            "Correlation_with_Yield": crop_correlation,
        },
    )

    result = pd.DataFrame(records)

    print(
        result.to_string(
            index=False,
            formatters={
                "Correlation_with_Yield": (
                    lambda value: (
                        "NaN"
                        if pd.isna(value)
                        else f"{value:.4f}"
                    )
                )
            },
        )
    )

    return result


def create_summary(
    df,
    multi_crop_groups,
    identical_groups,
    repeated_groups,
    varying_yield_groups,
    duplicate_rows,
    missing_values,
    unique_groups,
):
    summary = pd.DataFrame(
        [
            {
                "Total_Rows": len(df),
                "Unique_Districts": df["District"].nunique(),
                "Unique_Years": df["Year"].nunique(),
                "Unique_Seasons": df["Season"].nunique(),
                "Unique_Crops": df["Crop"].nunique(),
                "Unique_Groups": unique_groups,
                "Multi_Crop_Groups": multi_crop_groups,
                "All_Features_Identical_Across_Crops": identical_groups,
                "Repeated_Feature_Groups": repeated_groups,
                "Repeated_Feature_Groups_With_Varying_Yield": (
                    varying_yield_groups
                ),
                "Duplicate_Rows": duplicate_rows,
                "Missing_Values": missing_values,
            }
        ]
    )

    return summary


def save_results(
    summary,
    feature_uniqueness,
    crop_distribution,
    temporal_distribution,
    leakage_results,
):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    summary.to_csv(
        OUTPUT_DIR / "integrity_summary.csv",
        index=False,
    )

    feature_uniqueness.to_csv(
        OUTPUT_DIR / "feature_uniqueness.csv",
        index=False,
    )

    crop_distribution.to_csv(
        OUTPUT_DIR / "crop_distribution.csv",
        index=False,
    )

    temporal_distribution.to_csv(
        OUTPUT_DIR / "temporal_distribution.csv",
        index=False,
    )

    leakage_results.to_csv(
        OUTPUT_DIR / "potential_leakage.csv",
        index=False,
    )


def main():
    print("=" * 70)
    print("AGRICULTURAL ML DATA INTEGRITY AUDIT")
    print("=" * 70)

    df = load_data()

    if not check_required_columns(df):
        raise ValueError("Required columns are missing.")

    missing_values = check_missing_values(df)

    duplicate_rows = check_duplicates(df)

    grouped, group_sizes, multi_crop_groups = analyze_group_structure(df)

    del grouped

    unique_groups = len(group_sizes)

    multi_crop_count, identical_groups = analyze_cross_crop_identity(df)

    if multi_crop_count != multi_crop_groups:
        multi_crop_groups = multi_crop_count

    feature_uniqueness = analyze_feature_uniqueness(df)

    repeated_groups, varying_yield_groups = (
        analyze_repeated_feature_groups(df)
    )

    crop_distribution = analyze_crop_distribution(df)

    temporal_distribution = analyze_temporal_distribution(df)

    analyze_crop_feature_variation(df)

    leakage_results = analyze_potential_leakage(df)

    summary = create_summary(
        df=df,
        multi_crop_groups=multi_crop_groups,
        identical_groups=identical_groups,
        repeated_groups=repeated_groups,
        varying_yield_groups=varying_yield_groups,
        duplicate_rows=duplicate_rows,
        missing_values=missing_values,
        unique_groups=unique_groups,
    )

    print("\n" + "=" * 70)
    print("DATA INTEGRITY AUDIT SUMMARY")
    print("=" * 70)

    print(summary.to_string(index=False))

    save_results(
        summary,
        feature_uniqueness,
        crop_distribution,
        temporal_distribution,
        leakage_results,
    )

    print("\n" + "=" * 70)
    print("DATA INTEGRITY AUDIT COMPLETED")
    print("=" * 70)

    print(f"\nResults saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
