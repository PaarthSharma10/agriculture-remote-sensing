import pandas as pd

from src.config import START_YEAR, END_YEAR


INPUT_PATH = (
    "data/temporal/temporal_features.csv"
)


def main():
    print("=" * 60)
    print("TEMPORAL DATA MISSING-VALUE INSPECTION")
    print("=" * 60)

    print()
    print("Loading temporal dataset...")

    dataframe = pd.read_csv(INPUT_PATH)

    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    index_columns = [
        "NDVI",
        "NDWI",
        "EVI",
    ]

    missing_mask = dataframe[index_columns].isna().any(axis=1)

    missing_rows = dataframe.loc[
        missing_mask
    ].copy()

    print()
    print("=" * 60)
    print("MISSING VEGETATION-INDEX OBSERVATIONS")
    print("=" * 60)

    print()
    print(f"Missing rows: {len(missing_rows)}")
    print(f"Expected years: {START_YEAR}-{END_YEAR}")

    if missing_rows.empty:
        print()
        print("No missing vegetation-index observations found.")
        return

    print()
    print("Missing observations:")

    print(
        missing_rows[
            [
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
        ].to_string(index=False)
    )

    print()
    print("=" * 60)
    print("MISSING OBSERVATIONS BY DISTRICT")
    print("=" * 60)

    district_summary = (
        missing_rows
        .groupby("District")
        .size()
        .sort_values(ascending=False)
    )

    print(district_summary.to_string())

    print()
    print("=" * 60)
    print("MISSING OBSERVATIONS BY YEAR")
    print("=" * 60)

    year_summary = (
        missing_rows
        .groupby("Year")
        .size()
        .sort_index()
    )

    print(year_summary.to_string())

    print()
    print("=" * 60)
    print("MISSING OBSERVATIONS BY SEASON")
    print("=" * 60)

    season_summary = (
        missing_rows
        .groupby("Season")
        .size()
        .sort_values(ascending=False)
    )

    print(season_summary.to_string())

    print()
    print("=" * 60)
    print("IMAGE COUNT FOR MISSING OBSERVATIONS")
    print("=" * 60)

    print(
        missing_rows[
            [
                "District",
                "Year",
                "Season",
                "Image_Count",
            ]
        ].to_string(index=False)
    )

    print()
    print("=" * 60)
    print("MISSING DATA INSPECTION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()
