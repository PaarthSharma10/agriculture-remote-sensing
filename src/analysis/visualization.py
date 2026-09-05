"""
Visualization of agricultural remote sensing temporal analysis.

Creates plots for NDVI, NDWI, EVI, seasonal differences,
yearly changes, anomalies, and correlations.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ANALYSIS_DIR = Path("data/analysis")
PLOT_DIR = ANALYSIS_DIR / "plots"


def load_data(filename: str) -> pd.DataFrame:
    """Load an analysis CSV file."""
    path = ANALYSIS_DIR / filename

    if not path.exists():
        raise FileNotFoundError(
            f"Analysis file not found: {path}"
        )

    return pd.read_csv(path)


def setup_plot_directory() -> None:
    """Create the plot output directory."""
    PLOT_DIR.mkdir(parents=True, exist_ok=True)


def plot_index_trends(
    df: pd.DataFrame,
    index_name: str,
) -> None:
    """Plot yearly trends for a vegetation index."""

    plt.figure(figsize=(10, 6))

    for district in df["District"].unique():
        district_data = df[
            df["District"] == district
        ]

        plt.plot(
            district_data["Year"],
            district_data[index_name],
            marker="o",
            label=district,
        )

    plt.title(f"{index_name} Trend by District")
    plt.xlabel("Year")
    plt.ylabel(index_name)
    plt.xticks(sorted(df["Year"].unique()))
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / f"{index_name.lower()}_trend.png",
        dpi=300,
    )

    plt.close()


def plot_seasonal_comparison(df: pd.DataFrame) -> None:
    """Compare Rabi and Kharif NDVI by district."""

    pivot = df.pivot(
        index="District",
        columns="Season",
        values="NDVI",
    )

    pivot.plot(
        kind="bar",
        figsize=(10, 6),
    )

    plt.title("Average NDVI: Rabi vs Kharif")
    plt.xlabel("District")
    plt.ylabel("Average NDVI")
    plt.xticks(rotation=0)
    plt.legend(title="Season")
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "seasonal_ndvi_comparison.png",
        dpi=300,
    )

    plt.close()


def plot_district_comparison(df: pd.DataFrame) -> None:
    """Compare vegetation indices across districts."""

    district_data = df.set_index("District")[
        ["NDVI", "NDWI", "EVI"]
    ]

    district_data.plot(
        kind="bar",
        figsize=(10, 6),
    )

    plt.title("Average Vegetation Indices by District")
    plt.xlabel("District")
    plt.ylabel("Average Index Value")
    plt.xticks(rotation=0)
    plt.legend()
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "district_comparison.png",
        dpi=300,
    )

    plt.close()


def plot_yearly_ndvi_change(
    df: pd.DataFrame,
) -> None:
    """Plot yearly NDVI changes."""

    plt.figure(figsize=(10, 6))

    for district in df["District"].unique():
        district_data = df[
            df["District"] == district
        ]

        plt.plot(
            district_data["Year"],
            district_data["NDVI_Change"],
            marker="o",
            label=district,
        )

    plt.axhline(
        0,
        linewidth=1,
        linestyle="--",
    )

    plt.title("Year-to-Year NDVI Change")
    plt.xlabel("Year")
    plt.ylabel("NDVI Change")
    plt.xticks(sorted(df["Year"].unique()))
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "yearly_ndvi_change.png",
        dpi=300,
    )

    plt.close()


def plot_ndvi_anomalies(
    df: pd.DataFrame,
) -> None:
    """Plot NDVI anomalies by district and year."""

    plt.figure(figsize=(10, 6))

    for district in df["District"].unique():
        district_data = df[
            df["District"] == district
        ]

        plt.plot(
            district_data["Year"].astype(str)
            + "-"
            + district_data["Season"],
            district_data["NDVI_Anomaly"],
            marker="o",
            label=district,
        )

    plt.axhline(
        0,
        linewidth=1,
        linestyle="--",
    )

    plt.title("NDVI Anomalies")
    plt.xlabel("Season")
    plt.ylabel("NDVI Anomaly")
    plt.xticks(rotation=45)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "ndvi_anomalies.png",
        dpi=300,
    )

    plt.close()


def plot_correlation_matrix(
    df: pd.DataFrame,
) -> None:
    """Plot correlation matrix of vegetation indices."""

    # Remove any accidental non-numeric columns.
    numeric_df = df.select_dtypes(include="number")

    # Ensure all correlation values are numeric.
    numeric_df = numeric_df.astype(float)

    plt.figure(figsize=(7, 6))

    image = plt.imshow(
        numeric_df.values,
        aspect="auto",
    )

    plt.colorbar(image)

    plt.xticks(
        range(len(numeric_df.columns)),
        numeric_df.columns,
    )

    plt.yticks(
        range(len(numeric_df.index)),
        numeric_df.index,
    )

    for row in range(len(numeric_df.index)):
        for column in range(len(numeric_df.columns)):
            plt.text(
                column,
                row,
                f"{numeric_df.iloc[row, column]:.2f}",
                ha="center",
                va="center",
            )

    plt.title(
        "Correlation Between Vegetation Indices"
    )

    plt.tight_layout()

    plt.savefig(
        PLOT_DIR / "correlation_matrix.png",
        dpi=300,
    )

    plt.close()


def main() -> None:
    """Generate all temporal analysis visualizations."""

    print("Setting up plot directory...")
    setup_plot_directory()

    print("Loading analysis data...")

    yearly = load_data(
        "yearly_statistics.csv"
    )

    seasonal = load_data(
        "seasonal_statistics.csv"
    )

    district = load_data(
        "district_statistics.csv"
    )

    yearly_change = load_data(
        "yearly_change.csv"
    )

    anomalies = load_data(
        "anomalies.csv"
    )

    correlations = load_data(
        "correlations.csv"
    )

    print("Generating NDVI trend...")
    plot_index_trends(
        yearly,
        "NDVI",
    )

    print("Generating NDWI trend...")
    plot_index_trends(
        yearly,
        "NDWI",
    )

    print("Generating EVI trend...")
    plot_index_trends(
        yearly,
        "EVI",
    )

    print("Generating seasonal comparison...")
    plot_seasonal_comparison(
        seasonal
    )

    print("Generating district comparison...")
    plot_district_comparison(
        district
    )

    print("Generating yearly NDVI change...")
    plot_yearly_ndvi_change(
        yearly_change
    )

    print("Generating NDVI anomalies...")
    plot_ndvi_anomalies(
        anomalies
    )

    print("Generating correlation matrix...")
    plot_correlation_matrix(
        correlations
    )

    print()
    print(
        "Visualization completed successfully."
    )
    print(
        f"Plots saved to: {PLOT_DIR}"
    )


if __name__ == "__main__":
    main()
