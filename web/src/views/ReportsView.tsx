/**
 * ReportsView.tsx — Downloadable CSV report generator.
 *
 * 6 report types: Crop, District, Seasonal, Model Performance, Data Summary, Map.
 * Each card has a Generate button that triggers CSV download with relevant data.
 */
import { useState } from "react";
import { downloadCsv, exportDataset } from "./shared";
import { cropList, districtList, mean } from "../stats";
import type { Prediction, Sample } from "../types";

interface ReportDef {
  id: string;
  icon: string;
  title: string;
  desc: string;
  accent: string;
}

const REPORTS: ReportDef[] = [
  { id: "crop", icon: "🌾", title: "Crop Report", desc: "Crop-wise yield analysis and trends", accent: "#16a34a" },
  { id: "district", icon: "🗺️", title: "District Report", desc: "District-wise performance and trends", accent: "#0e7a38" },
  { id: "seasonal", icon: "🌦️", title: "Seasonal Report", desc: "Season-wise analysis and comparison", accent: "#43a047" },
  { id: "model", icon: "🤖", title: "Model Performance Report", desc: "Overall model performance and metrics", accent: "#2e7d32" },
  { id: "data", icon: "📊", title: "Data Summary Report", desc: "Dataset overview and statistics", accent: "#388e3c" },
  { id: "map", icon: "📍", title: "Map Report", desc: "Yield and index maps", accent: "#1b5e20" },
];

export function ReportsView({
  samples,
  predictions,
}: {
  samples: Sample[];
  predictions: Prediction[];
}) {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = (r: ReportDef) => {
    setGenerating(r.id);
    setTimeout(() => setGenerating(null), 900);
    buildReport(r, samples, predictions);
  };

  return (
    <div className="report-grid">
      {REPORTS.map((r) => (
        <div
          key={r.id}
          className="report-card"
          style={{ borderLeft: "none" }}
        >
          <div className="report-accent" style={{ background: r.accent }} />
          <div className="report-icon-wrap" style={{ background: `${r.accent}18`, color: r.accent }}>
            {r.icon}
          </div>
          <div className="report-title">{r.title}</div>
          <div className="report-desc">{r.desc}</div>
          <button
            className="btn btn-primary btn-sm"
            style={{ background: r.accent }}
            onClick={() => generate(r)}
          >
            {generating === r.id ? "✓ Generated" : "⚙ Generate"}
          </button>
        </div>
      ))}
    </div>
  );
}

function buildReport(r: ReportDef, samples: Sample[], predictions: Prediction[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  switch (r.id) {
    case "crop": {
      const crops = cropList(samples);
      const rows = crops.map((c) => {
        const rs = samples.filter((s) => s.Crop === c);
        return [c, rs.length, Math.round(mean(rs.map((s) => s.Yield_kg_ha)))];
      });
      downloadCsv(`crop_report_${stamp}.csv`, ["Crop", "Samples", "Avg Yield (kg/ha)"], rows);
      break;
    }
    case "district": {
      const ds = districtList(samples);
      const rows = ds.map((d) => {
        const rs = samples.filter((s) => s.District === d);
        return [d, rs.length, Math.round(mean(rs.map((s) => s.Yield_kg_ha)))];
      });
      downloadCsv(`district_report_${stamp}.csv`, ["District", "Samples", "Avg Yield (kg/ha)"], rows);
      break;
    }
    case "seasonal": {
      const seasons = [...new Set(samples.map((s) => s.Season))].sort();
      const rows = seasons.map((se) => {
        const rs = samples.filter((s) => s.Season === se);
        return [se, rs.length, Math.round(mean(rs.map((s) => s.Yield_kg_ha)))];
      });
      downloadCsv(`seasonal_report_${stamp}.csv`, ["Season", "Samples", "Avg Yield (kg/ha)"], rows);
      break;
    }
    case "model": {
      const rows = predictions.map((p) => [
        p.District, p.Crop, p.Year, p.Season,
        Math.round(p.Actual_Yield), Math.round(p.Predicted_Yield),
        p.Absolute_Error_Percent.toFixed(2), p.Reliability_Risk_Level,
      ]);
      downloadCsv(
        `model_performance_${stamp}.csv`,
        ["District", "Crop", "Year", "Season", "Actual (kg/ha)", "Predicted (kg/ha)", "Error (%)", "Risk"],
        rows.slice(0, 500),
      );
      break;
    }
    case "data":
      exportDataset(samples as unknown as Array<Record<string, unknown>>, `data_summary_${stamp}.csv`);
      break;
    case "map": {
      const rows = samples.map((s) => [
        s.District, s.Year, s.Season, s.Crop,
        s.NDVI.toFixed(3), s.NDWI.toFixed(3), s.EVI.toFixed(3), Math.round(s.Yield_kg_ha),
      ]);
      downloadCsv(
        `map_report_${stamp}.csv`,
        ["District", "Year", "Season", "Crop", "NDVI", "NDWI", "EVI", "Yield (kg/ha)"],
        rows.slice(0, 500),
      );
      break;
    }
  }
}
