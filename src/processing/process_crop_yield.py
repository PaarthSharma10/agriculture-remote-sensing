import pandas as pd
from pathlib import Path
```python


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_DIRECTORY = (
    PROJECT_ROOT
    / "data"
    / "crop_yield"
    / "raw"
)

OUTPUT_DIRECTORY = (
    PROJECT_ROOT
    / "data"
    / "crop_yield"
)

OUTPUT_FILE = (
    OUTPUT_DIRECTORY
    / "crop_yield_punjab.csv"
)

SUPPORTED_CROPS = {
    "rice": "Rice",
    "paddy": "Rice",
    "wheat": "Wheat",
    "maize": "Maize",
    "corn": "Maize",
    "bajra": "Bajra",
    "pearl millet": "Bajra",
    "barley": "Barley",
    "gram": "Gram",
    "chickpea": "Gram",
    "potato": "Potato",
    "mustard": "Mustard",
    "rapeseed and mustard": "Mustard",
    "rapeseed & mustard": "Mustard",
    "sugarcane": "Sugarcane",
    "cotton": "Cotton",
}

DISTRICT_ALIASES = {
    "fatehgarh sahib": "Fatehgarh Sahib",
    "sri muktsar sahib": "Sri Muktsar Sahib",
    "muktsar": "Sri Muktsar Sahib",
    "shaheed bhagat singh nagar": "Shaheed Bhagat Singh Nagar",
    "nawanshahr": "Shaheed Bhagat Singh Nagar",
    "s.a.s. nagar": "SAS Nagar",
    "mohali": "SAS Nagar",
    "rupnagar": "Rupnagar",
    "roopnagar": "Rupnagar",
    "tarntaran": "Tarn Taran",
    "tarn taran": "Tarn Taran",
    "ferozepur": "Firozpur",
    "ferozpur": "Firozpur",
}

SEASON_ALIASES = {
    "kharif": "Kharif",
    "kharif season": "Kharif",
    "rabi": "Rabi",
    "rabi season": "Rabi",
    "zaid": "Zaid",
    "summer": "Zaid",
}


def normalize_text(value):
    if pd.isna(value):
        return ""

    return (
        str(value)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


def normalize_crop(value):
    normalized = normalize_text(value)

    if normalized in SUPPORTED_CROPS:
        return SUPPORTED_CROPS[normalized]

    for key, crop in SUPPORTED_CROPS.items():
        if key in normalized:
            return crop

    return None


def normalize_district(value):
    normalized = normalize_text(value)

    if normalized in DISTRICT_ALIASES:
        return DISTRICT_ALIASES[normalized]

    return str(value).strip() if not pd.isna(value) else None


def normalize_season(value):
    normalized = normalize_text(value)

    if normalized in SEASON_ALIASES:
        return SEASON_ALIASES[normalized]

    return None


def find_column(columns, candidates):
    normalized_columns = {
        normalize_text(column): column
        for column in columns
    }

    for candidate in candidates:
        candidate_normalized = normalize_text(candidate)

        if candidate_normalized in normalized_columns:
            return normalized_columns[candidate_normalized]

    for column in columns:
        normalized_column = normalize_text(column)

        for candidate in candidates:
            if normalize_text(candidate) in normalized_column:
                return column

    return None


def find_raw_file():
    if not RAW_DIRECTORY.exists():
        raise FileNotFoundError(
            f"Raw crop-yield directory not found:\n{RAW_DIRECTORY}"
        )

    files = sorted(
        list(RAW_DIRECTORY.glob("*.csv"))
        + list(RAW_DIRECTORY.glob("*.CSV"))
    )

    if not files:
        raise FileNotFoundError(
            f"No CSV file found in:\n{RAW_DIRECTORY}"
        )

    return files[0]


def load_raw_data():
    input_file = find_raw_file()

    print(f"\nInput file:")
    print(input_file)

    dataframe = pd.read_csv(
        input_file,
        encoding="utf-8",
    )

    print(f"\nRows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def convert_wide_year_format(dataframe):
    year_columns = []

    for column in dataframe.columns:
        normalized = normalize_text(column)

        if normalized.isdigit():
            year = int(normalized)

            if 1960 <= year <= 2030:
                year_columns.append(column)

    if not year_columns:
        return dataframe

    identifier_columns = [
        column
        for column in dataframe.columns
        if column not in year_columns
    ]

    dataframe = dataframe.melt(
        id_vars=identifier_columns,
        value_vars=year_columns,
        var_name="Year",
        value_name="Yield_Kg_Ha",
    )

    return dataframe


def prepare_columns(dataframe):
    district_column = find_column(
        dataframe.columns,
        [
            "District",
            "District Name",
            "District/Year",
        ],
    )

    crop_column = find_column(
        dataframe.columns,
        [
            "Crop",
            "Crop Name",
            "Commodity",
        ],
    )

    season_column = find_column(
        dataframe.columns,
        [
            "Season",
            "Crop Season",
        ],
    )

    year_column = find_column(
        dataframe.columns,
        [
            "Year",
            "Crop Year",
            "Year/Season",
        ],
    )

    area_column = find_column(
        dataframe.columns,
        [
            "Area",
            "Area Hectare",
            "Area Hectares",
            "Area (Hectare)",
            "Area (Ha)",
        ],
    )

    production_column = find_column(
        dataframe.columns,
        [
            "Production",
            "Production Tonnes",
            "Production (Tonnes)",
            "Production MT",
        ],
    )

    yield_column = find_column(
        dataframe.columns,
        [
            "Yield",
            "Yield Kg Ha",
            "Yield Kg/Ha",
            "Yield (Kg/Ha)",
            "Productivity",
        ],
    )

    column_mapping = {
        "district": district_column,
        "crop": crop_column,
        "season": season_column,
        "year": year_column,
        "area": area_column,
        "production": production_column,
        "yield": yield_column,
    }

    print("\nDetected columns:")

    for name, column in column_mapping.items():
        print(f"    {name}: {column}")

    required = [
        "district",
        "crop",
        "year",
    ]

    missing = [
        name
        for name in required
        if column_mapping[name] is None
    ]

    if missing:
        raise ValueError(
            f"Unable to identify required columns: {missing}"
        )

    rename_mapping = {
        district_column: "District",
        crop_column: "Crop",
        year_column: "Year",
    }

    if season_column is not None:
        rename_mapping[season_column] = "Season"

    if area_column is not None:
        rename_mapping[area_column] = "Area_Hectares"

    if production_column is not None:
        rename_mapping[production_column] = "Production_Tonnes"

    if yield_column is not None:
        rename_mapping[yield_column] = "Yield_Kg_Ha"

    dataframe = dataframe.rename(
        columns=rename_mapping
    )

    if "Season" not in dataframe.columns:
        dataframe["Season"] = None

    if "Area_Hectares" not in dataframe.columns:
        dataframe["Area_Hectares"] = None

    if "Production_Tonnes" not in dataframe.columns:
        dataframe["Production_Tonnes"] = None

    if "Yield_Kg_Ha" not in dataframe.columns:
        dataframe["Yield_Kg_Ha"] = None

    return dataframe


def clean_numeric_column(dataframe, column):
    dataframe[column] = (
        dataframe[column]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("NA", "", regex=False)
        .str.replace("N/A", "", regex=False)
        .str.replace("-", "", regex=False)
        .str.strip()
    )

    dataframe[column] = pd.to_numeric(
        dataframe[column],
        errors="coerce",
    )

    return dataframe


def infer_yield(dataframe):
    valid_yield = dataframe["Yield_Kg_Ha"].notna()

    area = dataframe["Area_Hectares"]
    production = dataframe["Production_Tonnes"]

    calculable = (
        ~valid_yield
        & area.notna()
        & production.notna()
        & (area > 0)
    )

    dataframe.loc[
        calculable,
        "Yield_Kg_Ha",
    ] = (
        dataframe.loc[calculable, "Production_Tonnes"]
        * 1000
        / dataframe.loc[calculable, "Area_Hectares"]
    )

    return dataframe


def normalize_units(dataframe):
    area = dataframe["Area_Hectares"]
    production = dataframe["Production_Tonnes"]

    if area.notna().sum() > 0:
        median_area = area.dropna().median()

        if median_area < 10000:
            dataframe["Area_Hectares"] = area * 1000

    if production.notna().sum() > 0:
        median_production = production.dropna().median()

        if median_production < 10000:
            dataframe["Production_Tonnes"] = production * 1000

    return dataframe


def assign_season(dataframe):
    if "Season" in dataframe.columns:
        dataframe["Season"] = dataframe["Season"].apply(
            normalize_season
        )

    crop_season_map = {
        "Rice": "Kharif",
        "Maize": "Kharif",
        "Bajra": "Kharif",
        "Cotton": "Kharif",
        "Wheat": "Rabi",
        "Barley": "Rabi",
        "Gram": "Rabi",
        "Mustard": "Rabi",
        "Potato": "Rabi",
        "Sugarcane": "Kharif",
    }

    missing_season = dataframe["Season"].isna()

    dataframe.loc[
        missing_season,
        "Season",
    ] = dataframe.loc[
        missing_season,
        "Crop",
    ].map(crop_season_map)

    return dataframe


def clean_dataset(dataframe):
    dataframe["District"] = dataframe["District"].apply(
        normalize_district
    )

    dataframe["Crop"] = dataframe["Crop"].apply(
        normalize_crop
    )

    dataframe["Year"] = (
        dataframe["Year"]
        .astype(str)
        .str.extract(r"(20\d{2})")[0]
    )

    dataframe["Year"] = pd.to_numeric(
        dataframe["Year"],
        errors="coerce",
    )

    dataframe = assign_season(dataframe)

    for column in [
        "Area_Hectares",
        "Production_Tonnes",
        "Yield_Kg_Ha",
    ]:
        dataframe = clean_numeric_column(
            dataframe,
            column,
        )

    dataframe = normalize_units(dataframe)

    dataframe = infer_yield(dataframe)

    dataframe = dataframe[
        dataframe["Crop"].notna()
    ]

    dataframe = dataframe[
        dataframe["District"].notna()
    ]

    dataframe = dataframe[
        dataframe["Year"].notna()
    ]

    dataframe = dataframe[
        dataframe["Yield_Kg_Ha"].notna()
    ]

    dataframe["Year"] = dataframe["Year"].astype(int)

    dataframe = dataframe[
        dataframe["Year"].between(1968, 2025)
    ]

    dataframe = dataframe[
        dataframe["Crop"].isin(
            list(SUPPORTED_CROPS.values())
        )
    ]

    dataframe = dataframe[
        [
            "District",
            "Year",
            "Season",
            "Crop",
            "Area_Hectares",
            "Production_Tonnes",
            "Yield_Kg_Ha",
        ]
    ]

    dataframe = dataframe.drop_duplicates(
        subset=[
            "District",
            "Year",
            "Season",
            "Crop",
        ],
        keep="last",
    )

    dataframe = dataframe.sort_values(
        [
            "District",
            "Year",
            "Season",
            "Crop",
        ]
    )

    dataframe = dataframe.reset_index(
        drop=True
    )

    return dataframe


def validate_dataset(dataframe):
    print("\n" + "=" * 60)
    print("OUTPUT VALIDATION")
    print("=" * 60)

    required_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
        "Area_Hectares",
        "Production_Tonnes",
        "Yield_Kg_Ha",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing output columns: {missing_columns}"
        )

    print("\nRequired columns: PASS")

    missing_values = dataframe[
        required_columns
    ].isna().sum()

    print("\nMissing values:")
    print(missing_values)

    key_columns = [
        "District",
        "Year",
        "Season",
        "Crop",
    ]

    duplicate_count = dataframe.duplicated(
        subset=key_columns
    ).sum()

    print(
        f"\nDuplicate observations: "
        f"{duplicate_count}"
    )

    print(
        f"\nDistricts: "
        f"{dataframe['District'].nunique()}"
    )

    print(
        f"Crops: "
        f"{dataframe['Crop'].nunique()}"
    )

    print(
        f"Years: "
        f"{dataframe['Year'].min()} - "
        f"{dataframe['Year'].max()}"
    )

    print("\nCrops found:")

    for crop in sorted(
        dataframe["Crop"].unique()
    ):
        count = (
            dataframe["Crop"] == crop
        ).sum()

        print(
            f"    - {crop}: {count}"
        )

    print("\nSeasons:")

    print(
        dataframe["Season"]
        .value_counts(dropna=False)
        .sort_index()
        .to_string()
    )

    print("\nYield statistics:")

    print(
        dataframe["Yield_Kg_Ha"]
        .describe()
        .round(2)
        .to_string()
    )

    if duplicate_count != 0:
        raise ValueError(
            "Duplicate district/year/season/crop observations detected."
        )

    if dataframe.empty:
        raise ValueError(
            "Processed crop-yield dataset is empty."
        )

    print("\nValidation status: PASS")


def main():
    print("=" * 60)
    print("PUNJAB CROP-YIELD DATA PROCESSING")
    print("=" * 60)

    print(
        "\nRaw data directory:"
    )
    print(RAW_DIRECTORY)

    dataframe = load_raw_data()

    dataframe = convert_wide_year_format(
        dataframe
    )

    dataframe = prepare_columns(
        dataframe
    )

    dataframe = clean_dataset(
        dataframe
    )

    validate_dataset(
        dataframe
    )

    OUTPUT_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("\n" + "=" * 60)
    print("CROP-YIELD DATASET CREATED")
    print("=" * 60)

    print("\nOutput:")
    print(OUTPUT_FILE)

    print(
        f"\nRows: {len(dataframe)}"
    )

    print(
        f"Columns: {len(dataframe.columns)}"
    )

    print(
        "\nCrop-yield processing completed successfully."
    )


if __name__ == "__main__":
    main()
```
