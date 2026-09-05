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
    / "crop_yield_ml_ready.csv"
)

REQUIRED_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Crop",
    "Area_Hectare",
    "Production_Tonnes",
    "Yield_kg_ha",
]


def print_section(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main():
    print("=" * 70)
    print("CROP-YIELD ML DATASET CLEANING")
    print("=" * 70)

    print("\nInput dataset:")
    print(INPUT_FILE)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Crop-yield dataset not found:\n{INPUT_FILE}"
        )

    dataframe = pd.read_csv(INPUT_FILE)

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    dataframe["District"] = (
        dataframe["District"]
        .astype(str)
        .str.strip()
    )

    dataframe["Season"] = (
        dataframe["Season"]
        .astype(str)
        .str.strip()
    )

    dataframe["Crop"] = (
        dataframe["Crop"]
        .astype(str)
        .str.strip()
    )

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

    original_rows = len(dataframe)

    print(f"\nRows loaded: {original_rows}")

    print_section("SOURCE DATA QUALITY CLASSIFICATION")

    dataframe["Data_Status"] = "Valid"

    no_cultivation = (
        (dataframe["Area_Hectare"] == 0)
        & (dataframe["Production_Tonnes"] == 0)
        & (dataframe["Yield_kg_ha"] == 0)
    )

    source_inconsistency = (
        (dataframe["Area_Hectare"] == 0)
        & (
            (dataframe["Production_Tonnes"] != 0)
            | (dataframe["Yield_kg_ha"] != 0)
        )
    )

    invalid_negative = (
        (dataframe["Area_Hectare"] < 0)
        | (dataframe["Production_Tonnes"] < 0)
        | (dataframe["Yield_kg_ha"] < 0)
    )

    dataframe.loc[
        no_cultivation,
        "Data_Status",
    ] = "No_Cultivation_Recorded"

    dataframe.loc[
        source_inconsistency,
        "Data_Status",
    ] = "Source_Inconsistency"

    dataframe.loc[
        invalid_negative,
        "Data_Status",
    ] = "Invalid_Negative_Value"

    print(
        "Valid observations:",
        int(
            (
                dataframe["Data_Status"]
                == "Valid"
            ).sum()
        ),
    )

    print(
        "No cultivation recorded:",
        int(
            (
                dataframe["Data_Status"]
                == "No_Cultivation_Recorded"
            ).sum()
        ),
    )

    print(
        "Source inconsistencies:",
        int(
            (
                dataframe["Data_Status"]
                == "Source_Inconsistency"
            ).sum()
        ),
    )

    print(
        "Invalid negative values:",
        int(
            (
                dataframe["Data_Status"]
                == "Invalid_Negative_Value"
            ).sum()
        ),
    )

    print_section("SOURCE INCONSISTENCY DETAILS")

    inconsistencies = dataframe[
        dataframe["Data_Status"]
        == "Source_Inconsistency"
    ].copy()

    if inconsistencies.empty:
        print("None")
    else:
        print(
            inconsistencies[
                [
                    "District",
                    "Year",
                    "Season",
                    "Crop",
                    "Area_Hectare",
                    "Production_Tonnes",
                    "Yield_kg_ha",
                ]
            ].to_string(index=False)
        )

    print_section("YIELD CALCULATION CHECK")

    dataframe["Calculated_Yield_kg_ha"] = pd.NA

    positive_area = dataframe["Area_Hectare"] > 0

    dataframe.loc[
        positive_area,
        "Calculated_Yield_kg_ha",
    ] = (
        dataframe.loc[
            positive_area,
            "Production_Tonnes",
        ]
        * 1000
        / dataframe.loc[
            positive_area,
            "Area_Hectare",
        ]
    )

    dataframe["Yield_Difference_Percent"] = pd.NA

    valid_comparison = (
        positive_area
        & dataframe["Calculated_Yield_kg_ha"].notna()
        & dataframe["Yield_kg_ha"].notna()
        & (dataframe["Yield_kg_ha"] != 0)
    )

    dataframe.loc[
        valid_comparison,
        "Yield_Difference_Percent",
    ] = (
        (
            dataframe.loc[
                valid_comparison,
                "Yield_kg_ha",
            ]
            - dataframe.loc[
                valid_comparison,
                "Calculated_Yield_kg_ha",
            ]
        ).abs()
        / dataframe.loc[
            valid_comparison,
            "Yield_kg_ha",
        ]
        * 100
    )

    arithmetic_warning = (
        valid_comparison
        & (
            dataframe["Yield_Difference_Percent"]
            > 10
        )
    )

    dataframe.loc[
        arithmetic_warning
        & (dataframe["Data_Status"] == "Valid"),
        "Data_Status",
    ] = "Yield_Arithmetic_Warning"

    print(
        "Positive-area observations:",
        int(positive_area.sum()),
    )

    print(
        "Yield arithmetic warnings:",
        int(arithmetic_warning.sum()),
    )

    print_section("ML ELIGIBILITY")

    dataframe["ML_Eligible"] = False

    ml_eligible = (
        (
            dataframe["Data_Status"]
            == "Valid"
        )
        | (
            dataframe["Data_Status"]
            == "Yield_Arithmetic_Warning"
        )
    ) & (
        dataframe["Area_Hectare"] > 0
    ) & (
        dataframe["Production_Tonnes"] > 0
    ) & (
        dataframe["Yield_kg_ha"] > 0
    )

    dataframe.loc[
        ml_eligible,
        "ML_Eligible",
    ] = True

    eligible_count = int(
        dataframe["ML_Eligible"].sum()
    )

    excluded_count = (
        original_rows
        - eligible_count
    )

    print(
        f"ML-eligible observations: "
        f"{eligible_count}"
    )

    print(
        f"Excluded observations: "
        f"{excluded_count}"
    )

    print_section("ML EXCLUSION REASONS")

    exclusion_summary = (
        dataframe.loc[
            ~dataframe["ML_Eligible"],
            "Data_Status",
        ]
        .value_counts()
        .sort_index()
    )

    if exclusion_summary.empty:
        print("None")
    else:
        print(
            exclusion_summary.to_string()
        )

    print_section("ML DATASET")

    ml_dataframe = dataframe[
        dataframe["ML_Eligible"]
    ].copy()

    ml_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
        "Data_Status",
        "ML_Eligible",
    ]

    ml_dataframe = ml_dataframe[
        ml_columns
    ]

    print(
        f"ML rows: {len(ml_dataframe)}"
    )

    print(
        f"ML columns: "
        f"{len(ml_dataframe.columns)}"
    )

    print("\nRows by crop:")

    print(
        ml_dataframe
        .groupby("Crop")
        .size()
        .sort_index()
        .to_string()
    )

    print("\nRows by year:")

    print(
        ml_dataframe
        .groupby("Year")
        .size()
        .sort_index()
        .to_string()
    )

    print("\nRows by district:")

    print(
        ml_dataframe
        .groupby("District")
        .size()
        .sort_index()
        .to_string()
    )

    print_section(
        "YIELD STATISTICS FOR ML DATASET"
    )

    if not ml_dataframe.empty:
        statistics = (
            ml_dataframe[
                "Yield_kg_ha"
            ]
            .describe()
            .round(2)
        )

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
            ].to_string()
        )
    else:
        print(
            "No ML-eligible observations found."
        )

    print_section("FINAL OUTPUT")

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    ml_dataframe.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("Output:")
    print(OUTPUT_FILE)

    print(
        f"\nOriginal rows: "
        f"{original_rows}"
    )

    print(
        f"ML-ready rows: "
        f"{len(ml_dataframe)}"
    )

    print(
        f"Excluded rows: "
        f"{excluded_count}"
    )

    print("\n" + "=" * 70)
    print(
        "CROP-YIELD ML DATASET "
        "CLEANING COMPLETED"
    )
    print("=" * 70)


if __name__ == "__main__":
    main()
