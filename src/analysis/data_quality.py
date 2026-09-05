"""
Data quality and exploratory interpretation for agricultural
remote sensing temporal features.
"""

from pathlib import Path

import pandas as pd


DATA_PATH = Path("data/temporal_features.csv")
ANALYSIS_DIR = Path("data/analysis")
OUTPUT_PATH = ANALYSIS_DIR / "data_quality_report.txt"


REQUIRED_COLUMNS = [
    "District",
    "Year",
    "Season",
    "Start_Date",
    "End_Date",
    "Image_Count",
    "NDVI",
    "NDWI",
    "EVI",
]


INDEX_COLUMNS = [
    "NDVI",
    "NDWI",
    "EVI",
]


def load_data() -> pd.DataFrame:
    """Load the temporal feature dataset."""

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    return pd.read_csv(DATA_PATH)


def check_required_columns(
    df: pd.DataFrame,
) -> list[str]:
    """Check for missing required columns."""

    return [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]


def check_missing_values(
    df: pd.DataFrame,
) -> pd.Series:
    """Count missing values in each column."""

    return df.isnull().sum()


def check_duplicates(
    df: pd.DataFrame,
) -> int:
    """Count duplicate rows."""

    return int(df.duplicated().sum())


def check_unique_combinations(
    df: pd.DataFrame,
) -> int:
    """Count duplicate district-year-season combinations."""

    return int(
        df.duplicated(
            subset=[
                "District",
                "Year",
                "Season",
            ]
        ).sum()
    )


def calculate_statistics(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Calculate descriptive statistics for vegetation indices."""

    return df[INDEX_COLUMNS].describe()


def find_best_and_worst(
    df: pd.DataFrame,
) -> dict[str, dict[str, object]]:
    """Find highest and lowest observations for each index."""

    results = {}

    for index in INDEX_COLUMNS:
        max_row = df.loc[df[index].idxmax()]
        min_row = df.loc[df[index].idxmin()]

        results[index] = {
            "maximum": {
                "district": max_row["District"],
                "year": int(max_row["Year"]),
                "season": max_row["Season"],
                "value": float(max_row[index]),
            },
            "minimum": {
                "district": min_row["District"],
                "year": int(min_row["Year"]),
                "season": min_row["Season"],
                "value": float(min_row[index]),
            },
        }

    return results


def calculate_district_means(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Calculate average vegetation indices by district."""

    return (
        df.groupby("District")[INDEX_COLUMNS]
        .mean()
        .sort_values("NDVI", ascending=False)
    )


def calculate_season_means(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Calculate average vegetation indices by season."""

    return (
        df.groupby("Season")[INDEX_COLUMNS]
        .mean()
    )


def calculate_year_means(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Calculate average vegetation indices by year."""

    return (
        df.groupby("Year")[INDEX_COLUMNS]
        .mean()
        .sort_index()
    )


def calculate_correlations(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Calculate correlations between vegetation indices."""

    return df[INDEX_COLUMNS].corr()


def find_largest_changes(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Find largest year-to-year NDVI changes."""

    yearly = (
        df.groupby(
            ["District", "Year"]
        )["NDVI"]
        .mean()
        .reset_index()
    )

    yearly["NDVI_Change"] = (
        yearly.groupby("District")["NDVI"]
        .diff()
    )

    return yearly.dropna(
        subset=["NDVI_Change"]
    ).sort_values(
        "NDVI_Change",
        ascending=False,
    )


def generate_report(
    df: pd.DataFrame,
) -> str:
    """Generate a human-readable data quality report."""

    missing_columns = check_required_columns(df)
    missing_values = check_missing_values(df)
    duplicate_rows = check_duplicates(df)
    duplicate_combinations = check_unique_combinations(df)

    statistics = calculate_statistics(df)
    best_worst = find_best_and_worst(df)
    district_means = calculate_district_means(df)
    season_means = calculate_season_means(df)
    year_means = calculate_year_means(df)
    correlations = calculate_correlations(df)
    changes = find_largest_changes(df)

    lines = []

    lines.append("=" * 60)
    lines.append("AGRICULTURAL REMOTE SENSING DATA QUALITY REPORT")
    lines.append("=" * 60)

    lines.append("")
    lines.append("1. DATASET OVERVIEW")
    lines.append("-" * 40)

    lines.append(
        f"Rows: {len(df)}"
    )

    lines.append(
        f"Columns: {len(df.columns)}"
    )

    lines.append(
        f"Districts: {df['District'].nunique()}"
    )

    lines.append(
        f"Years: {df['Year'].min()} - {df['Year'].max()}"
    )

    lines.append(
        f"Seasons: {', '.join(df['Season'].unique())}"
    )

    lines.append("")
    lines.append("2. STRUCTURE CHECK")
    lines.append("-" * 40)

    if missing_columns:
        lines.append(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )
    else:
        lines.append(
            "All required columns are present."
        )

    lines.append(
        f"Duplicate rows: {duplicate_rows}"
    )

    lines.append(
        "Duplicate district-year-season combinations: "
        f"{duplicate_combinations}"
    )

    lines.append("")
    lines.append("3. MISSING VALUES")
    lines.append("-" * 40)

    for column, count in missing_values.items():
        lines.append(
            f"{column}: {count}"
        )

    lines.append("")
    lines.append("4. VEGETATION INDEX STATISTICS")
    lines.append("-" * 40)

    lines.append(
        statistics.round(4).to_string()
    )

    lines.append("")
    lines.append("5. HIGHEST AND LOWEST VALUES")
    lines.append("-" * 40)

    for index, values in best_worst.items():

        maximum = values["maximum"]
        minimum = values["minimum"]

        lines.append(
            f"{index}:"
        )

        lines.append(
            "  Highest: "
            f"{maximum['district']} "
            f"{maximum['year']} "
            f"{maximum['season']} = "
            f"{maximum['value']:.4f}"
        )

        lines.append(
            "  Lowest: "
            f"{minimum['district']} "
            f"{minimum['year']} "
            f"{minimum['season']} = "
            f"{minimum['value']:.4f}"
        )

    lines.append("")
    lines.append("6. DISTRICT AVERAGES")
    lines.append("-" * 40)

    lines.append(
        district_means.round(4).to_string()
    )

    lines.append("")
    lines.append("7. SEASONAL AVERAGES")
    lines.append("-" * 40)

    lines.append(
        season_means.round(4).to_string()
    )

    lines.append("")
    lines.append("8. YEARLY AVERAGES")
    lines.append("-" * 40)

    lines.append(
        year_means.round(4).to_string()
    )

    lines.append("")
    lines.append("9. INDEX CORRELATIONS")
    lines.append("-" * 40)

    lines.append(
        correlations.round(4).to_string()
    )

    lines.append("")
    lines.append("10. LARGEST POSITIVE NDVI CHANGES")
    lines.append("-" * 40)

    lines.append(
        changes.head(5).round(4).to_string(
            index=False
        )
    )

    lines.append("")
    lines.append("11. LARGEST NEGATIVE NDVI CHANGES")
    lines.append("-" * 40)

    lines.append(
        changes.tail(5).round(4).to_string(
            index=False
        )
    )

    lines.append("")
    lines.append("12. INITIAL ASSESSMENT")
    lines.append("-" * 40)

    if (
        duplicate_rows == 0
        and duplicate_combinations == 0
        and missing_values.sum() == 0
    ):
        lines.append(
            "The dataset passed the basic structural "
            "quality checks."
        )
    else:
        lines.append(
            "The dataset contains structural quality "
            "issues that should be reviewed."
        )

    lines.append("")

    if len(df) < 100:
        lines.append(
            "WARNING: The current dataset is relatively "
            "small for machine learning."
        )

        lines.append(
            "Consider increasing the number of districts, "
            "seasons, observations, or features before "
            "building a complex predictive model."
        )
    else:
        lines.append(
            "Dataset size is more suitable for "
            "machine-learning experimentation."
        )

    lines.append("")
    lines.append("=" * 60)

    return "\n".join(lines)


def save_report(report: str) -> None:
    """Save the quality report to disk."""

    ANALYSIS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    OUTPUT_PATH.write_text(
        report,
        encoding="utf-8",
    )


def main() -> None:
    """Run the complete data quality analysis."""

    print("Loading temporal dataset...")

    df = load_data()

    print("Running data quality checks...")

    report = generate_report(df)

    print()
    print(report)

    save_report(report)

    print()
    print(
        "Data quality report saved to:"
    )
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
