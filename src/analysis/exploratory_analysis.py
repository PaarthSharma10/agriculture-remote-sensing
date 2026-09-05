from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_features.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "temporal"
    / "temporal_validation_summary.csv"
)

EXPECTED_YEARS = list(range(2021, 2026))
EXPECTED_SEASONS = ["Rabi", "Kharif"]

INDEX_COLUMNS = ["NDVI", "NDWI", "EVI"]

EXPECTED_DISTRICTS = [
    "Amritsar",
    "Bathinda",
    "Sangrur",
    "Ludhiana",
    "Patiala",
    "Jalandhar",
    "Moga",
    "Firozpur",
    "Tarn Taran",
    "Barnala",
]

EXPECTED_ROWS = (
    len(EXPECTED_DISTRICTS)
    * len(EXPECTED_YEARS)
    * len(EXPECTED_SEASONS)
)


def print_section(title):
    """Print a formatted section heading."""

    print()
    print("=" * 60)
    print(title)
    print("=" * 60)


def detect_iqr_outliers(dataframe, column):
    """Detect potential outliers using the IQR method."""

    series = dataframe[column].dropna()

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - (1.5 * iqr)
    upper_bound = q3 + (1.5 * iqr)

    outliers = dataframe[
        (dataframe[column] < lower_bound)
        | (dataframe[column] > upper_bound)
    ].copy()

    return outliers, lower_bound, upper_bound


def main():
    """Validate the recovered Sentinel-2 temporal dataset."""

    print("=" * 60)
    print("SENTINEL-2 TEMPORAL DATA VALIDATION")
    print("=" * 60)

    print("\nInput dataset:")
    print(INPUT_FILE)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Temporal dataset not found:\n{INPUT_FILE}"
        )

    dataframe = pd.read_csv(INPUT_FILE)

    print(f"\nRows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    print_section("DATASET STRUCTURE")

    print("Columns:")

    for column in dataframe.columns:
        print(f"    - {column}")

    dataframe.columns = (
        dataframe.columns
        .str.strip()
        .str.lower()
    )

    dataframe = dataframe.rename(
        columns={
            "start_date": "Start_Date",
            "end_date": "End_Date",
            "image_count": "Image_Count",
            "ndvi": "NDVI",
            "ndwi": "NDWI",
            "evi": "EVI",
        }
    )

    required_columns = [
        "district",
        "year",
        "season",
        "Start_Date",
        "End_Date",
        "Image_Count",
        "NDVI",
        "NDWI",
        "EVI",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    print("\nRequired columns: PASS")

    print(f"\nExpected rows: {EXPECTED_ROWS}")
    print(f"Actual rows:   {len(dataframe)}")

    if len(dataframe) == EXPECTED_ROWS:
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("MISSING VALUE CHECK")

    missing_values = dataframe[required_columns].isna().sum()

    print(missing_values)

    total_missing = int(missing_values.sum())

    print(f"\nTotal missing values: {total_missing}")

    if total_missing == 0:
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("DUPLICATE OBSERVATION CHECK")

    key_columns = [
        "district",
        "year",
        "season",
    ]

    duplicates = dataframe[
        dataframe.duplicated(
            subset=key_columns,
            keep=False,
        )
    ].sort_values(key_columns)

    duplicate_count = len(duplicates)

    print(f"Duplicate rows: {duplicate_count}")

    if duplicate_count == 0:
        print("Status: PASS")
    else:
        print("Status: WARNING")
        print("\nDuplicate observations:")
        print(
            duplicates[
                key_columns
            ].to_string(index=False)
        )

    print_section("YEAR VALIDATION")

    dataframe["year"] = pd.to_numeric(
        dataframe["year"],
        errors="coerce",
    )

    unique_years = sorted(
        dataframe["year"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Years found: {unique_years}")
    print(f"Expected:    {EXPECTED_YEARS}")

    invalid_years = [
        year
        for year in unique_years
        if year not in EXPECTED_YEARS
    ]

    if not invalid_years:
        print("Status: PASS")
    else:
        print(f"Status: WARNING — {invalid_years}")

    print_section("SEASON VALIDATION")

    unique_seasons = sorted(
        dataframe["season"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Seasons found: {unique_seasons}")
    print(f"Expected:      {EXPECTED_SEASONS}")

    invalid_seasons = [
        season
        for season in unique_seasons
        if season not in EXPECTED_SEASONS
    ]

    if not invalid_seasons:
        print("Status: PASS")
    else:
        print(f"Status: WARNING — {invalid_seasons}")

    print_section("DISTRICT VALIDATION")

    districts = sorted(
        dataframe["district"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Number of districts: {len(districts)}")

    for district in districts:
        print(f"    - {district}")

    missing_districts = [
        district
        for district in EXPECTED_DISTRICTS
        if district not in districts
    ]

    unexpected_districts = [
        district
        for district in districts
        if district not in EXPECTED_DISTRICTS
    ]

    if not missing_districts and not unexpected_districts:
        print("Status: PASS")
    else:
        print("Status: WARNING")

        if missing_districts:
            print(
                f"Missing districts: {missing_districts}"
            )

        if unexpected_districts:
            print(
                f"Unexpected districts: "
                f"{unexpected_districts}"
            )

    print_section("OBSERVATIONS PER DISTRICT")

    district_counts = (
        dataframe
        .groupby("district")
        .size()
        .sort_index()
    )

    print(district_counts.to_string())

    print_section("OBSERVATIONS PER YEAR")

    year_counts = (
        dataframe
        .groupby("year")
        .size()
        .sort_index()
    )

    print(year_counts.to_string())

    print_section("OBSERVATIONS PER SEASON")

    season_counts = (
        dataframe
        .groupby("season")
        .size()
        .sort_index()
    )

    print(season_counts.to_string())

    print_section("VEGETATION INDEX STATISTICS")

    statistics = dataframe[
        INDEX_COLUMNS
    ].describe().T

    print(
        statistics[
            [
                "count",
                "mean",
                "std",
                "min",
                "25%",
                "50%",
                "75%",
                "max",
            ]
        ].round(4).to_string()
    )

    print_section("VEGETATION INDEX RANGE CHECK")

    for column in INDEX_COLUMNS:
        minimum = dataframe[column].min()
        maximum = dataframe[column].max()

        print(
            f"{column}: "
            f"min={minimum:.4f}, "
            f"max={maximum:.4f}"
        )

    print_section("IQR OUTLIER DETECTION")

    for column in INDEX_COLUMNS:
        (
            outliers,
            lower_bound,
            upper_bound,
        ) = detect_iqr_outliers(
            dataframe,
            column,
        )

        print(f"\n{column}")
        print(
            f"    Lower bound: "
            f"{lower_bound:.4f}"
        )
        print(
            f"    Upper bound: "
            f"{upper_bound:.4f}"
        )
        print(
            f"    Outliers: "
            f"{len(outliers)}"
        )

        if not outliers.empty:
            print(
                "\n    Potential outlier observations:"
            )

            for _, row in outliers.iterrows():
                print(
                    f"        "
                    f"{row['district']} | "
                    f"{int(row['year'])} | "
                    f"{row['season']} | "
                    f"{column}="
                    f"{row[column]:.4f}"
                )

    print_section("VEGETATION INDEX CORRELATION")

    correlation = dataframe[
        INDEX_COLUMNS
    ].corr()

    print(
        correlation.round(4).to_string()
    )

    print_section("RABI VS KHARIF")

    seasonal_means = (
        dataframe
        .groupby("season")[INDEX_COLUMNS]
        .mean()
        .round(4)
    )

    print(
        seasonal_means.to_string()
    )

    print_section("YEAR-WISE AVERAGES")

    yearly_means = (
        dataframe
        .groupby("year")[INDEX_COLUMNS]
        .mean()
        .round(4)
    )

    print(
        yearly_means.to_string()
    )

    print_section("DISTRICT-WISE AVERAGES")

    district_means = (
        dataframe
        .groupby("district")[INDEX_COLUMNS]
        .mean()
        .sort_values(
            "NDVI",
            ascending=False,
        )
        .round(4)
    )

    print(
        district_means.to_string()
    )

    print_section(
        "DISTRICT × YEAR × SEASON CHECK"
    )

    expected_combinations = EXPECTED_ROWS

    actual_combinations = (
        dataframe[
            key_columns
        ]
        .drop_duplicates()
        .shape[0]
    )

    print(
        f"Expected combinations: "
        f"{expected_combinations}"
    )

    print(
        f"Actual combinations:   "
        f"{actual_combinations}"
    )

    if expected_combinations == actual_combinations:
        print("Status: PASS")
    else:
        print("Status: WARNING")

    summary_rows = []

    for column in INDEX_COLUMNS:
        (
            outliers,
            lower_bound,
            upper_bound,
        ) = detect_iqr_outliers(
            dataframe,
            column,
        )

        summary_rows.append(
            {
                "index": column,
                "count": int(
                    dataframe[column].count()
                ),
                "mean": dataframe[column].mean(),
                "std": dataframe[column].std(),
                "min": dataframe[column].min(),
                "q1": dataframe[column].quantile(0.25),
                "median": dataframe[column].median(),
                "q3": dataframe[column].quantile(0.75),
                "max": dataframe[column].max(),
                "iqr_lower_bound": lower_bound,
                "iqr_upper_bound": upper_bound,
                "iqr_outlier_count": len(outliers),
            }
        )

    summary = pd.DataFrame(summary_rows)

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    summary.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print_section("FINAL VALIDATION")

    checks = {
        "Expected row count":
            len(dataframe) == EXPECTED_ROWS,
        "No missing values":
            total_missing == 0,
        "No duplicate observations":
            duplicate_count == 0,
        "Valid years":
            not invalid_years,
        "Valid seasons":
            not invalid_seasons,
        "Valid districts":
            not missing_districts
            and not unexpected_districts,
        "Complete district/year/season combinations":
            expected_combinations
            == actual_combinations,
    }

    all_passed = True

    for check_name, passed in checks.items():
        status = "PASS" if passed else "WARNING"

        print(
            f"{check_name}: {status}"
        )

        if not passed:
            all_passed = False

    print(
        "\nValidation summary saved:"
    )

    print(OUTPUT_FILE)

    print("\n" + "=" * 60)

    if all_passed:
        print(
            "TEMPORAL DATASET VALIDATION "
            "COMPLETED SUCCESSFULLY"
        )
    else:
        print(
            "TEMPORAL DATASET VALIDATION "
            "COMPLETED WITH WARNINGS"
        )

    print("=" * 60)


if __name__ == "__main__":
    main()
