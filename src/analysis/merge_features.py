from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

TEMPORAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "temporal_features.csv"
)

ENVIRONMENTAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "environmental"
    / "environmental_features.csv"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "combined_features.csv"
)


def main() -> None:

    print("=" * 60)
    print("COMBINING SATELLITE AND ENVIRONMENTAL FEATURES")
    print("=" * 60)

    print()
    print("Loading temporal dataset...")

    temporal = pd.read_csv(
        TEMPORAL_FILE,
    )

    print(
        f"Temporal rows: {len(temporal)}"
    )

    print()
    print("Loading environmental dataset...")

    environmental = pd.read_csv(
        ENVIRONMENTAL_FILE,
    )

    print(
        f"Environmental rows: {len(environmental)}"
    )

    merge_columns = [
        "District",
        "Year",
        "Season",
    ]

    combined = temporal.merge(
        environmental,
        on=merge_columns,
        how="inner",
        suffixes=(
            "",
            "_Environmental",
        ),
    )

    combined = combined.drop(
        columns=[
            "Start_Date_Environmental",
            "End_Date_Environmental",
        ],
        errors="ignore",
    )

    combined.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("=" * 60)
    print("COMBINATION COMPLETED")
    print("=" * 60)

    print(
        f"Combined rows: {len(combined)}"
    )

    print(
        f"Combined columns: {len(combined.columns)}"
    )

    print()
    print("Columns:")

    for column in combined.columns:
        print(f"  {column}")

    print()
    print(
        f"Saved to: {OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()
