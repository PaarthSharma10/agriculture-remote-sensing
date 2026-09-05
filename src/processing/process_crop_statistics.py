from pathlib import Path
import re

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data" / "crops" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "data" / "crops" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "crop_yield_2020_2022.csv"

YEARS = [2020, 2021, 2022]

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
    "Muktsar": "Muktsar",
    "Muktsar Sahib": "Muktsar",
    "Sri Muktsar Sahib": "Muktsar",
    "S.A.S. Nagar": "Sahibzada Ajit Singh Nagar",
    "SAS Nagar": "Sahibzada Ajit Singh Nagar",
    "Mohali": "Sahibzada Ajit Singh Nagar",
    "Ropar": "Rupnagar",
    "Nawanshahr": "Shahid Bhagat Singh Nagar",
    "Shaheed Bhagat Singh Nagar": "Shahid Bhagat Singh Nagar",
    "Shahid Bhagat Singh Nagar": "Shahid Bhagat Singh Nagar",
}

CROP_SEASONS = {
    "Bajra": "Kharif",
    "Barley": "Rabi",
    "Rice": "Kharif",
    "Wheat": "Rabi",
    "Potato": "Rabi",
}

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
        "Production_Tonnes": "Table_4.7_Production_Rice.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Rice.csv",
    },
    "Wheat": {
        "Area_Hectare": "Table_4.7_Area_Wheat.csv",
        "Production_Tonnes": "Table_4.7_Production_Wheat.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Wheat.csv",
    },
    "Potato": {
        "Area_Hectare": "Table_4.7_Area_Potato.csv",
        "Production_Tonnes": "Table_4.7_Production_Potato.csv",
        "Yield_kg_ha": "Table_4.7_Yield_Potato.csv",
    },
}


def normalize_district(value):
    value = str(value).strip()
    value = re.sub(r"\s+", " ", value)

    for old_name, new_name in DISTRICT_MAP.items():
        if value.lower() == old_name.lower():
            return new_name

    return value


def clean_number(series):
    series = series.astype("string")

    series = (
        series
        .str.replace(",", "", regex=False)
        .str.replace("—", "", regex=False)
        .str.replace("–", "", regex=False)
        .str.replace("-", "", regex=False)
        .str.strip()
    )

    series = series.replace(
        {
            "": pd.NA,
            "NA": pd.NA,
            "N/A": pd.NA,
            "na": pd.NA,
            "null": pd.NA,
            "None": pd.NA,
            "nan": pd.NA,
        }
    )

    return pd.to_numeric(
        series,
        errors="coerce",
    )


def extract_year(value):
    if pd.isna(value):
        return pd.NA

    matches = re.findall(
        r"20\d{2}",
        str(value),
    )

    for match in matches:
        year = int(match)

        if year in YEARS:
            return year

    return pd.NA


def find_district_column(df):
    candidates = [
        "District/Year",
        "District / Year",
        "District",
        "district",
        "District Name",
        "District_Name",
    ]

    for column in candidates:
        if column in df.columns:
            return column

    for column in df.columns:
        if "district" in str(column).lower():
            return column

    return None


def find_year_column(df):
    candidates = [
        "Year",
        "year",
        "YEAR",
        "Agricultural Year",
        "Agricultural_Year",
        "Agriculture Year",
        "Agriculture_Year",
    ]

    for column in candidates:
        if column in df.columns:
            return column

    for column in df.columns:
        if "year" in str(column).lower():
            return column

    return None


def find_year_columns(df):
    year_columns = {}

    for column in df.columns:
        text = str(column)

        for year in YEARS:
            if re.search(
                rf"\b{year}\b",
                text,
            ):
                year_columns[year] = column
                break

    return year_columns


def empty_table(variable):
    return pd.DataFrame(
        {
            "District": pd.Series(
                dtype="string"
            ),
            "Year": pd.Series(
                dtype="Int64"
            ),
            variable: pd.Series(
                dtype="Float64"
            ),
        }
    )


def load_table(filename, variable):
    path = RAW_DIR / filename

    if not path.exists():
        print(
            f"WARNING: File not found: {filename}"
        )
        return empty_table(variable)

    try:
        df = pd.read_csv(
            path,
            encoding="utf-8-sig",
        )
    except UnicodeDecodeError:
        df = pd.read_csv(
            path,
            encoding="latin1",
        )

    if df.empty:
        print(
            f"WARNING: Empty file: {filename}"
        )
        return empty_table(variable)

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    district_column = find_district_column(df)

    if district_column is None:
        print(
            f"WARNING: District column not found: {filename}"
        )
        print(
            f"Columns found: {list(df.columns)}"
        )
        return empty_table(variable)

    year_columns = find_year_columns(df)

    if year_columns:
        selected_columns = [
            district_column
        ]

        selected_columns.extend(
            year_columns.values()
        )

        data = df[
            selected_columns
        ].copy()

        data = data.rename(
            columns={
                district_column: "District"
            }
        )

        rename_years = {}

        for year, column in year_columns.items():
            rename_years[column] = year

        data = data.rename(
            columns=rename_years
        )

        data["District"] = data[
            "District"
        ].apply(
            normalize_district
        )

        data = data[
            data["District"].isin(
                DISTRICTS
            )
        ].copy()

        if data.empty:
            return empty_table(variable)

        data = data.melt(
            id_vars=["District"],
            var_name="Year",
            value_name=variable,
        )

        data["Year"] = pd.to_numeric(
            data["Year"],
            errors="coerce",
        )

        data[variable] = clean_number(
            data[variable]
        )

        data = data[
            data["Year"].isin(
                YEARS
            )
        ].copy()

        data["Year"] = data[
            "Year"
        ].astype("Int64")

        data[variable] = data[
            variable
        ].astype("Float64")

        data = data.drop_duplicates(
            subset=[
                "District",
                "Year",
            ],
            keep="first",
        )

        return data

    year_column = find_year_column(df)

    if year_column is None:
        print(
            f"WARNING: No 2020-2022 data found: {filename}"
        )
        print(
            f"Columns found: {list(df.columns)}"
        )
        return empty_table(variable)

    value_columns = [
        column
        for column in df.columns
        if column not in {
            district_column,
            year_column,
        }
    ]

    if not value_columns:
        print(
            f"WARNING: No value column found: {filename}"
        )
        return empty_table(variable)

    value_column = None

    preferred_columns = [
        variable,
        "Value",
        "value",
        "Production",
        "Area",
        "Yield",
        "Quantity",
        "Qty",
    ]

    for candidate in preferred_columns:
        if candidate in value_columns:
            value_column = candidate
            break

    if value_column is None:
        scores = {}

        for column in value_columns:
            scores[column] = (
                clean_number(
                    df[column]
                ).notna().sum()
            )

        value_column = max(
            scores,
            key=scores.get,
        )

    data = df[
        [
            district_column,
            year_column,
            value_column,
        ]
    ].copy()

    data = data.rename(
        columns={
            district_column: "District",
            year_column: "Year",
            value_column: variable,
        }
    )

    data["District"] = data[
        "District"
    ].apply(
        normalize_district
    )

    data["Year"] = data[
        "Year"
    ].apply(
        extract_year
    )

    data[variable] = clean_number(
        data[variable]
    )

    data = data[
        data["District"].isin(
            DISTRICTS
        )
    ].copy()

    data = data[
        data["Year"].isin(
            YEARS
        )
    ].copy()

    data["Year"] = data[
        "Year"
    ].astype("Int64")

    data[variable] = data[
        variable
    ].astype("Float64")

    data = data.drop_duplicates(
        subset=[
            "District",
            "Year",
        ],
        keep="first",
    )

    return data


def build_crop_dataset(crop, files):
    base = pd.DataFrame(
        {
            "District": DISTRICTS
        }
    )

    base["key"] = 1

    years = pd.DataFrame(
        {
            "Year": YEARS,
            "key": 1,
        }
    )

    base = base.merge(
        years,
        on="key",
    )

    base = base.drop(
        columns=["key"]
    )

    for variable, filename in files.items():
        table = load_table(
            filename,
            variable,
        )

        if table.empty:
            continue

        base = base.merge(
            table,
            on=[
                "District",
                "Year",
            ],
            how="left",
        )

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
        else:
            base[column] = clean_number(
                base[column]
            ).astype("Float64")

    base["Crop"] = crop

    base["Season"] = CROP_SEASONS[
        crop
    ]

    return base


def calculate_missing_values(df):
    if df.empty:
        return df

    area = clean_number(
        df["Area_Hectare"]
    )

    production = clean_number(
        df["Production_Tonnes"]
    )

    yield_value = clean_number(
        df["Yield_kg_ha"]
    )

    calculated_production = (
        area
        * yield_value
        / 1000.0
    )

    production_mask = (
        production.isna()
        & area.notna()
        & yield_value.notna()
        & (area > 0)
        & (yield_value > 0)
    )

    production = production.copy()

    if production_mask.any():
        production.loc[
            production_mask
        ] = calculated_production.loc[
            production_mask
        ]

    calculated_yield = (
        production
        * 1000.0
        / area
    )

    yield_mask = (
        yield_value.isna()
        & area.notna()
        & production.notna()
        & (area > 0)
        & (production >= 0)
    )

    yield_value = yield_value.copy()

    if yield_mask.any():
        yield_value.loc[
            yield_mask
        ] = calculated_yield.loc[
            yield_mask
        ]

    df["Area_Hectare"] = (
        area.astype("Float64")
    )

    df["Production_Tonnes"] = (
        production.astype("Float64")
    )

    df["Yield_kg_ha"] = (
        yield_value.astype("Float64")
    )

    return df


def clean_data(df):
    numeric_columns = [
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]

    for column in numeric_columns:
        df[column] = clean_number(
            df[column]
        ).astype("Float64")

        invalid = (
            df[column].notna()
            & (df[column] < 0)
        )

        if invalid.any():
            df.loc[
                invalid,
                column,
            ] = pd.NA

    return df


def print_summary(combined):
    print()
    print("=" * 70)
    print("CROP YIELD DATASET CREATED")
    print("=" * 70)

    print(
        f"Rows: {len(combined)}"
    )

    print(
        f"Columns: {list(combined.columns)}"
    )

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print()
    print("Years:")

    print(
        sorted(
            combined["Year"]
            .dropna()
            .unique()
            .tolist()
        )
    )

    print()
    print("Districts:")

    print(
        sorted(
            combined["District"]
            .dropna()
            .unique()
            .tolist()
        )
    )

    print()
    print("Crops:")

    print(
        sorted(
            combined["Crop"]
            .dropna()
            .unique()
            .tolist()
        )
    )

    print()
    print("Rows by crop:")

    print(
        combined.groupby(
            "Crop"
        ).size()
    )

    print()
    print("Rows by year:")

    print(
        combined.groupby(
            "Year"
        ).size()
    )

    print()
    print("Missing values:")

    print(
        combined.isna().sum()
    )

    print()
    print("Missing yield records:")

    missing_yield = combined[
        combined["Yield_kg_ha"].isna()
    ]

    if missing_yield.empty:
        print("None")
    else:
        print(
            missing_yield[
                [
                    "District",
                    "Year",
                    "Crop",
                    "Area_Hectare",
                    "Production_Tonnes",
                ]
            ].to_string(
                index=False
            )
        )

    print()
    print("Missing production records:")

    missing_production = combined[
        combined["Production_Tonnes"].isna()
    ]

    if missing_production.empty:
        print("None")
    else:
        print(
            missing_production[
                [
                    "District",
                    "Year",
                    "Crop",
                    "Area_Hectare",
                    "Yield_kg_ha",
                ]
            ].to_string(
                index=False
            )
        )

    print()
    print("=" * 70)
    print("PROCESSING COMPLETE")
    print("=" * 70)


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    crop_frames = []

    for crop, files in CROP_FILES.items():
        print()
        print(
            f"Processing {crop}..."
        )

        crop_data = build_crop_dataset(
            crop,
            files,
        )

        crop_data = calculate_missing_values(
            crop_data
        )

        crop_data = clean_data(
            crop_data
        )

        print(
            f"Rows generated: {len(crop_data)}"
        )

        crop_frames.append(
            crop_data
        )

    if not crop_frames:
        raise RuntimeError(
            "No crop data could be processed."
        )

    combined = pd.concat(
        crop_frames,
        ignore_index=True,
    )

    columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Area_Hectare",
        "Production_Tonnes",
        "Yield_kg_ha",
    ]

    combined = combined[
        columns
    ].copy()

    combined = combined[
        combined["District"].isin(
            DISTRICTS
        )
    ].copy()

    combined = combined[
        combined["Year"].isin(
            YEARS
        )
    ].copy()

    combined = combined.drop_duplicates(
        subset=[
            "District",
            "Year",
            "Crop",
        ],
        keep="first",
    )

    combined = combined.sort_values(
        [
            "District",
            "Year",
            "Season",
            "Crop",
        ]
    ).reset_index(
        drop=True
    )

    combined.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print_summary(
        combined
    )


if __name__ == "__main__":
    main()
