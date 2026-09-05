/**
 * EnvironmentView.tsx — Multi-metric environmental trend comparison.
 *
 * SVG multi-line chart showing NDVI, NDWI, EVI, Rainfall, Soil Moisture trends
 * across years (each normalized to 0–1).  Metric×Year comparison grid with
 * color-coded cells.  Raw averages table.
 */
import { useMemo, useState } from "react";
import { cropList, districtList, mean } from "../stats";
import { FilterBar, FilterSelect } from "./shared";
import type { Sample } from "../types";

interface MetricDef {
  key: keyof Pick<Sample, "NDVI" | "NDWI" | "EVI" | "Rainfall_mm" | "Soil_Moisture">;
  label: string;
  short: string;
  color: string;
  unit: string;
}

const METRICS: MetricDef[] = [
  { key: "NDVI", label: "NDVI", short: "NDVI", color: "#16a34a", unit: "index" },
  { key: "NDWI", label: "NDWI", short: "NDWI", color: "#2196f3", unit: "index" },
  { key: "EVI", label: "EVI", short: "EVI", color: "#ff9800", unit: "index" },
  { key: "Rainfall_mm", label: "Rainfall", short: "Rain", color: "#03a9f4", unit: "mm" },
  { key: "Soil_Moisture", label: "Soil Moisture", short: "Soil", color: "#8d6e63", unit: "frac" },
];

function metricSeries(samples: Sample[]) {
  const years = [...new Set(samples.map((s) => s.Year))].sort((a, b) => a - b);
  return METRICS.map((m) => ({
    metric: m,
    values: years.map((y) => {
      const rows = samples.filter((s) => s.Year === y);
      return { year: y, value: rows.length ? mean(rows.map((r) => r[m.key] as number)) : 0 };
    }),
  }));
}

export function EnvironmentView({ samples }: { samples: Sample[] }) {
  const crops = useMemo(() => cropList(samples), [samples]);
  const districts = useMemo(() => districtList(samples), [samples]);
  const seasons = useMemo(() => [...new Set(samples.map((s) => s.Season))].sort(), [samples]);

  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [season, setSeason] = useState("");

  const filtered = useMemo(() => {
    let rows = samples;
    if (crop) rows = rows.filter((s) => s.Crop === crop);
    if (district) rows = rows.filter((s) => s.District === district);
    if (season) rows = rows.filter((s) => s.Season === season);
    return rows;
  }, [samples, crop, district, season]);

  const series = useMemo(() => metricSeries(filtered), [filtered]);
  const years = series[0]?.values.map((v) => v.year) ?? [];

  const all = (vals: string[], placeholder: string) => [
    { value: "", label: placeholder },
    ...vals.map((v) => ({ value: v, label: v })),
  ];

  return (
    <div>
      {/* Filter bar */}
      <FilterBar>
        <FilterSelect label="Crop" options={all(crops, "All Crops")} value={crop} onChange={setCrop} />
        <FilterSelect label="District" options={all(districts, "All Districts")} value={district} onChange={setDistrict} />
        <FilterSelect label="Season" options={all(seasons, "All Seasons")} value={season} onChange={setSeason} />
      </FilterBar>

      {/* Multi-line trend chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Environmental Trends Across Years</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>each metric normalized to its own 0–1 range</div>
        </div>
        <div className="card-body" style={{ height: 300 }}>
          <MultiLineChart series={series} years={years} />
        </div>
      </div>

      {/* Metric × Year comparison grid */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">3D Metric × Year Comparison</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>hover cells for raw values</div>
        </div>
        <div className="card-body" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Metric</th>
                {years.map((y) => (
                  <th key={y} style={{ textAlign: "center" }}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const vals = s.values.map((v) => v.value);
                const minV = Math.min(...vals);
                const maxV = Math.max(...vals);
                const range = maxV - minV || 1;
                return (
                  <tr key={s.metric.key}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.metric.color, marginRight: 6 }} />
                      {s.metric.label}
                    </td>
                    {s.values.map((v) => {
                      const t = (v.value - minV) / range;
                      return (
                        <td key={v.year} style={{ textAlign: "center" }}>
                          <div
                            title={`${s.metric.label} · ${v.year}: ${v.value >= 100 ? Math.round(v.value).toLocaleString() : v.value.toFixed(3)} ${s.metric.unit}`}
                            style={{
                              height: 28,
                              borderRadius: 3,
                              background: `${s.metric.color}${Math.round(30 + t * 70).toString(16).padStart(2, "0")}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              color: "#374151",
                              fontWeight: 500,
                              minWidth: 50,
                              cursor: "default",
                            }}
                          >
                            {v.value >= 100 ? Math.round(v.value).toLocaleString() : v.value.toFixed(3)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw averages table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Raw Averages by Metric and Year</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            mean values for the selected filters ({filtered.length.toLocaleString()} samples)
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {years.map((y) => <th key={y}>{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {series.map((s) => (
                  <tr key={s.metric.key}>
                    <td style={{ fontWeight: 500 }}>{s.metric.label} ({s.metric.unit})</td>
                    {s.values.map((v) => (
                      <td key={v.year}>{v.value >= 100 ? Math.round(v.value).toLocaleString() : v.value.toFixed(3)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiLineChart({ series, years }: { series: Array<{ metric: MetricDef; values: Array<{ year: number; value: number }> }>; years: number[] }) {
  const w = 700, h = 240, pad = 50;

  // Normalize each metric to 0-1
  const normalized = series.map((s) => {
    const vals = s.values.map((v) => v.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    return {
      ...s,
      normValues: s.values.map((v) => ({ year: v.year, norm: (v.value - minV) / range })),
    };
  });

  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart" style={{ flex: 1 }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = h - pad - t * (h - pad * 2);
          return (
            <g key={t}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={pad - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{(t * 100).toFixed(0)}%</text>
            </g>
          );
        })}
        {/* Year labels */}
        {years.map((y, i) => {
          const x = pad + (i / Math.max(1, years.length - 1)) * (w - pad * 2);
          return <text key={y} x={x} y={h - pad + 14} textAnchor="middle" fontSize={10} fill="#6b7280">{y}</text>;
        })}
        {/* Lines */}
        {normalized.map((s) => {
          const pts = s.normValues.map((v, i) => {
            const x = pad + (i / Math.max(1, years.length - 1)) * (w - pad * 2);
            const y = h - pad - v.norm * (h - pad * 2);
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          }).join(" ");
          return <path key={s.metric.key} d={pts} fill="none" stroke={s.metric.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {/* Dots */}
        {normalized.map((s) =>
          s.normValues.map((v, i) => {
            const x = pad + (i / Math.max(1, years.length - 1)) * (w - pad * 2);
            const y = h - pad - v.norm * (h - pad * 2);
            return <circle key={`${s.metric.key}-${i}`} cx={x} cy={y} r={3} fill={s.metric.color} />;
          })
        )}
      </svg>
      {/* Legend */}
      <div className="donut-legend" style={{ justifyContent: "center" }}>
        {series.map((s) => (
          <div className="donut-legend-item" key={s.metric.key}>
            <span className="donut-swatch" style={{ background: s.metric.color }} />
            <span style={{ fontSize: 12 }}>{s.metric.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
