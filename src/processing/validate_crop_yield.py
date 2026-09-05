from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "crops"
    / "processed"
    / "crop_yield_2020_2022.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "crops"
    / "processed"
    / "crop_yield_validation_summary.csv"
)

EXPECTED_YEARS = [2020, 2021, 2022]

EXPECTED_DISTRICTS = [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Firozpur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar",
    "Sangrur",
    "Shahid Bhagat Singh Nagar",
    "Tarn Taran",
]

EXPECTED_CROPS = [
    "Bajra",
    "Barley",
    "Potato",
    "Rice",
    "Wheat",
]

EXPECTED_SEASONS = {
    "Bajra": "Kharif",
    "Barley": "Rabi",
    "Potato": "Rabi",
    "Rice": "Kharif",
    "Wheat": "Rabi",
}


def print_section(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main():
    print("=" * 70)
    print("CROP-YIELD DATASET VALIDATION")
    print("=" * 70)

    print("\nInput dataset:")
    print(INPUT_FILE)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Crop-yield dataset not found:\n{INPUT_FILE}"
        )

    dataframe = pd.read_csv(INPUT_FILE)

    print(f"\nRows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    expected_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]

    print_section("COLUMN VALIDATION")

    missing_columns = [
        column
        for column in expected_columns
        if column not in dataframe.columns
    ]

    unexpected_columns = [
        column
        for column in dataframe.columns
        if column not in expected_columns
    ]

    if not missing_columns:
        print("Required columns: PASS")
    else:
        print(f"Missing columns: {missing_columns}")
        print("Required columns: WARNING")

    if unexpected_columns:
        print(f"Additional columns: {unexpected_columns}")
    else:
        print("Additional columns: NONE")

    print_section("DATA TYPE VALIDATION")

    numeric_columns = [
        "Year",
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]

    for column in numeric_columns:
        dataframe[column] = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

    print("Year numeric conversion: PASS")
    print("Area numeric conversion: PASS")
    print("Production numeric conversion: PASS")
    print("Yield numeric conversion: PASS")

    print_section("MISSING VALUE CHECK")

    missing_values = dataframe[expected_columns].isna().sum()

    print(missing_values.to_string())

    total_missing = int(missing_values.sum())

    print(f"\nTotal missing values: {total_missing}")

    if total_missing == 0:
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("YEAR VALIDATION")

    years = sorted(
        dataframe["Year"]
        .dropna()
        .astype(int)
        .unique()
        .tolist()
    )

    print(f"Years found: {years}")
    print(f"Expected:    {EXPECTED_YEARS}")

    missing_years = [
        year
        for year in EXPECTED_YEARS
        if year not in years
    ]

    unexpected_years = [
        year
        for year in years
        if year not in EXPECTED_YEARS
    ]

    if not missing_years and not unexpected_years:
        print("Status: PASS")
    else:
        print("Status: WARNING")

        if missing_years:
            print(f"Missing years: {missing_years}")

        if unexpected_years:
            print(f"Unexpected years: {unexpected_years}")

    print_section("DISTRICT VALIDATION")

    districts = sorted(
        dataframe["District"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
        .tolist()
    )

    print(f"Districts found: {len(districts)}")

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
            print(f"Missing districts: {missing_districts}")

        if unexpected_districts:
            print(f"Unexpected districts: {unexpected_districts}")

    print_section("CROP VALIDATION")

    crops = sorted(
        dataframe["Crop"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
        .tolist()
    )

    print(f"Crops found: {len(crops)}")

    for crop in crops:
        print(f"    - {crop}")

    missing_crops = [
        crop
        for crop in EXPECTED_CROPS
        if crop not in crops
    ]

    unexpected_crops = [
        crop
        for crop in crops
        if crop not in EXPECTED_CROPS
    ]

    if not missing_crops and not unexpected_crops:
        print("Status: PASS")
    else:
        print("Status: WARNING")

        if missing_crops:
            print(f"Missing crops: {missing_crops}")

        if unexpected_crops:
            print(f"Unexpected crops: {unexpected_crops}")

    print_section("SEASON VALIDATION")

    season_errors = []

    for crop, expected_season in EXPECTED_SEASONS.items():
        crop_rows = dataframe[dataframe["Crop"] == crop]

        actual_seasons = sorted(
            crop_rows["Season"]
            .dropna()
            .astype(str)
            .str.strip()
            .unique()
            .tolist()
        )

        print(
            f"{crop}: expected={expected_season}, "
            f"found={actual_seasons}"
        )

        if actual_seasons != [expected_season]:
            season_errors.append(crop)

    if not season_errors:
        print("Status: PASS")
    else:
        print(f"Status: WARNING — {season_errors}")

    print_section("ROWS AND COVERAGE")

    expected_rows = (
        len(EXPECTED_DISTRICTS)
        * len(EXPECTED_YEARS)
        * len(EXPECTED_CROPS)
    )

    print(f"Expected rows: {expected_rows}")
    print(f"Actual rows:   {len(dataframe)}")

    if len(dataframe) == expected_rows:
        print("Row count: PASS")
    else:
        print("Row count: WARNING")

    print_section("OBSERVATIONS PER CROP")

    crop_counts = (
        dataframe
        .groupby("Crop")
        .size()
        .sort_index()
    )

    print(crop_counts.to_string())

    expected_per_crop = (
        len(EXPECTED_DISTRICTS)
        * len(EXPECTED_YEARS)
    )

    print(f"\nExpected observations per crop: {expected_per_crop}")

    if (
        len(crop_counts) == len(EXPECTED_CROPS)
        and (crop_counts == expected_per_crop).all()
    ):
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("OBSERVATIONS PER DISTRICT")

    district_counts = (
        dataframe
        .groupby("District")
        .size()
        .sort_index()
    )

    print(district_counts.to_string())

    expected_per_district = (
        len(EXPECTED_YEARS)
        * len(EXPECTED_CROPS)
    )

    print(f"\nExpected observations per district: {expected_per_district}")

    if (
        len(district_counts) == len(EXPECTED_DISTRICTS)
        and (district_counts == expected_per_district).all()
    ):
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("OBSERVATIONS PER YEAR")

    year_counts = (
        dataframe
        .groupby("Year")
        .size()
        .sort_index()
    )

    print(year_counts.to_string())

    expected_per_year = (
        len(EXPECTED_DISTRICTS)
        * len(EXPECTED_CROPS)
    )

    print(f"\nExpected observations per year: {expected_per_year}")

    if (
        len(year_counts) == len(EXPECTED_YEARS)
        and (year_counts == expected_per_year).all()
    ):
        print("Status: PASS")
    else:
        print("Status: WARNING")

    print_section("DUPLICATE CHECK")

    duplicate_columns = [
        "District",
        "Year",
        "Crop",
    ]

    duplicates = dataframe[
        dataframe.duplicated(
            subset=duplicate_columns,
            keep=False,
        )
    ].sort_values(duplicate_columns)

    duplicate_count = len(duplicates)

    print(f"Duplicate observations: {duplicate_count}")

    if duplicate_count == 0:
        print("Status: PASS")
    else:
        print("Status: WARNING")
        print(duplicates.to_string(index=False))

    print_section("VALUE VALIDATION")

    negative_area = int(
        (dataframe["Area_Hectare"] < 0).sum()
    )

    negative_production = int(
        (dataframe["Production_Tonnes"] < 0).sum()
    )

    negative_yield = int(
        (dataframe["Yield_kg_ha"] < 0).sum()
    )

    print(f"Negative area values: {negative_area}")
    print(f"Negative production values: {negative_production}")
    print(f"Negative yield values: {negative_yield}")

    if (
        negative_area == 0
        and negative_production == 0
        and negative_yield == 0
    ):
        print("Negative value validation: PASS")
    else:
        print("Negative value validation: WARNING")

    print_section("ZERO VALUE ANALYSIS")

    zero_area = dataframe["Area_Hectare"].eq(0)
    zero_production = dataframe["Production_Tonnes"].eq(0)
    zero_yield = dataframe["Yield_kg_ha"].eq(0)

    print(f"Zero area observations: {int(zero_area.sum())}")
    print(
        f"Zero production observations: "
        f"{int(zero_production.sum())}"
    )
    print(f"Zero yield observations: {int(zero_yield.sum())}")

    zero_area_by_crop = (
        dataframe[zero_area]
        .groupby("Crop")
        .size()
        .sort_index()
    )

    print("\nZero area observations by crop:")

    if zero_area_by_crop.empty:
        print("None")
    else:
        print(zero_area_by_crop.to_string())

    print_section("YIELD STATISTICS")

    yield_statistics = dataframe["Yield_kg_ha"].describe()

    print(
        yield_statistics[
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
        ].round(2).to_string()
    )

    print_section("CROP-WISE YIELD STATISTICS")

    crop_yield_statistics = (
        dataframe
        .groupby("Crop")["Yield_kg_ha"]
        .agg(
            [
                "count",
                "mean",
                "std",
                "min",
                "median",
                "max",
            ]
        )
        .round(2)
    )

    print(crop_yield_statistics.to_string())

    print_section("DISTRICT-WISE YIELD STATISTICS")

    district_yield_statistics = (
        dataframe
        .groupby("District")["Yield_kg_ha"]
        .agg(
            [
                "count",
                "mean",
                "std",
                "min",
                "median",
                "max",
            ]
        )
        .sort_values(
            "mean",
            ascending=False,
        )
        .round(2)
    )

    print(district_yield_statistics.to_string())

    print_section("AREA-PRODUCTION-YIELD CONSISTENCY")

    dataframe["Calculated_Yield_kg_ha"] = (
        dataframe["Production_Tonnes"]
        * 1000
        / dataframe["Area_Hectare"].replace(0, pd.NA)
    )

    comparable = dataframe[
        (dataframe["Area_Hectare"] > 0)
        & dataframe["Calculated_Yield_kg_ha"].notna()
        & dataframe["Yield_kg_ha"].notna()
    ].copy()

    comparable["Yield_Difference_kg_ha"] = (
        comparable["Yield_kg_ha"]
        - comparable["Calculated_Yield_kg_ha"]
    ).abs()

    comparable["Yield_Difference_Percent"] = (
        comparable["Yield_Difference_kg_ha"]
        / comparable["Yield_kg_ha"].replace(0, pd.NA)
        * 100
    )

    consistency_errors = comparable[
        comparable["Yield_Difference_Percent"] > 10
    ].copy()

    print(
        f"Observations with positive area: "
        f"{len(comparable)}"
    )

    print(
        "Consistency threshold: >10% difference"
    )

    print(
        f"Yield differences >10%: "
        f"{len(consistency_errors)}"
    )

    if consistency_errors.empty:
        print("Area-production-yield consistency: PASS")
    else:
        print(
            "Area-production-yield consistency: "
            "SOURCE DATA WARNING"
        )

        print("\nLargest differences:")

        display_columns = [
            "District",
            "Year",
            "Crop",
            "Area_Hectare",
            "Production_Tonnes",
            "Yield_kg_ha",
            "Calculated_Yield_kg_ha",
            "Yield_Difference_kg_ha",
            "Yield_Difference_Percent",
        ]

        print(
            consistency_errors
            .sort_values(
                "Yield_Difference_Percent",
                ascending=False,
            )
            .head(10)[display_columns]
            .round(2)
            .to_string(index=False)
        )

        print(
            "\nThese differences originate from the "
            "source agricultural tables and are retained "
            "without modification."
        )

    print_section("DISTRICT-YEAR-CROP COVERAGE")

    coverage = (
        dataframe
        .groupby(
            [
                "District",
                "Year",
            ]
        )["Crop"]
        .nunique()
    )

    print(
        f"District-year combinations: "
        f"{len(coverage)}"
    )

    expected_combinations = (
        len(EXPECTED_DISTRICTS)
        * len(EXPECTED_YEARS)
    )

    print(
        f"Expected district-year combinations: "
        f"{expected_combinations}"
    )

    print(
        f"Minimum crops per district-year: "
        f"{coverage.min()}"
    )

    print(
        f"Maximum crops per district-year: "
        f"{coverage.max()}"
    )

    print(
        f"Average crops per district-year: "
        f"{coverage.mean():.2f}"
    )

    coverage_pass = (
        len(coverage) == expected_combinations
        and coverage.min() == len(EXPECTED_CROPS)
        and coverage.max() == len(EXPECTED_CROPS)
    )

    if coverage_pass:
        print("Coverage: PASS")
    else:
        print("Coverage: WARNING")

    print_section("FINAL VALIDATION")

    structural_checks = {
        "Required columns": not missing_columns,
        "No missing values": total_missing == 0,
        "Valid years": not missing_years and not unexpected_years,
        "Expected districts present": not missing_districts,
        "Expected crops present": not missing_crops,
        "Correct seasons": not season_errors,
        "Expected row count": len(dataframe) == expected_rows,
        "No duplicate observations": duplicate_count == 0,
        "No negative area": negative_area == 0,
        "No negative production": negative_production == 0,
        "No negative yield": negative_yield == 0,
        "Complete district-year-crop coverage": coverage_pass,
    }

    for check_name, passed in structural_checks.items():
        status = "PASS" if passed else "WARNING"
        print(f"{check_name}: {status}")

    all_structural_checks_passed = all(
        structural_checks.values()
    )

    summary = pd.DataFrame(
        {
            "metric": [
                "Rows",
                "Columns",
                "Districts",
                "Crops",
                "Years",
                "Zero_Area_Observations",
                "Zero_Production_Observations",
                "Zero_Yield_Observations",
                "Mean_Yield_kg_ha",
                "Median_Yield_kg_ha",
                "Minimum_Yield_kg_ha",
                "Maximum_Yield_kg_ha",
                "Duplicate_Observations",
                "Yield_Consistency_Errors",
            ],
            "value": [
                len(dataframe),
                len(expected_columns),
                dataframe["District"].nunique(),
                dataframe["Crop"].nunique(),
                dataframe["Year"].nunique(),
                int(zero_area.sum()),
                int(zero_production.sum()),
                int(zero_yield.sum()),
                dataframe["Yield_kg_ha"].mean(),
                dataframe["Yield_kg_ha"].median(),
                dataframe["Yield_kg_ha"].min(),
                dataframe["Yield_kg_ha"].max(),
                duplicate_count,
                len(consistency_errors),
            ],
        }
    )

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    summary.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("\nValidation summary saved:")
    print(OUTPUT_FILE)

    print("\n" + "=" * 70)

    if all_structural_checks_passed:
        print(
            "CROP-YIELD DATASET VALIDATION "
            "COMPLETED SUCCESSFULLY"
        )
        print(
            "Source arithmetic differences were "
            "reported separately."
        )
    else:
        print(
            "CROP-YIELD DATASET VALIDATION "
            "COMPLETED WITH WARNINGS"
        )

    print("=" * 70)


if __name__ == "__main__":
    main()
