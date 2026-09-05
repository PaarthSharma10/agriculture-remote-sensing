/**
 * stats.ts — Statistical helper functions and data aggregation utilities.
 *
 * PURPOSE:
 *   Pure functions that transform raw Sample[] and Prediction[] arrays into
 *   the summary statistics used by each dashboard view.  No side effects.
 *
 * KEY FUNCTIONS:
 *   • overviewStats()    → total samples, crops, years, MAE/RMSE/R²
 *   • cropDetail()       → per-crop stats (avg yield by year, recent data)
 *   • districtDetail()   → per-district stats (samples, top crops)
 *   • predictionSummary() → filtered prediction averages
 *   • analyticsStats()   → yield distribution histogram, summary stats
 *   • reliabilityStats() → uncertainty histogram, reliability diagram
 *   • districtYields()   → average yield per district for maps
 *
 * MATH HELPERS:
 *   sum, mean, std, median, formatNumber, formatCompact, pct
 */
import type { OverviewStats, Prediction, Sample } from "./types";

// ---- small helpers ----------------------------------------------------------
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

export function std(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ---- aggregations -----------------------------------------------------------
export function overviewStats(
  samples: Sample[],
  predictions: Prediction[],
): OverviewStats {
  const years = [...new Set(samples.map((s) => s.Year))].sort((a, b) => a - b);
  const seasons = [...new Set(samples.map((s) => s.Season))].sort();
  const crops = new Set(samples.map((s) => s.Crop));
  const districts = new Set(samples.map((s) => s.District));

  const samplesPerYear = years.map((y) => ({
    label: String(y),
    value: samples.filter((s) => s.Year === y).length,
  }));

  const cropCounts = new Map<string, number>();
  for (const s of samples) cropCounts.set(s.Crop, (cropCounts.get(s.Crop) ?? 0) + 1);
  const topCrops = [...cropCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  const seasonCounts = new Map<string, number>();
  for (const s of samples) seasonCounts.set(s.Season, (seasonCounts.get(s.Season) ?? 0) + 1);
  const seasonSplit = [...seasonCounts.entries()].map(([label, value]) => ({ label, value }));

  const absErrors = predictions.map((p) => Math.abs(p.Predicted_Yield - p.Actual_Yield));
  const mae = mean(absErrors);
  const rmse = Math.sqrt(mean(absErrors.map((e) => e * e)));
  const actuals = predictions.map((p) => p.Actual_Yield);
  const preds = predictions.map((p) => p.Predicted_Yield);
  const actualMean = mean(actuals);
  const ssRes = sum(actuals.map((a, i) => (a - preds[i]) ** 2));
  const ssTot = sum(actuals.map((a) => (a - actualMean) ** 2));
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return {
    samples: samples.length,
    crops: crops.size,
    districts: districts.size,
    years,
    seasons,
    mae,
    rmse,
    r2,
    samplesPerYear,
    topCrops,
    seasonSplit,
  };
}

export function cropList(samples: Sample[]): string[] {
  return [...new Set(samples.map((s) => s.Crop))].sort();
}

export function districtList(samples: Sample[]): string[] {
  return [...new Set(samples.map((s) => s.District))].sort();
}

export interface CropDetail {
  crop: string;
  samples: number;
  years: number[];
  seasons: string[];
  avgYieldByYear: Array<{ label: string; value: number }>;
  recent: Sample[];
  districtsBySamples: Array<{ label: string; value: number }>;
  avgYield: number;
}

export function cropDetail(samples: Sample[], crop: string): CropDetail {
  const rows = samples.filter((s) => s.Crop === crop);
  const years = [...new Set(rows.map((s) => s.Year))].sort((a, b) => a - b);
  const seasons = [...new Set(rows.map((s) => s.Season))].sort();
  const avgYieldByYear = years.map((y) => {
    const ys = rows.filter((s) => s.Year === y);
    return { label: String(y), value: Math.round(mean(ys.map((s) => s.Yield_kg_ha))) };
  });
  const dist = new Map<string, number>();
  for (const s of rows) dist.set(s.District, (dist.get(s.District) ?? 0) + 1);
  const districtsBySamples = [...dist.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
  const recent = [...rows].sort((a, b) => b.Year - a.Year).slice(0, 8);
  return {
    crop,
    samples: rows.length,
    years,
    seasons,
    avgYieldByYear,
    recent,
    districtsBySamples,
    avgYield: Math.round(mean(rows.map((s) => s.Yield_kg_ha))),
  };
}

export interface DistrictDetail {
  district: string;
  samples: number;
  crops: number;
  years: number[];
  seasons: string[];
  samplesByYear: Array<{ label: string; value: number }>;
  topCrops: Array<{ label: string; value: number }>;
  avgYield: number;
}

export function districtDetail(samples: Sample[], district: string): DistrictDetail {
  const rows = samples.filter((s) => s.District === district);
  const years = [...new Set(rows.map((s) => s.Year))].sort((a, b) => a - b);
  const seasons = [...new Set(rows.map((s) => s.Season))].sort();
  const crops = new Set(rows.map((s) => s.Crop));
  const samplesByYear = years.map((y) => ({
    label: String(y),
    value: rows.filter((s) => s.Year === y).length,
  }));
  const cropCounts = new Map<string, number>();
  for (const s of rows) cropCounts.set(s.Crop, (cropCounts.get(s.Crop) ?? 0) + 1);
  const topCrops = [...cropCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
  return {
    district,
    samples: rows.length,
    crops: crops.size,
    years,
    seasons,
    samplesByYear,
    topCrops,
    avgYield: Math.round(mean(rows.map((s) => s.Yield_kg_ha))),
  };
}

export interface PredictionSummary {
  actual: number;
  predicted: number;
  difference: number;
  errorPct: number;
  count: number;
}

export function predictionSummary(
  predictions: Prediction[],
): PredictionSummary {
  const actual = Math.round(mean(predictions.map((p) => p.Actual_Yield)));
  const predicted = Math.round(mean(predictions.map((p) => p.Predicted_Yield)));
  const difference = predicted - actual;
  const errorPct = actual === 0 ? 0 : (difference / actual) * 100;
  return { actual, predicted, difference, errorPct, count: predictions.length };
}

export interface AnalyticsStats {
  avgYieldByYear: Array<{ label: string; value: number }>;
  yieldDistribution: Array<{ label: string; value: number }>;
  stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };
  topCropsByYield: Array<{ label: string; value: number }>;
}

export function analyticsStats(samples: Sample[]): AnalyticsStats {
  const yields = samples.map((s) => s.Yield_kg_ha);
  const years = [...new Set(samples.map((s) => s.Year))].sort((a, b) => a - b);
  const avgYieldByYear = years.map((y) => {
    const ys = samples.filter((s) => s.Year === y);
    return { label: String(y), value: Math.round(mean(ys.map((s) => s.Yield_kg_ha))) };
  });
  // Histogram with adaptive bin count.
  const maxY = Math.max(...yields);
  const minY = Math.min(...yields);
  const binCount = 12;
  const width = (maxY - minY) / binCount || 1;
  const bins = new Array<number>(binCount).fill(0);
  for (const y of yields) {
    const idx = Math.min(binCount - 1, Math.floor((y - minY) / width));
    bins[idx]++;
  }
  const yieldDistribution = bins.map((v, i) => ({
    label: `${Math.round(minY + i * width)}`,
    value: v,
  }));
  const cropMeans = new Map<string, number[]>();
  for (const s of samples) {
    if (!cropMeans.has(s.Crop)) cropMeans.set(s.Crop, []);
    cropMeans.get(s.Crop)!.push(s.Yield_kg_ha);
  }
  const topCropsByYield = [...cropMeans.entries()]
    .map(([label, vals]) => ({ label, value: Math.round(mean(vals)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  return {
    avgYieldByYear,
    yieldDistribution,
    stats: {
      mean: Math.round(mean(yields)),
      median: Math.round(median(yields)),
      min: Math.round(minY),
      max: Math.round(maxY),
      stdDev: Math.round(std(yields)),
    },
    topCropsByYield,
  };
}

export interface ReliabilityStats {
  meanUncertainty: number;
  r2: number;
  coverage95: number;
  calibrationSlope: number;
  uncertaintyHist: Array<{ label: string; value: number }>;
  reliabilityDiagram: Array<{ label: number; value: number }>;
  riskBreakdown: Array<{ label: string; value: number }>;
}

export function reliabilityStats(predictions: Prediction[]): ReliabilityStats {
  const meanUncertainty = mean(predictions.map((p) => p.Uncertainty_Percent * (p.Predicted_Yield / 100)));
  const actuals = predictions.map((p) => p.Actual_Yield);
  const preds = predictions.map((p) => p.Predicted_Yield);
  const am = mean(actuals);
  const ssRes = sum(actuals.map((a, i) => (a - preds[i]) ** 2));
  const ssTot = sum(actuals.map((a) => (a - am) ** 2));
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const inside = predictions.filter(
    (p) => p.Actual_Yield >= p.Lower_95_Interval && p.Actual_Yield <= p.Upper_95_Interval,
  ).length;
  const coverage95 = (inside / Math.max(1, predictions.length)) * 100;
  // Calibration slope from a simple linear fit of predicted vs actual.
  const pm = mean(preds);
  const cov = sum(preds.map((p, i) => (p - pm) * (actuals[i] - am)));
  const varP = sum(preds.map((p) => (p - pm) ** 2));
  const calibrationSlope = varP === 0 ? 1 : cov / varP;

  const unc = predictions.map((p) => p.Uncertainty_Percent);
  const maxU = Math.max(...unc);
  const bins = 10;
  const width = (maxU || 1) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const u of unc) {
    counts[Math.min(bins - 1, Math.floor(u / width))]++;
  }
  const uncertaintyHist = counts.map((v, i) => ({
    label: `${Math.round(i * width)}%`,
    value: v,
  }));

  // Reliability diagram: bin by predicted probability (1 - uncertainty).
  const binned = new Map<number, { n: number; hit: number }>();
  for (const p of predictions) {
    const conf = 1 - p.Uncertainty_Percent / 100;
    const bin = Math.min(9, Math.floor(conf * 10));
    const entry = binned.get(bin) ?? { n: 0, hit: 0 };
    entry.n++;
    if (p.Absolute_Error_Percent <= 10) entry.hit++;
    binned.set(bin, entry);
  }
  const reliabilityDiagram = [...binned.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bin, e]) => ({
      label: Math.round((bin + 0.5) * 10) / 100,
      value: e.n === 0 ? 0 : e.hit / e.n,
    }));

  const risk = new Map<string, number>();
  for (const p of predictions) {
    const key = p.Reliability_Risk_Level || "Unknown";
    risk.set(key, (risk.get(key) ?? 0) + 1);
  }
  const riskBreakdown = [...risk.entries()].map(([label, value]) => ({ label, value }));
  return { meanUncertainty, r2, coverage95, calibrationSlope, uncertaintyHist, reliabilityDiagram, riskBreakdown };
}

export interface DistrictYield {
  district: string;
  yield: number;
  samples: number;
}

export function districtYields(samples: Sample[]): DistrictYield[] {
  const map = new Map<string, { yields: number[]; samples: number }>();
  for (const s of samples) {
    const e = map.get(s.District) ?? { yields: [], samples: 0 };
    e.yields.push(s.Yield_kg_ha);
    e.samples++;
    map.set(s.District, e);
  }
  return [...map.entries()].map(([district, e]) => ({
    district,
    yield: Math.round(mean(e.yields)),
    samples: e.samples,
  }));
}