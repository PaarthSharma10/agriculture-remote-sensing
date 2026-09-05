from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_DIR = PROJECT_ROOT / "data" / "crops" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "data" / "crops" / "processed"

OUTPUT_FILE = OUTPUT_DIR / "crop_yield_2020_2022.csv"

DISTRICTS = [
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

DISTRICT_MAP = {
    "Bhatinda": "Bathinda",
    "Bathinda": "Bathinda",
    "Ferozpur": "Firozpur",
    "Ferozepur": "Firozpur",
    "Ferozepur District": "Firozpur",
    "Muktsar": "Muktsar",
    "Muktsar Sahib": "Muktsar",
    "Sri Muktsar Sahib": "Muktsar",
    "S.A.S. Nagar": "Sahibzada Ajit Singh Nagar",
    "SAS Nagar": "Sahibzada Ajit Singh Nagar",
    "Sahibzada Ajit Singh Nagar": "Sahibzada Ajit Singh Nagar",
    "Mohali": "Sahibzada Ajit Singh Nagar",
    "Ropar": "Rupnagar",
    "Rupngar": "Rupnagar",
    "Nawanshahr": "Shahid Bhagat Singh Nagar",
    "SBS Nagar": "Shahid Bhagat Singh Nagar",
    "Shaheed Bhagat Singh Nagar": "Shahid Bhagat Singh Nagar",
    "Shahid Bhagat Singh Nagar": "Shahid Bhagat Singh Nagar",
}

CROP_SEASONS = {
    "Bajra": "Kharif",
    "Rice": "Kharif",
    "Wheat": "Rabi",
    "Barley": "Rabi",
    "Potato": "Rabi",
}

YEARS = [2020, 2021, 2022]

CROP_FILES = {
    "Bajra": {
        "Area_Hectare": "Table_4.7_Area_Bajra.csv",
        "Production_Tonnes": "Table_4.7_Production_Bajra.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Bajra.csv",
    },
    "Barley": {
        "Area_Hectare": "Table_4.7_Area_Barley.csv",
        "Production_Tonnes": "Table_4.7_Production_Barley.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Barley_0.csv",
    },
    "Rice": {
        "Area_Hectare": "Table_4.7_Area_Rice.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Rice.csv",
    },
    "Wheat": {
        "Area_Hectare": "Table_4.7_Area_Wheat.csv",
        "Production_Tonnes": "Table_4.7_Production_Wheat.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Wheat.csv",
    },
    "Potato": {
        "Area_Hectare": "Table_4.7_Area_Potato.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Potato.csv",
    },
}


def normalize_district(value):
    value = str(value).strip()
    return DISTRICT_MAP.get(value, value)


def empty_table(variable):
    return pd.DataFrame(
        {
            "District": pd.Series(dtype="string"),
            "Year": pd.Series(dtype="int64"),
            variable: pd.Series(dtype="Float64"),
        }
    )


def correct_known_source_errors(df):
    if df.empty:
        return df

    mask = (
        (df["District"] == "Barnala")
        & (df["Year"] == 2020)
        & (df["Crop"] == "Potato")
        & (df["Yield_kg_ha"] == 248576)
    )

    df.loc[mask, "Yield_kg_ha"] = 24857.6

    production_mask = (
        mask
        & df["Area_Hectare"].notna()
    )

    df.loc[production_mask, "Production_Tonnes"] = (
        df.loc[production_mask, "Area_Hectare"]
        * df.loc[production_mask, "Yield_kg_ha"]
        / 1000.0
    )

    return df


def load_table(filename, variable):
    path = RAW_DIR / filename

    if not path.exists():
        print(f"WARNING: File not found: {filename}")
        return empty_table(variable)

    try:
        df = pd.read_csv(path, encoding="utf-8-sig")
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(path, encoding="latin1")
        except (OSError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
            print(f"WARNING: Could not read {filename}: {exc}")
            return empty_table(variable)
    except (OSError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        print(f"WARNING: Could not read {filename}: {exc}")
        return empty_table(variable)

    df.columns = [str(column).strip() for column in df.columns]

    district_column = None

    for column in df.columns:
        normalized = column.strip().lower()

        if normalized == "district/year":
            district_column = column
            break

        if normalized == "district":
            district_column = column
            break

    if district_column is None:
        print(f"WARNING: No district column found in {filename}")
        return empty_table(variable)

    df = df.rename(columns={district_column: "District"})

    available_years = []

    for year in YEARS:
        year_string = str(year)

        if year_string in df.columns:
            available_years.append(year_string)

    if not available_years:
        print(f"WARNING: No 2020-2022 data found: {filename}")
        return empty_table(variable)

    data = df[["District"] + available_years].copy()

    data["District"] = data["District"].apply(normalize_district)

    data = data[data["District"].isin(DISTRICTS)].copy()

    data = data.melt(
        id_vars=["District"],
        value_vars=available_years,
        var_name="Year",
        value_name=variable,
    )

    data["Year"] = pd.to_numeric(
        data["Year"],
        errors="coerce",
    )

    data[variable] = pd.to_numeric(
        data[variable],
        errors="coerce",
    )

    data = data.dropna(
        subset=["District", "Year"]
    ).copy()

    data["Year"] = data["Year"].astype(int)

    data = data[data["Year"].isin(YEARS)].copy()

    data[variable] = data[variable].astype("Float64")

    data = data.drop_duplicates(
        subset=["District", "Year"],
        keep="first",
    )

    return data[["District", "Year", variable]].reset_index(drop=True)


def build_crop_dataset(crop, files):
    tables = []

    for variable, filename in files.items():
        table = load_table(
            filename,
            variable,
        )

        if not table.empty:
            tables.append(table)

    if not tables:
        print(f"WARNING: No usable data found for {crop}")
        return pd.DataFrame()

    base = tables[0].copy()

    for table in tables[1:]:
        base = base.merge(
            table,
            on=["District", "Year"],
            how="outer",
        )

    base["Crop"] = crop
    base["Season"] = CROP_SEASONS[crop]

    for column in [
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]:
        if column not in base.columns:
            base[column] = pd.Series(
                pd.NA,
                index=base.index,
                dtype="Float64",
            )

    for column in [
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]:
        base[column] = pd.to_numeric(
            base[column],
            errors="coerce",
        ).astype("Float64")

    return base


def calculate_missing_values(df):
    if df.empty:
        return df

    for column in [
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]:
        if column not in df.columns:
            df[column] = pd.Series(
                pd.NA,
                index=df.index,
                dtype="Float64",
            )

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        ).astype("Float64")

    area = df["Area_Hectare"]
    production = df["Production_Tonnes"]
    yield_value = df["Yield_kg_ha"]

    production_calculated = (
        area * yield_value / 1000.0
    )

    production_mask = (
        production.isna()
        & area.notna()
        & yield_value.notna()
        & (area > 0)
        & (yield_value > 0)
    )

    df.loc[
        production_mask,
        "Production_Tonnes",
    ] = production_calculated[production_mask]

    area = df["Area_Hectare"]
    production = df["Production_Tonnes"]
    yield_value = df["Yield_kg_ha"]

    yield_calculated = (
        production * 1000.0 / area
    )

    yield_mask = (
        yield_value.isna()
        & area.notna()
        & production.notna()
        & (area > 0)
        & (production > 0)
    )

    df.loc[
        yield_mask,
        "Yield_kg_ha",
    ] = yield_calculated[yield_mask]

    return df


def clean_values(df):
    if df.empty:
        return df

    numeric_columns = [
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        ).astype("Float64")

        df.loc[
            df[column] < 0,
            column,
        ] = pd.NA

    return df


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    crop_frames = []

    for crop, files in CROP_FILES.items():
        print()
        print(f"Processing {crop}...")

        crop_data = build_crop_dataset(
            crop,
            files,
        )

        if crop_data.empty:
            print(f"No usable data found for {crop}")
            continue

        crop_data = calculate_missing_values(
            crop_data
        )

        crop_data = clean_values(
            crop_data
        )

        crop_data = correct_known_source_errors(
            crop_data
        )

        crop_data = crop_data[
            crop_data["District"].isin(DISTRICTS)
        ].copy()

        crop_data = crop_data[
            crop_data["Year"].isin(YEARS)
        ].copy()

        print(
            f"Rows generated: {len(crop_data)}"
        )

        crop_frames.append(crop_data)

    if not crop_frames:
        print("No crop data was generated.")
        return

    final_df = pd.concat(
        crop_frames,
        ignore_index=True,
    )

    final_df = final_df[
        [
            "District",
            "Year",
            "Season",
            "Crop",
            "Area_Hectare",
            "Production_Tonnes",
            "Yield_kg_ha",
        ]
    ].copy()

    final_df = final_df.sort_values(
        ["Crop", "District", "Year"]
    ).reset_index(drop=True)

    final_df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("=" * 70)
    print("CROP YIELD DATASET CREATED")
    print("=" * 70)
    print(f"Rows: {len(final_df)}")
    print(f"Columns: {final_df.columns.tolist()}")
    print(f"Output: {OUTPUT_FILE}")

    print()
    print("Years:")
    print(sorted(final_df["Year"].unique()))

    print()
    print("Districts:")
    print(sorted(final_df["District"].unique()))

    print()
    print("Crops:")
    print(sorted(final_df["Crop"].unique()))

    print()
    print("Rows by crop:")
    print(final_df.groupby("Crop").size())

    print()
    print("Rows by year:")
    print(final_df.groupby("Year").size())

    print()
    print("Rows by district:")
    print(final_df.groupby("District").size())

    print()
    print("Missing values:")
    print(final_df.isna().sum())

    print()
    print("Zero values:")
    print(
        final_df[
            [
                "Area_Hectare",
                "Production_Tonnes",
                "Yield_kg_ha",
            ]
        ].eq(0).sum()
    )

    print()
    print("=" * 70)
    print("PROCESSING COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
