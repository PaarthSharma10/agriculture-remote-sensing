// Shared data shapes used across the dashboard. These mirror the CSV columns
// served by the FastAPI backend (data/ml/ml_dataset.csv and
// data/analysis/ml/final_evaluation/reliability_analysis/reliability_predictions.csv).

export interface Sample {
  District: string;
  Year: number;
  Season: string;
  Crop: string;
  Area_Hectare: number;
  Production_Tonnes: number;
  Yield_kg_ha: number;
  NDVI: number;
  NDWI: number;
  EVI: number;
  Rainfall_mm: number;
  Temperature_C: number;
  Soil_Moisture: number;
}

export interface Prediction {
  District: string;
  Year: number;
  Season: string;
  Crop: string;
  Actual_Yield: number;
  Predicted_Yield: number;
  Prediction_STD: number;
  Lower_95_Interval: number;
  Upper_95_Interval: number;
  Uncertainty_Percent: number;
  Absolute_Error: number;
  Absolute_Error_Percent: number;
  Reliability_Risk_Score: number;
  Reliability_Risk_Level: string;
}

export interface OverviewStats {
  samples: number;
  crops: number;
  districts: number;
  years: number[];
  seasons: string[];
  mae: number;
  rmse: number;
  r2: number;
  samplesPerYear: Array<{ label: string; value: number }>;
  topCrops: Array<{ label: string; value: number }>;
  seasonSplit: Array<{ label: string; value: number }>;
}

export type TabId =
  | "overview"
  | "crops"
  | "districts"
  | "predictions"
  | "maps"
  | "analytics"
  | "environment"
  | "reliability"
  | "data"
  | "reports"
  | "about"
  | "suitability"
  | "chatbot"
  | "compare"
  | "glossary";

export interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}