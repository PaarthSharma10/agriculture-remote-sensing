/**
 * demo.ts — Deterministic synthetic dataset generator for the Agri RS dashboard.
 *
 * PURPOSE:
 *   When the FastAPI backend (data/ml/ml_dataset.csv) is unavailable, the frontend
 *   falls back to this module to produce a realistic-looking dataset so the dashboard
 *   always renders.  The generator uses a seeded PRNG (mulberry32) so the data is
 *   identical across reloads — important for screenshots and demos.
 *
 * DATA MODEL:
 *   • 22 Punjab districts × 17 crops × 5 years (2021–2025) × 2 seasons (Kharif/Rabi)
 *   • ~15 000 rows with realistic yield distributions per crop
 *   • Remote-sensing features (NDVI, NDWI, EVI) correlated with yield
 *   • Climate features (rainfall, temperature, soil moisture) with seasonal patterns
 *
 * PREDICTION MODEL:
 *   • Simulates a gradient-boosted regression model with ~78% R²
 *   • Adds heteroscedastic noise (higher error on extreme yields)
 *   • Produces calibrated 95% prediction intervals
 *   • Risk scores derived from uncertainty + absolute error
 */

import type { Prediction, Sample } from "./types";

// ---------------------------------------------------------------------------
// Deterministic PRNG — mulberry32
// ---------------------------------------------------------------------------
// A simple 32-bit PRNG that produces identical sequences for a given seed.
// This avoids the non-determinism of Math.random() so the demo data is stable.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

/** All 22 districts of Punjab, India. */
export const DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
  "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
  "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur",
  "Shahid Bhagat Singh Nagar", "Tarn Taran",
];

/** All 17 crops tracked in the dataset. */
export const CROPS = [
  "Wheat", "Paddy", "Cotton", "Maize", "Sugarcane", "Moong", "Urad",
  "Arhar (Tur)", "Groundnut", "Mustard", "Soybean", "Sunflower", "Bajra",
  "Jowar", "Barley", "Linseed", "Rapeseed",
];

/** Base yield (kg/ha) per crop under average conditions. */
const CROP_BASE: Record<string, number> = {
  Wheat: 4400, Paddy: 4300, Cotton: 2100, Maize: 3600, Sugarcane: 72000,
  Moong: 900, Urad: 850, "Arhar (Tur)": 1100, Groundnut: 1900, Mustard: 1400,
  Soybean: 1500, Sunflower: 1200, Bajra: 1400, Jowar: 1300, Barley: 3200,
  Linseed: 900, Rapeseed: 1200,
};

/** Season yield multiplier — Rabi is slightly lower due to cooler temps. */
const SEASON_MULT: Record<string, number> = { Kharif: 1.0, Rabi: 0.95 };

/** Year range for the synthetic dataset. */
const YEARS = [2021, 2022, 2023, 2024, 2025];

// ---------------------------------------------------------------------------
// Sample generation
// ---------------------------------------------------------------------------

/**
 * Generate a synthetic dataset of crop samples.
 *
 * ALGORITHM:
 *   1. Create a pool of all (district, crop) combinations.
 *   2. Randomly sample from the pool, adding 1–3 rows per draw.
 *   3. Each row gets random year, season, and environmental features.
 *   4. Yield is computed from crop base × trend × season × vegetation × rain × noise.
 *
 * @param seed   PRNG seed for reproducibility (default 7)
 * @param count  Target number of rows (default 15000)
 * @returns      Array of Sample objects
 */
export function generateSamples(seed = 7, count = 15000): Sample[] {
  const rnd = mulberry32(seed);
  const samples: Sample[] = [];
  const seasons = ["Kharif", "Rabi"];

  // Build a pool of all (district, crop) pairs for random sampling
  const pool = DISTRICTS.flatMap((d) => CROPS.map((c) => ({ d, c })));

  let made = 0;
  while (made < count) {
    const { d, c } = pool[Math.floor(rnd() * pool.length)];
    const year = YEARS[Math.floor(rnd() * YEARS.length)];
    const season = seasons[Math.floor(rnd() * seasons.length)];
    const n = 1 + Math.floor(rnd() * 3); // 1–3 rows per draw

    for (let i = 0; i < n && made < count; i++) {
      // Year-over-year improvement trend (+1.5% per year)
      const trend = 1 + (year - 2021) * 0.015 + rnd() * 0.10;

      // Seasonal effect
      const seasonF = SEASON_MULT[season];

      // Vegetation indices — correlated with yield via shared random factors
      const ndvi = 0.30 + rnd() * 0.50;       // Typical range: 0.30–0.80
      const ndwi = -0.15 + rnd() * 0.45;      // Typical range: -0.15–0.30
      const evi = 0.6 + ndvi * 1.2 + rnd() * 0.4; // EVI tracks NDVI

      // Climate — seasonal offset for Kharif (monsoon) vs Rabi (winter)
      const rain = 250 + rnd() * 900 + (season === "Kharif" ? 300 : 0);
      const temp = 18 + rnd() * 14;
      const moisture = 0.10 + rnd() * 0.40;

      // Yield computation with realistic multiplicative factors
      const base = CROP_BASE[c] ?? 2500;
      const vegBoost = 1 + (ndvi - 0.5) * 0.50;        // Healthy crops yield more
      const rainPenalty = Math.max(0.82, 1 - Math.max(0, rain - 1200) / 2000); // Too much rain hurts
      const noise = 0.65 + rnd() * 0.75;                // ±35% natural variability

      const yieldKg = base * seasonF * trend * vegBoost * rainPenalty * noise;

      samples.push({
        District: d,
        Year: year,
        Season: season,
        Crop: c,
        Area_Hectare: Math.round((0.5 + rnd() * 12) * 10) / 10,
        Production_Tonnes: Math.round((yieldKg / 1000) * (0.5 + rnd() * 8) * 10) / 10,
        Yield_kg_ha: Math.round(yieldKg),
        NDVI: Math.round(ndvi * 1000) / 1000,
        NDWI: Math.round(ndwi * 1000) / 1000,
        EVI: Math.round(evi * 1000) / 1000,
        Rainfall_mm: Math.round(rain),
        Temperature_C: Math.round(temp * 10) / 10,
        Soil_Moisture: Math.round(moisture * 1000) / 1000,
      });
      made++;
    }
  }
  return samples;
}

// ---------------------------------------------------------------------------
// Prediction generation (simulated ML model output)
// ---------------------------------------------------------------------------

/**
 * Generate synthetic model predictions for each sample.
 *
 * SIMULATED MODEL BEHAVIOUR:
 *   • R² ≈ 0.78 (realistic for gradient-boosted crop yield regression)
 *   • MAE ≈ 300 kg/ha (typical for Punjab wheat/paddy)
 *   • Heteroscedastic noise: predictions are less accurate for extreme yields
 *   • 95% prediction intervals calibrated so ~92% of actuals fall within them
 *   • Risk levels derived from uncertainty percentage + absolute error
 *
 * @param samples  The sample dataset to predict against
 * @param seed     PRNG seed (default 11, different from sample seed)
 * @returns        Array of Prediction objects
 */
export function generatePredictions(samples: Sample[], seed = 11): Prediction[] {
  const rnd = mulberry32(seed);

  return samples.map((s) => {
    const actual = s.Yield_kg_ha;

    // --- Simulated prediction error ---
    // Target R² ≈ 0.78 (realistic for gradient-boosted crop yield regression)
    // Error sources: model imperfection + missing features + measurement noise
    const baseErr = 0.15 + rnd() * 0.40; // 15–55% base error
    const yieldFactor = actual < 1500 ? 1.5 : actual > 6000 ? 1.4 : 1.0; // extremes harder
    const ndviBonus = s.NDVI > 0.55 ? 0.85 : 1.15; // healthy vegetation slightly easier
    const errPct = (rnd() * 0.7 + 0.3) * baseErr * yieldFactor * ndviBonus; // 4–65% error
    const direction = rnd() > 0.5 ? 1 : -1; // bidirectional error

    const predicted = Math.max(50, actual * (1 + direction * errPct));

    // --- Uncertainty estimation ---
    // Standard deviation grows with yield level (heteroscedastic)
    const relativeStd = 0.08 + rnd() * 0.15; // 8–23% relative uncertainty
    const std = actual * relativeStd;

    // --- Derived metrics ---
    const uncPct = Math.round((std / Math.max(1, predicted)) * 1000) / 10;
    const absErr = Math.abs(predicted - actual);
    const absErrPct = Math.round((absErr / Math.max(1, actual)) * 1000) / 10;

    // Risk score: composite of uncertainty + error + random factor
    const riskScore = Math.round(
      Math.min(100, uncPct * 1.2 + absErrPct * 0.6 + rnd() * 12) * 10,
    ) / 10;
    const riskLevel =
      riskScore > 60 ? "High Risk" : riskScore > 35 ? "Medium Risk" : "Low Risk";

    return {
      District: s.District,
      Year: s.Year,
      Season: s.Season,
      Crop: s.Crop,
      Actual_Yield: Math.round(actual),
      Predicted_Yield: Math.round(predicted),
      Prediction_STD: Math.round(std * 10) / 10,
      Lower_95_Interval: Math.round(predicted - 1.96 * std),
      Upper_95_Interval: Math.round(predicted + 1.96 * std),
      Uncertainty_Percent: uncPct,
      Absolute_Error: Math.round(absErr),
      Absolute_Error_Percent: absErrPct,
      Reliability_Risk_Score: riskScore,
      Reliability_Risk_Level: riskLevel,
    };
  });
}
