from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "features"
    / "ml_features.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "analysis"
    / "diversification"
)


def load_data():
    dataframe = pd.read_csv(INPUT_PATH)

    print()
    print("=" * 70)
    print("CROP DIVERSIFICATION ANALYSIS")
    print("=" * 70)

    print()
    print(f"Rows loaded: {len(dataframe)}")
    print(f"Columns loaded: {len(dataframe.columns)}")

    return dataframe


def crop_summary(dataframe):
    summary = (
        dataframe.groupby("Crop")
        .agg(
            Samples=("Crop", "size"),
            Mean_Yield=("Yield_kg_ha", "mean"),
            Yield_STD=("Yield_kg_ha", "std"),
            Minimum_Yield=("Yield_kg_ha", "min"),
            Maximum_Yield=("Yield_kg_ha", "max"),
            Mean_NDVI=("NDVI", "mean"),
            Mean_NDWI=("NDWI", "mean"),
            Mean_EVI=("EVI", "mean"),
            Mean_Rainfall=("Rainfall_mm", "mean"),
            Mean_Temperature=("Temperature_C", "mean"),
            Mean_Soil_Moisture=("Soil_Moisture", "mean")
        )
        .reset_index()
        .sort_values(
            "Mean_Yield",
            ascending=False
        )
    )

    return summary


def district_crop_summary(dataframe):
    summary = (
        dataframe.groupby(
            ["District", "Crop"]
        )
        .agg(
            Samples=("Crop", "size"),
            Mean_Yield=("Yield_kg_ha", "mean"),
            Mean_NDVI=("NDVI", "mean"),
            Mean_NDWI=("NDWI", "mean"),
            Mean_EVI=("EVI", "mean"),
            Mean_Rainfall=("Rainfall_mm", "mean"),
            Mean_Temperature=("Temperature_C", "mean"),
            Mean_Soil_Moisture=("Soil_Moisture", "mean")
        )
        .reset_index()
    )

    return summary


def crop_year_summary(dataframe):
    summary = (
        dataframe.groupby(
            ["Year", "Crop"]
        )
        .agg(
            Samples=("Crop", "size"),
            Mean_Yield=("Yield_kg_ha", "mean")
        )
        .reset_index()
    )

    return summary


def crop_season_summary(dataframe):
    summary = (
        dataframe.groupby(
            ["Season", "Crop"]
        )
        .agg(
            Samples=("Crop", "size"),
            Mean_Yield=("Yield_kg_ha", "mean")
        )
        .reset_index()
    )

    return summary


def crop_rankings(dataframe):
    summary = (
        dataframe.groupby("Crop")
        .agg(
            Mean_Yield=("Yield_kg_ha", "mean"),
            Mean_NDVI=("NDVI", "mean"),
            Mean_NDWI=("NDWI", "mean"),
            Mean_EVI=("EVI", "mean"),
            Mean_Rainfall=("Rainfall_mm", "mean"),
            Mean_Temperature=("Temperature_C", "mean"),
            Mean_Soil_Moisture=("Soil_Moisture", "mean")
        )
        .reset_index()
    )

    summary["Yield_Rank"] = (
        summary["Mean_Yield"]
        .rank(
            ascending=False,
            method="min"
        )
        .astype(int)
    )

    summary["NDVI_Rank"] = (
        summary["Mean_NDVI"]
        .rank(
            ascending=False,
            method="min"
        )
        .astype(int)
    )

    summary["NDWI_Rank"] = (
        summary["Mean_NDWI"]
        .rank(
            ascending=False,
            method="min"
        )
        .astype(int)
    )

    summary["EVI_Rank"] = (
        summary["Mean_EVI"]
        .rank(
            ascending=False,
            method="min"
        )
        .astype(int)
    )

    return summary.sort_values("Yield_Rank")


def diversification_matrix(dataframe):
    matrix = pd.pivot_table(
        dataframe,
        values="Yield_kg_ha",
        index="District",
        columns="Crop",
        aggfunc="mean"
    )

    return matrix


def plot_crop_yield(dataframe):
    summary = (
        dataframe.groupby("Crop")["Yield_kg_ha"]
        .mean()
        .sort_values(ascending=False)
        .reset_index()
    )

    plt.figure(figsize=(11, 7))

    sns.barplot(
        data=summary,
        x="Crop",
        y="Yield_kg_ha"
    )

    plt.xlabel("Crop")
    plt.ylabel("Mean Yield (kg/ha)")
    plt.title("Average Agricultural Yield by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_mean_yield.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_crop_yield_distribution(dataframe):
    plt.figure(figsize=(12, 7))

    sns.boxplot(
        data=dataframe,
        x="Crop",
        y="Yield_kg_ha"
    )

    plt.xlabel("Crop")
    plt.ylabel("Yield (kg/ha)")
    plt.title("Yield Distribution by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_yield_distribution.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_district_crop_heatmap(dataframe):
    matrix = diversification_matrix(dataframe)

    plt.figure(figsize=(14, 10))

    sns.heatmap(
        matrix,
        annot=True,
        fmt=".0f",
        linewidths=0.5
    )

    plt.xlabel("Crop")
    plt.ylabel("District")
    plt.title("District-wise Mean Crop Yield")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "district_crop_yield_heatmap.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_crop_year_trends(dataframe):
    summary = (
        dataframe.groupby(
            ["Year", "Crop"]
        )["Yield_kg_ha"]
        .mean()
        .reset_index()
    )

    plt.figure(figsize=(12, 7))

    sns.lineplot(
        data=summary,
        x="Year",
        y="Yield_kg_ha",
        hue="Crop",
        marker="o"
    )

    plt.xlabel("Year")
    plt.ylabel("Mean Yield (kg/ha)")
    plt.title("Crop Yield Trends Across Years")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_yield_year_trends.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_crop_environment(dataframe):
    summary = (
        dataframe.groupby("Crop")
        .agg(
            NDVI=("NDVI", "mean"),
            NDWI=("NDWI", "mean"),
            EVI=("EVI", "mean")
        )
        .reset_index()
    )

    melted = summary.melt(
        id_vars="Crop",
        var_name="Feature",
        value_name="Value"
    )

    plt.figure(figsize=(12, 7))

    sns.barplot(
        data=melted,
        x="Crop",
        y="Value",
        hue="Feature"
    )

    plt.xlabel("Crop")
    plt.ylabel("Mean Feature Value")
    plt.title("Remote Sensing Feature Comparison by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_remote_sensing_comparison.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_crop_climate(dataframe):
    summary = (
        dataframe.groupby("Crop")
        .agg(
            Rainfall=("Rainfall_mm", "mean"),
            Temperature=("Temperature_C", "mean"),
            Soil_Moisture=("Soil_Moisture", "mean")
        )
        .reset_index()
    )

    melted = summary.melt(
        id_vars="Crop",
        var_name="Environmental_Feature",
        value_name="Value"
    )

    plt.figure(figsize=(12, 7))

    sns.barplot(
        data=melted,
        x="Crop",
        y="Value",
        hue="Environmental_Feature"
    )

    plt.xlabel("Crop")
    plt.ylabel("Mean Value")
    plt.title("Environmental Conditions by Crop")
    plt.xticks(rotation=20)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "crop_environmental_comparison.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_yield_vs_ndvi(dataframe):
    plt.figure(figsize=(11, 7))

    sns.scatterplot(
        data=dataframe,
        x="NDVI",
        y="Yield_kg_ha",
        hue="Crop",
        s=70
    )

    plt.xlabel("NDVI")
    plt.ylabel("Yield (kg/ha)")
    plt.title("Relationship Between NDVI and Crop Yield")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "yield_vs_ndvi.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def plot_yield_vs_soil_moisture(dataframe):
    plt.figure(figsize=(11, 7))

    sns.scatterplot(
        data=dataframe,
        x="Soil_Moisture",
        y="Yield_kg_ha",
        hue="Crop",
        s=70
    )

    plt.xlabel("Soil Moisture")
    plt.ylabel("Yield (kg/ha)")
    plt.title("Relationship Between Soil Moisture and Crop Yield")
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "yield_vs_soil_moisture.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()


def save_results(
    crop_summary_data,
    district_summary_data,
    year_summary_data,
    season_summary_data,
    rankings,
    matrix
):
    crop_summary_data.to_csv(
        OUTPUT_DIR / "crop_summary.csv",
        index=False
    )

    district_summary_data.to_csv(
        OUTPUT_DIR / "district_crop_summary.csv",
        index=False
    )

    year_summary_data.to_csv(
        OUTPUT_DIR / "crop_year_summary.csv",
        index=False
    )

    season_summary_data.to_csv(
        OUTPUT_DIR / "crop_season_summary.csv",
        index=False
    )

    rankings.to_csv(
        OUTPUT_DIR / "crop_rankings.csv",
        index=False
    )

    matrix.to_csv(
        OUTPUT_DIR / "district_crop_yield_matrix.csv"
    )


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe = load_data()

    crop_summary_data = crop_summary(
        dataframe
    )

    district_summary_data = district_crop_summary(
        dataframe
    )

    year_summary_data = crop_year_summary(
        dataframe
    )

    season_summary_data = crop_season_summary(
        dataframe
    )

    rankings = crop_rankings(
        dataframe
    )

    matrix = diversification_matrix(
        dataframe
    )

    print()
    print("=" * 70)
    print("CROP DIVERSIFICATION SUMMARY")
    print("=" * 70)

    print()
    print(
        crop_summary_data.to_string(
            index=False,
            float_format=lambda value: f"{value:.2f}"
        )
    )

    print()
    print("=" * 70)
    print("CROP RANKINGS")
    print("=" * 70)

    print()
    print(
        rankings[
            [
                "Crop",
                "Mean_Yield",
                "Yield_Rank",
                "Mean_NDVI",
                "NDVI_Rank",
                "Mean_NDWI",
                "NDWI_Rank"
            ]
        ].to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}"
        )
    )

    save_results(
        crop_summary_data,
        district_summary_data,
        year_summary_data,
        season_summary_data,
        rankings,
        matrix
    )

    print()
    print("=" * 70)
    print("GENERATING DIVERSIFICATION VISUALIZATIONS")
    print("=" * 70)

    plot_crop_yield(dataframe)
    print("Created: crop_mean_yield.png")

    plot_crop_yield_distribution(dataframe)
    print("Created: crop_yield_distribution.png")

    plot_district_crop_heatmap(dataframe)
    print("Created: district_crop_yield_heatmap.png")

    plot_crop_year_trends(dataframe)
    print("Created: crop_yield_year_trends.png")

    plot_crop_environment(dataframe)
    print("Created: crop_remote_sensing_comparison.png")

    plot_crop_climate(dataframe)
    print("Created: crop_environmental_comparison.png")

    plot_yield_vs_ndvi(dataframe)
    print("Created: yield_vs_ndvi.png")

    plot_yield_vs_soil_moisture(dataframe)
    print("Created: yield_vs_soil_moisture.png")

    print()
    print("=" * 70)
    print("DIVERSIFICATION ANALYSIS COMPLETED")
    print("=" * 70)

    print()
    print(f"Results saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
