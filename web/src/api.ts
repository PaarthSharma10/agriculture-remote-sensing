/**
 * api.ts — Data loading layer for the Agri RS dashboard.
 *
 * STRATEGY:
 *   0. If VITE_DATA_MODE === "demo", skip the network entirely and serve the
 *      synthetic dataset (see .env.production). Used when production should
 *      show the full 2021–2025 / 17-crop grid that the real observations
 *      (2021–2022, 5 crops) cannot fill yet.
 *   1. Otherwise, try fetching /api/dataset and /api/predictions from the
 *      FastAPI backend (Vite proxies /api to 127.0.0.1:8000; Vercel rewrites
 *      /api to agri-rs-api.vercel.app).
 *   2. If either request fails or returns invalid data, fall back to demo.ts
 *      which generates a deterministic synthetic dataset.
 *   3. The `live` flag indicates whether real backend data was loaded.
 *
 * TIMEOUT: Each fetch aborts after 6 seconds so a fully offline setup still
 * reaches the demo fallback instead of hanging. It is longer than a purely
 * local backend needs (those answer in tens of milliseconds) because the
 * production API runs as a Vercel function: a cold start plus the /api proxy
 * hop can exceed 3 seconds, which used to abort the request and silently
 * drop the dashboard back to synthetic data.
 */
import type { Prediction, Sample } from "./types";
import { generatePredictions, generateSamples } from "./demo";

// "demo" short-circuits the network; anything else (including unset) is live.
const DATA_MODE = (import.meta.env.VITE_DATA_MODE ?? "live") as string;

function demoData(): DashboardData {
  const samples = generateSamples();
  return { samples, predictions: generatePredictions(samples), live: false };
}

export interface DashboardData {
  samples: Sample[];
  predictions: Prediction[];
  live: boolean;
}

// Fetch one endpoint, returning undefined on any failure so callers can
// fall back to the demo dataset.
async function fetchJson(url: string): Promise<unknown | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    return (await res.json()) as unknown;
  } catch {
    return undefined;
  }
}

function parseSamples(raw: unknown): Sample[] | undefined {
  let arr: unknown = raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const body = raw as { dataset?: unknown };
    arr = body.dataset;
  }
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const rows = arr as Array<Record<string, unknown>>;
  if (!("Yield_kg_ha" in (rows[0] ?? {}))) return undefined;
  return rows.map((r) => ({
    District: String(r.District ?? ""),
    Year: Number(r.Year),
    Season: String(r.Season ?? ""),
    Crop: String(r.Crop ?? ""),
    Area_Hectare: Number(r.Area_Hectare ?? 0),
    Production_Tonnes: Number(r.Production_Tonnes ?? 0),
    Yield_kg_ha: Number(r.Yield_kg_ha ?? 0),
    NDVI: Number(r.NDVI ?? 0),
    NDWI: Number(r.NDWI ?? 0),
    EVI: Number(r.EVI ?? 0),
    Rainfall_mm: Number(r.Rainfall_mm ?? 0),
    Temperature_C: Number(r.Temperature_C ?? 0),
    Soil_Moisture: Number(r.Soil_Moisture ?? 0),
  }));
}

function parsePredictions(raw: unknown): Prediction[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const body = raw as { predictions?: unknown };
  const arr = Array.isArray(body.predictions) ? body.predictions : undefined;
  if (!arr || arr.length === 0) return undefined;
  return (arr as Array<Record<string, unknown>>).map((r) => ({
    District: String(r.District ?? ""),
    Year: Number(r.Year),
    Season: String(r.Season ?? ""),
    Crop: String(r.Crop ?? ""),
    Actual_Yield: Number(r.Actual_Yield ?? 0),
    Predicted_Yield: Number(r.Predicted_Yield ?? 0),
    Prediction_STD: Number(r.Prediction_STD ?? 0),
    Lower_95_Interval: Number(r.Lower_95_Interval ?? 0),
    Upper_95_Interval: Number(r.Upper_95_Interval ?? 0),
    Uncertainty_Percent: Number(r.Uncertainty_Percent ?? 0),
    Absolute_Error: Number(r.Absolute_Error ?? 0),
    Absolute_Error_Percent: Number(r.Absolute_Error_Percent ?? 0),
    Reliability_Risk_Score: Number(r.Reliability_Risk_Score ?? 0),
    Reliability_Risk_Level: String(r.Reliability_Risk_Level ?? ""),
  }));
}

export async function loadDashboard(): Promise<DashboardData> {
  // Forced demo mode: no /api calls at all, so the dashboard renders the full
  // synthetic grid even when the backend is reachable.
  if (DATA_MODE === "demo") return demoData();

  // Try the backend first (Vite proxies /api to 127.0.0.1:8000).
  const [samplesRaw, predsRaw] = await Promise.all([
    fetchJson("/api/dataset"),
    fetchJson("/api/predictions"),
  ]);

  const samples = parseSamples(samplesRaw);
  const predictions = parsePredictions(predsRaw);

  if (samples && predictions && samples.length === predictions.length) {
    return { samples, predictions, live: true };
  }

  // Fallback: deterministic demo dataset so the UI always renders.
  return demoData();
}