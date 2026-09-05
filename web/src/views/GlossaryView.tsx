/**
 * GlossaryView.tsx — Technical glossary for agricultural remote sensing terms.
 *
 * PURPOSE:
 *   Defines key technical terms used throughout the dashboard: remote sensing
 *   indices (NDVI, NDWI, EVI), statistical metrics (MAE, RMSE, R²),
 *   agricultural terms (Kharif, Rabi, yield), and ML concepts.
 *
 * FEATURES:
 *   • Categorized terms: Remote Sensing, Statistics, Agriculture, ML/AI
 *   • Searchable filter to find terms quickly
 *   • Each term shows abbreviation, full name, and plain-English definition
 *   • Color-coded categories for visual distinction
 */

import { useMemo, useState } from "react";

interface GlossaryTerm {
  term: string;
  abbr?: string;
  category: string;
  definition: string;
  formula?: string;
  use?: string;
}

const GLOSSARY: GlossaryTerm[] = [
  // ── Remote Sensing Indices ──
  {
    term: "Normalized Difference Vegetation Index",
    abbr: "NDVI",
    category: "Remote Sensing",
    definition: "A measure of vegetation health derived from satellite imagery. It uses the difference between near-infrared (NIR) and red light reflectance. Healthy vegetation reflects more NIR and absorbs more red light, resulting in higher NDVI values.",
    formula: "NDVI = (NIR − Red) / (NIR + Red)",
    use: "Ranges from −1 to +1. Values above 0.5 indicate healthy, dense vegetation. Values below 0.2 suggest bare soil, water, or stressed crops.",
  },
  {
    term: "Normalized Difference Water Index",
    abbr: "NDWI",
    category: "Remote Sensing",
    definition: "An index that measures the water content in vegetation and soil using green and near-infrared light bands. Higher values indicate more water content.",
    formula: "NDWI = (Green − NIR) / (Green + NIR)",
    use: "Ranges from −1 to +1. Positive values indicate water bodies or high moisture. Negative values suggest dry or stressed vegetation.",
  },
  {
    term: "Enhanced Vegetation Index",
    abbr: "EVI",
    category: "Remote Sensing",
    definition: "An improved vegetation index that reduces atmospheric effects and soil background signals compared to NDVI. It is more sensitive in areas with dense vegetation where NDVI may saturate.",
    formula: "EVI = G × (NIR − Red) / (NIR + C₁×Red − C₂×Blue + L)",
    use: "Ranges from −1 to +1. Better than NDVI for dense canopy areas. Commonly used with MODIS satellite data for large-scale crop monitoring.",
  },
  {
    term: "Soil Adjusted Vegetation Index",
    abbr: "SAVI",
    category: "Remote Sensing",
    definition: "A vegetation index that corrects for the influence of soil brightness in areas where vegetation cover is low, using a soil brightness correction factor (L).",
    formula: "SAVI = ((NIR − Red) / (NIR + Red + L)) × (1 + L)",
    use: "Used in arid and semi-arid regions where bare soil is visible between crop rows. L typically = 0.5.",
  },
  {
    term: "Leaf Area Index",
    abbr: "LAI",
    category: "Remote Sensing",
    definition: "A dimensionless quantity that characterizes plant canopies. It is defined as the one-sided green leaf area per unit ground surface area.",
    use: "Typically ranges from 0 (bare ground) to 6+ (dense forest). For crops, LAI of 2–4 is common during peak growth.",
  },
  {
    term: "Normalized Difference Built-up Index",
    abbr: "NDBI",
    category: "Remote Sensing",
    definition: "An index used to map urban/built-up areas by highlighting built-up surfaces using shortwave infrared (SWIR) and near-infrared (NIR) bands.",
    formula: "NDBI = (SWIR − NIR) / (SWIR + NIR)",
    use: "Higher values indicate urban or built-up land. Useful for monitoring agricultural land conversion.",
  },
  {
    term: "Crop Water Stress Index",
    abbr: "CWSI",
    category: "Remote Sensing",
    definition: "An index that quantifies plant water stress based on canopy temperature measurements. It helps determine irrigation requirements.",
    use: "Ranges from 0 (no stress) to 1 (severe stress). Values above 0.6 indicate crops need immediate irrigation.",
  },
  {
    term: "Land Surface Temperature",
    abbr: "LST",
    category: "Remote Sensing",
    definition: "The radiative temperature of the land surface derived from thermal infrared satellite data. It reflects the actual surface temperature rather than air temperature.",
    use: "Used for crop stress detection, drought monitoring, and evapotranspiration estimation.",
  },

  // ── Agricultural Terms ──
  {
    term: "Kharif Season",
    category: "Agriculture",
    definition: "The monsoon cropping season in India (June–October). Crops are sown at the beginning of the monsoon and harvested at the end. Also known as the 'wet season' or 'autumn season'.",
    use: "Major Kharif crops in Punjab: Paddy (Rice), Cotton, Maize, Soybean, Bajra, Moong, Urad.",
  },
  {
    term: "Rabi Season",
    category: "Agriculture",
    definition: "The winter cropping season in India (October–March). Crops are sown after the monsoon and harvested in spring. Also known as the 'winter season'.",
    use: "Major Rabi crops in Punjab: Wheat, Mustard, Barley, Gram, Peas, Linseed, Rapeseed.",
  },
  {
    term: "Crop Yield",
    category: "Agriculture",
    definition: "The amount of agricultural production harvested per unit of land area. Typically measured in kilograms per hectare (kg/ha) or tonnes per hectare (t/ha).",
    formula: "Yield = Total Production / Cultivated Area",
    use: "The primary output variable predicted by this dashboard's ML model.",
  },
  {
    term: "Hectare",
    category: "Agriculture",
    definition: "A metric unit of area equal to 10,000 square meters (approximately 2.47 acres). The standard unit for measuring agricultural land in India.",
    use: "All yield values in this dashboard are reported in kg per hectare (kg/ha).",
  },
  {
    term: "Intercropping",
    category: "Agriculture",
    definition: "The practice of growing two or more crops simultaneously in the same field to maximize land use efficiency and reduce risk.",
    use: "Common in Punjab: wheat–moong, cotton–moong, sugarcane–potato.",
  },
  {
    term: "Crop Rotation",
    category: "Agriculture",
    definition: "The practice of growing different types of crops on the same land in sequential seasons to improve soil health, reduce pests, and increase yields.",
    use: "The wheat–paddy rotation is the dominant system in Punjab, though it raises sustainability concerns.",
  },
  {
    term: "Evapotranspiration",
    abbr: "ET",
    category: "Agriculture",
    definition: "The combined process of water evaporation from the soil surface and transpiration from plant leaves. It represents the total water demand of a crop.",
    use: "Critical for irrigation planning. PET (Potential ET) is estimated using weather data.",
  },
  {
    term: "Soil Moisture",
    category: "Agriculture",
    definition: "The water content held in the soil between field capacity and wilting point. It determines water availability for crop roots.",
    use: "Measured as volumetric water content (%). Typically 0.10–0.40 for agricultural soils.",
  },
  {
    term: "Plant Population Density",
    category: "Agriculture",
    definition: "The number of plants per unit area (e.g., plants per hectare or plants per square meter).",
    use: "Optimal density varies by crop: Wheat 3–4 million/ha, Paddy 2.5–3.5 million/ha.",
  },

  // ── Statistical Metrics ──
  {
    term: "Mean Absolute Error",
    abbr: "MAE",
    category: "Statistics",
    definition: "The average of the absolute differences between predicted and actual values. It measures prediction accuracy in the same units as the target variable.",
    formula: "MAE = (1/n) × Σ|predicted − actual|",
    use: "Lower MAE means better predictions. This dashboard reports MAE in kg/ha. A MAE of 1,979 kg/ha means predictions are off by ~2 tonnes/ha on average.",
  },
  {
    term: "Root Mean Square Error",
    abbr: "RMSE",
    category: "Statistics",
    definition: "The square root of the average of squared differences between predicted and actual values. It penalizes large errors more heavily than MAE.",
    formula: "RMSE = √((1/n) × Σ(predicted − actual)²)",
    use: "Always ≥ MAE. RMSE of 6,870 kg/ha indicates some large prediction errors exist (e.g., for high-yield crops like sugarcane).",
  },
  {
    term: "Coefficient of Determination",
    abbr: "R²",
    category: "Statistics",
    definition: "A statistical measure that represents the proportion of variance in the dependent variable that is predictable from the independent variables.",
    formula: "R² = 1 − (SS_res / SS_tot)",
    use: "Ranges from 0 to 1. R² = 0.87 means the model explains 87% of yield variability. For crop yield, 0.70–0.85 is considered good; above 0.90 may indicate overfitting.",
  },
  {
    term: "Heteroscedasticity",
    category: "Statistics",
    definition: "A situation where the variance of prediction errors is not constant across all levels of the predicted variable. In crop yield, errors tend to be larger for very high or very low yields.",
    use: "This dashboard's model shows heteroscedastic errors — predictions are more accurate for typical yields than extreme values.",
  },
  {
    term: "Confidence Interval",
    abbr: "CI",
    category: "Statistics",
    definition: "A range of values derived from the model that is likely to contain the true value with a specified probability (typically 95%).",
    use: "The 95% prediction interval means we expect 95% of actual yields to fall within the reported range.",
  },
  {
    term: "Calibration",
    category: "Statistics",
    definition: "The degree to which predicted probabilities match observed frequencies. A well-calibrated model's predicted 80% confidence intervals contain approximately 80% of actual values.",
    use: "The Reliability Diagram in the dashboard shows how well calibrated our prediction intervals are.",
  },
  {
    term: "Outlier",
    category: "Statistics",
    definition: "A data point that differs significantly from other observations. In crop data, outliers may result from unusual weather, pests, or data entry errors.",
    use: "Yields above 50,000 kg/ha (like sugarcane) are natural outliers compared to wheat (~4,400 kg/ha).",
  },

  // ── Machine Learning ──
  {
    term: "Gradient Boosting",
    abbr: "GBM",
    category: "Machine Learning",
    definition: "An ensemble ML technique that builds models sequentially, where each new model corrects errors made by previous models. Common implementations include XGBoost, LightGBM, and CatBoost.",
    use: "This dashboard's yield prediction model uses gradient boosting, which is the state-of-the-art for tabular agricultural data.",
  },
  {
    term: "Overfitting",
    category: "Machine Learning",
    definition: "When a model learns the training data too well, including noise and random fluctuations, resulting in excellent training performance but poor generalization to new data.",
    use: "An R² of 1.00 on training data is a red flag for overfitting. This is why we report test R² = 0.87.",
  },
  {
    term: "Feature",
    category: "Machine Learning",
    definition: "An input variable used by the ML model to make predictions. In this dashboard, features include NDVI, NDWI, EVI, rainfall, temperature, soil moisture, crop type, and district.",
    use: "The model uses 8+ features to predict crop yield. Feature importance analysis reveals which variables matter most.",
  },
  {
    term: "Training Set / Test Set",
    category: "Machine Learning",
    definition: "The dataset is split into a training set (used to build the model) and a test set (used to evaluate performance on unseen data). Common split ratios are 80/20 or 70/30.",
    use: "This dashboard uses an 80/20 train-test split. All reported metrics (MAE, RMSE, R²) are on the test set.",
  },
  {
    term: "Prediction Interval",
    category: "Machine Learning",
    definition: "A range within which a future observation is expected to fall with a specified probability (typically 95%). Unlike confidence intervals, prediction intervals account for both model uncertainty and data noise.",
    use: "Reported as Lower_95 and Upper_95 in the predictions table. Wide intervals indicate high uncertainty.",
  },
  {
    term: "Data Leakage",
    category: "Machine Learning",
    definition: "When information from outside the training dataset inadvertently leaks into the model training process, causing artificially high performance metrics.",
    use: "An R² of exactly 1.00 often signals data leakage. We avoid this by using a strict train/test split.",
  },
  {
    term: "Ensemble Method",
    category: "Machine Learning",
    definition: "A technique that combines multiple models to produce better predictions than any single model alone. Examples include bagging, boosting, and stacking.",
    use: "Gradient boosting (used here) is an ensemble method. Random Forest is another popular ensemble for agricultural prediction.",
  },
  {
    term: "Bias-Variance Tradeoff",
    category: "Machine Learning",
    definition: "The balance between a model's ability to fit training data (low bias) and its sensitivity to fluctuations in training data (low variance). Complex models have low bias but high variance.",
    use: "This dashboard's R² = 0.87 represents a good balance — complex enough to capture patterns, general enough to predict new data.",
  },
];

const CATEGORIES = [...new Set(GLOSSARY.map((g) => g.category))];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Remote Sensing": { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  "Agriculture": { bg: "#fefce8", text: "#854d0e", border: "#fde68a" },
  "Statistics": { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  "Machine Learning": { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff" },
};

export function GlossaryView(_props?: { lang?: string }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let terms = GLOSSARY;
    if (activeCategory) terms = terms.filter((g) => g.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      terms = terms.filter(
        (g) =>
          g.term.toLowerCase().includes(q) ||
          (g.abbr && g.abbr.toLowerCase().includes(q)) ||
          g.definition.toLowerCase().includes(q)
      );
    }
    return terms;
  }, [search, activeCategory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Synopsis */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #bbf7d0" }}>
        <div className="card-body" style={{ padding: "10px 14px", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
          <b>📖 Technical Glossary</b> — Definitions of key terms used throughout the dashboard,
          including remote sensing indices (NDVI, NDWI, EVI), statistical metrics (MAE, RMSE, R²),
          agricultural concepts (Kharif, Rabi, yield), and machine learning terminology.
          Use the search box or category filters to find specific terms.
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb",
              borderRadius: 6, fontSize: 13, outline: "none",
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {filtered.length} terms
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          className={`mode-tab${!activeCategory ? " active" : ""}`}
          onClick={() => setActiveCategory(null)}
          style={{ fontSize: 12 }}
        >
          All ({GLOSSARY.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = GLOSSARY.filter((g) => g.category === cat).length;
          const colors = CATEGORY_COLORS[cat] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" };
          return (
            <button
              key={cat}
              className={`mode-tab${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              style={{
                fontSize: 12,
                ...(activeCategory === cat ? { background: colors.text, color: "#fff" } : { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }),
              }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Terms */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((g) => {
          const colors = CATEGORY_COLORS[g.category] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" };
          return (
            <div
              key={g.abbr ?? g.term}
              className="card scale-in"
              style={{ borderLeft: `4px solid ${colors.text}`, overflow: "visible" }}
            >
              <div className="card-body" style={{ padding: "12px 16px" }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  {g.abbr && (
                    <span style={{
                      background: colors.text, color: "#fff",
                      padding: "2px 8px", borderRadius: 4, fontSize: 13,
                      fontWeight: 700, letterSpacing: 0.5,
                    }}>
                      {g.abbr}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                    {g.term}
                  </span>
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 10,
                    background: colors.bg, color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}>
                    {g.category}
                  </span>
                </div>

                {/* Definition */}
                <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: "0 0 6px 0" }}>
                  {g.definition}
                </p>

                {/* Formula */}
                {g.formula && (
                  <div style={{
                    fontFamily: "monospace", fontSize: 12, color: "#1e40af",
                    background: "#eff6ff", padding: "4px 10px", borderRadius: 4,
                    display: "inline-block", marginBottom: 6,
                  }}>
                    {g.formula}
                  </div>
                )}

                {/* Usage */}
                {g.use && (
                  <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, fontStyle: "italic" }}>
                    💡 {g.use}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, color: "#9ca3af" }}>
              No terms found matching "{search}". Try a different search.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
