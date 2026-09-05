from pathlib import Path

import cfgrib
import numpy as np
import pandas as pd
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

ENVIRONMENTAL_DIR = PROJECT_ROOT / "data" / "environmental"

INPUT_FILE = ENVIRONMENTAL_DIR / "era5_land_monthly.grib"
OUTPUT_FILE = ENVIRONMENTAL_DIR / "environmental_features.csv"

DISTRICTS = {
    "Amritsar": {
        "latitude": 31.6340,
        "longitude": 74.8723,
    },
    "Barnala": {
        "latitude": 30.3819,
        "longitude": 75.5468,
    },
    "Bathinda": {
        "latitude": 30.2110,
        "longitude": 74.9455,
    },
    "Faridkot": {
        "latitude": 30.6777,
        "longitude": 74.7553,
    },
    "Fatehgarh Sahib": {
        "latitude": 30.6436,
        "longitude": 76.3970,
    },
    "Fazilka": {
        "latitude": 30.4036,
        "longitude": 74.0287,
    },
    "Firozpur": {
        "latitude": 30.9331,
        "longitude": 74.6225,
    },
    "Gurdaspur": {
        "latitude": 32.0419,
        "longitude": 75.4053,
    },
    "Hoshiarpur": {
        "latitude": 31.5143,
        "longitude": 75.9115,
    },
    "Jalandhar": {
        "latitude": 31.3260,
        "longitude": 75.5762,
    },
    "Kapurthala": {
        "latitude": 31.3800,
        "longitude": 75.3800,
    },
    "Ludhiana": {
        "latitude": 30.9010,
        "longitude": 75.8573,
    },
    "Mansa": {
        "latitude": 29.9988,
        "longitude": 75.3937,
    },
    "Moga": {
        "latitude": 30.8165,
        "longitude": 75.1719,
    },
    "Muktsar": {
        "latitude": 30.4767,
        "longitude": 74.5143,
    },
    "Pathankot": {
        "latitude": 32.2643,
        "longitude": 75.6421,
    },
    "Patiala": {
        "latitude": 30.3398,
        "longitude": 76.3869,
    },
    "Rupnagar": {
        "latitude": 30.9660,
        "longitude": 76.5330,
    },
    "Sahibzada Ajit Singh Nagar": {
        "latitude": 30.7046,
        "longitude": 76.7179,
    },
    "Sangrur": {
        "latitude": 30.2458,
        "longitude": 75.8421,
    },
    "Shahid Bhagat Singh Nagar": {
        "latitude": 31.1254,
        "longitude": 76.1164,
    },
    "Tarn Taran": {
        "latitude": 31.4519,
        "longitude": 74.9278,
    },
}

EXPECTED_YEARS = list(range(2021, 2026))
EXPECTED_SEASONS = ["Rabi", "Kharif"]

EXPECTED_ROWS = (
    len(DISTRICTS)
    * len(EXPECTED_YEARS)
    * len(EXPECTED_SEASONS)
)


def load_era5_data() -> tuple[xr.Dataset, xr.Dataset, xr.Dataset]:
    print("Loading ERA5-Land data...")

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"ERA5-Land file not found: {INPUT_FILE}"
        )

    datasets = cfgrib.open_datasets(
        str(INPUT_FILE),
    )

    print(f"GRIB datasets found: {len(datasets)}")

    temperature_dataset = None
    soil_moisture_dataset = None
    precipitation_datasets = []

    for dataset in datasets:
        variables = set(dataset.data_vars)

        if "t2m" in variables:
            temperature_dataset = dataset

        elif "swvl1" in variables:
            soil_moisture_dataset = dataset

        elif "tp" in variables:
            precipitation_datasets.append(dataset)

    if temperature_dataset is None:
        raise ValueError(
            "Temperature variable 't2m' was not found."
        )

    if soil_moisture_dataset is None:
        raise ValueError(
            "Soil moisture variable 'swvl1' was not found."
        )

    if not precipitation_datasets:
        raise ValueError(
            "Precipitation variable 'tp' was not found."
        )

    print("Temperature dataset found.")
    print("Soil moisture dataset found.")
    print(
        f"Precipitation datasets found: "
        f"{len(precipitation_datasets)}"
    )

    precipitation_dataset = xr.concat(
        precipitation_datasets,
        dim="time",
    )

    precipitation_dataset = precipitation_dataset.sortby(
        "time",
    )

    time_values = precipitation_dataset.time.values

    _, unique_indices = np.unique(
        time_values,
        return_index=True,
    )

    precipitation_dataset = precipitation_dataset.isel(
        time=sorted(unique_indices),
    )

    print("ERA5-Land data loaded successfully.")

    return (
        temperature_dataset,
        precipitation_dataset,
        soil_moisture_dataset,
    )


def select_district(
    dataset: xr.Dataset,
    latitude: float,
    longitude: float,
) -> xr.Dataset:
    return dataset.sel(
        latitude=latitude,
        longitude=longitude,
        method="nearest",
    )


def get_season_dates(
    year: int,
    season: str,
) -> tuple[pd.Timestamp, pd.Timestamp]:

    if season == "Rabi":
        start_date = pd.Timestamp(
            year=year - 1,
            month=11,
            day=1,
        )

        end_date = pd.Timestamp(
            year=year,
            month=4,
            day=15,
        )

    elif season == "Kharif":
        start_date = pd.Timestamp(
            year=year,
            month=7,
            day=1,
        )

        end_date = pd.Timestamp(
            year=year,
            month=10,
            day=31,
        )

    else:
        raise ValueError(
            f"Unknown season: {season}"
        )

    return start_date, end_date


def calculate_season_features(
    temperature_dataset: xr.Dataset,
    precipitation_dataset: xr.Dataset,
    soil_moisture_dataset: xr.Dataset,
    start_date: pd.Timestamp,
    end_date: pd.Timestamp,
) -> dict[str, float]:

    temperature = temperature_dataset.sel(
        time=slice(start_date, end_date),
    )

    precipitation = precipitation_dataset.sel(
        time=slice(start_date, end_date),
    )

    soil_moisture = soil_moisture_dataset.sel(
        time=slice(start_date, end_date),
    )

    if temperature.time.size == 0:
        raise ValueError(
            f"No temperature data found between "
            f"{start_date.date()} and {end_date.date()}."
        )

    if precipitation.time.size == 0:
        raise ValueError(
            f"No precipitation data found between "
            f"{start_date.date()} and {end_date.date()}."
        )

    if soil_moisture.time.size == 0:
        raise ValueError(
            f"No soil moisture data found between "
            f"{start_date.date()} and {end_date.date()}."
        )

    temperature_kelvin = (
        temperature["t2m"]
        .mean()
        .item()
    )

    temperature_celsius = (
        temperature_kelvin - 273.15
    )

    rainfall_mm = (
        precipitation["tp"]
        .sum()
        .item()
        * 1000.0
    )

    soil_moisture_mean = (
        soil_moisture["swvl1"]
        .mean()
        .item()
    )

    return {
        "Rainfall_mm": rainfall_mm,
        "Temperature_C": temperature_celsius,
        "Soil_Moisture": soil_moisture_mean,
    }


def build_environmental_dataset(
    temperature_dataset: xr.Dataset,
    precipitation_dataset: xr.Dataset,
    soil_moisture_dataset: xr.Dataset,
) -> pd.DataFrame:

    rows = []

    print()
    print("Calculating seasonal environmental features...")

    for district, coordinates in DISTRICTS.items():

        print(f"Processing {district}...")

        district_temperature = select_district(
            temperature_dataset,
            coordinates["latitude"],
            coordinates["longitude"],
        )

        district_precipitation = select_district(
            precipitation_dataset,
            coordinates["latitude"],
            coordinates["longitude"],
        )

        district_soil_moisture = select_district(
            soil_moisture_dataset,
            coordinates["latitude"],
            coordinates["longitude"],
        )

        for year in EXPECTED_YEARS:

            for season in EXPECTED_SEASONS:

                start_date, end_date = get_season_dates(
                    year,
                    season,
                )

                features = calculate_season_features(
                    district_temperature,
                    district_precipitation,
                    district_soil_moisture,
                    start_date,
                    end_date,
                )

                rows.append(
                    {
                        "District": district,
                        "Year": year,
                        "Season": season,
                        "Start_Date": start_date.date(),
                        "End_Date": end_date.date(),
                        **features,
                    }
                )

    return pd.DataFrame(rows)


def validate_dataset(
    dataset: pd.DataFrame,
) -> None:

    print()
    print("=" * 60)
    print("ENVIRONMENTAL DATA VALIDATION")
    print("=" * 60)

    print(f"Rows: {len(dataset)}")
    print(f"Columns: {len(dataset.columns)}")

    print()
    print("Expected rows:")
    print(EXPECTED_ROWS)

    if len(dataset) != EXPECTED_ROWS:
        raise ValueError(
            f"Expected {EXPECTED_ROWS} rows, "
            f"but found {len(dataset)}."
        )

    print("Row count: PASS")

    print()
    print("District validation:")

    districts = sorted(
        dataset["District"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Districts found: {len(districts)}")

    for district in districts:
        print(f"    - {district}")

    missing_districts = [
        district
        for district in DISTRICTS
        if district not in districts
    ]

    unexpected_districts = [
        district
        for district in districts
        if district not in DISTRICTS
    ]

    if missing_districts:
        raise ValueError(
            f"Missing districts: {missing_districts}"
        )

    if unexpected_districts:
        raise ValueError(
            f"Unexpected districts: {unexpected_districts}"
        )

    if len(districts) != len(DISTRICTS):
        raise ValueError(
            f"Expected {len(DISTRICTS)} districts, "
            f"but found {len(districts)}."
        )

    print("District validation: PASS")

    print()
    print("Year validation:")

    years = sorted(
        dataset["Year"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Years found: {years}")
    print(f"Expected:    {EXPECTED_YEARS}")

    if years != EXPECTED_YEARS:
        raise ValueError(
            f"Unexpected year coverage: {years}"
        )

    print("Year validation: PASS")

    print()
    print("Season validation:")

    seasons = sorted(
        dataset["Season"]
        .dropna()
        .unique()
        .tolist()
    )

    print(f"Seasons found: {seasons}")

    if set(seasons) != set(EXPECTED_SEASONS):
        raise ValueError(
            f"Unexpected seasons: {seasons}"
        )

    print("Season validation: PASS")

    print()
    print("Missing values:")

    missing_values = dataset.isna().sum()

    print(missing_values)

    if missing_values.sum() != 0:
        raise ValueError(
            "Missing values detected."
        )

    print("Missing value validation: PASS")

    if (dataset["Rainfall_mm"] < 0).any():
        raise ValueError(
            "Negative rainfall values detected."
        )

    if (dataset["Soil_Moisture"] < 0).any():
        raise ValueError(
            "Negative soil moisture values detected."
        )

    print("Rainfall validation: PASS")
    print("Soil moisture validation: PASS")

    district_counts = (
        dataset
        .groupby("District")
        .size()
    )

    if not (district_counts == 10).all():
        raise ValueError(
            "Not every district contains exactly "
            "10 observations."
        )

    print("District observation coverage: PASS")

    combination_count = (
        dataset[
            ["District", "Year", "Season"]
        ]
        .drop_duplicates()
        .shape[0]
    )

    if combination_count != EXPECTED_ROWS:
        raise ValueError(
            "Duplicate or missing district-year-season "
            "combinations detected."
        )

    print(
        "District/year/season combinations: PASS"
    )

    print()
    print("Environmental feature statistics:")

    statistics = dataset[
        [
            "Rainfall_mm",
            "Temperature_C",
            "Soil_Moisture",
        ]
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
        ]
        .round(4)
        .to_string()
    )

    print()
    print("Environmental data validation passed.")


def save_dataset(
    dataset: pd.DataFrame,
) -> None:

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataset.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("Environmental dataset generated successfully.")
    print(f"Rows: {len(dataset)}")
    print(f"Columns: {len(dataset.columns)}")
    print(f"Saved to: {OUTPUT_FILE}")


def main() -> None:

    print("=" * 60)
    print("ERA5-LAND ENVIRONMENTAL FEATURE PROCESSING")
    print("=" * 60)

    print()
    print(f"Expected districts: {len(DISTRICTS)}")
    print(f"Expected years: {EXPECTED_YEARS}")
    print(f"Expected seasons: {EXPECTED_SEASONS}")
    print(f"Expected rows: {EXPECTED_ROWS}")

    (
        temperature_dataset,
        precipitation_dataset,
        soil_moisture_dataset,
    ) = load_era5_data()

    environmental_features = (
        build_environmental_dataset(
            temperature_dataset,
            precipitation_dataset,
            soil_moisture_dataset,
        )
    )

    validate_dataset(
        environmental_features,
    )

    save_dataset(
        environmental_features,
    )


if __name__ == "__main__":
    main()
