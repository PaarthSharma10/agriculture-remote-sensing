import os
import pandas as pd

from earth_engine import initialize
from config import STUDY_DISTRICTS
from analysis.temporal_features import extract_features


initialize()

results = []

for district in STUDY_DISTRICTS:
    for year in range(2021, 2026):
        for season in ["Rabi", "Kharif"]:
            print(
                f"Processing {district} - {year} - {season}"
            )

            result = extract_features(
                district,
                year,
                season
            )

            results.append(result)

os.makedirs("data", exist_ok=True)

dataset = pd.DataFrame(results)

dataset.to_csv(
    "data/temporal_features.csv",
    index=False
)

print()
print("Dataset generated successfully.")
print(f"Rows: {len(dataset)}")
print("Saved to: data/temporal_features.csv")
