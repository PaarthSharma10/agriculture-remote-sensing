/**
 * AnalyticsView.tsx — Deep analytics with working sub-tabs and comprehensive charts.
 *
 * SUB-TABS:
 *   • Yield Trends — line chart, distribution histogram, summary stats
 *   • Crop Analytics — crop-wise yield comparison, top/bottom performers
 *   • District Analytics — district yield heatmap, per-district stats
 *   • Seasonal Analytics — Kharif vs Rabi comparison, seasonal patterns
 */

import { useMemo, useState } from "react";
import { analyticsStats, cropList, districtList, mean } from "../stats";
import { FilterBar, FilterSelect } from "./shared";
import type { Sample } from "../types";
import { yieldColor } from "../theme";
import { CorrelationHeatmap } from "../CorrelationHeatmap";

const TABS = ["Yield Trends", "Crop Analytics", "District Analytics", "Seasonal Analytics", "Correlations"] as const;
type Tab = (typeof TABS)[number];

export function AnalyticsView({ samples }: { samples: Sample[] }) {
  const [tab, setTab] = useState<Tab>("Yield Trends");
  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [year, setYear] = useState("");
  const [season, setSeason] = useState("");

  const crops = useMemo(() => cropList(samples), [samples]);
  const districts = useMemo(() => districtList(samples), [samples]);
  const years = useMemo(() => [...new Set(samples.map((s) => s.Year))].sort((a, b) => b - a), [samples]);
  const seasons = useMemo(() => [...new Set(samples.map((s) => s.Season))].sort(), [samples]);

  const filtered = useMemo(() => {
    let rows = samples;
    if (crop) rows = rows.filter((s) => s.Crop === crop);
    if (district) rows = rows.filter((s) => s.District === district);
    if (year) rows = rows.filter((s) => String(s.Year) === year);
    if (season) rows = rows.filter((s) => s.Season === season);
    return rows;
  }, [samples, crop, district, year, season]);

  const stats = useMemo(() => analyticsStats(filtered), [filtered]);
  const all = (vals: string[], placeholder: string) => [{ value: "", label: placeholder }, ...vals.map((v) => ({ value: v, label: v }))];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="tabs" style={{ marginBottom: 12 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Filter bar */}
      <FilterBar>
        <FilterSelect label="Crop" options={all(crops, "All Crops")} value={crop} onChange={setCrop} />
        <FilterSelect label="District" options={all(districts, "All Districts")} value={district} onChange={setDistrict} />
        <FilterSelect label="Year" options={all(years.map(String), "All Years")} value={year} onChange={setYear} />
        <FilterSelect label="Season" options={all(seasons, "All Seasons")} value={season} onChange={setSeason} />
      </FilterBar>

      {/* Tab content */}
      {tab === "Yield Trends" && <YieldTrendsTab stats={stats} />}
      {tab === "Crop Analytics" && <CropAnalyticsTab samples={filtered} crops={crops} />}
      {tab === "District Analytics" && <DistrictAnalyticsTab samples={filtered} districts={districts} />}
      {tab === "Seasonal Analytics" && <SeasonalAnalyticsTab samples={filtered} />}
      {tab === "Correlations" && <CorrelationsTab samples={filtered} />}
    </div>
  );
}

// ── Yield Trends Tab ──────────────────────────────────────────────────────
function YieldTrendsTab({ stats }: { stats: ReturnType<typeof analyticsStats> }) {
  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header"><div className="card-title">Average Yield (kg/ha) Over Years</div></div>
        <div className="card-body" style={{ height: 220 }}>
          <LineChart data={stats.avgYieldByYear} unit="kg/ha" color="#22c55e" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Yield Distribution (All Years)</div></div>
        <div className="card-body" style={{ height: 220 }}>
          <BarChartSimple data={stats.yieldDistribution} color="#22c55e" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Summary Statistics</div></div>
        <div className="card-body">
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="metric-card"><div className="metric-value">{stats.stats.mean.toLocaleString()}</div><div className="metric-label">Mean (kg/ha)</div></div>
            <div className="metric-card"><div className="metric-value">{stats.stats.median.toLocaleString()}</div><div className="metric-label">Median (kg/ha)</div></div>
            <div className="metric-card"><div className="metric-value">{stats.stats.stdDev.toLocaleString()}</div><div className="metric-label">Std Dev</div></div>
            <div className="metric-card"><div className="metric-value">{stats.stats.min.toLocaleString()}</div><div className="metric-label">Min (kg/ha)</div></div>
            <div className="metric-card"><div className="metric-value">{stats.stats.max.toLocaleString()}</div><div className="metric-label">Max (kg/ha)</div></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Top Crops by Average Yield</div></div>
        <div className="card-body">
          {stats.topCropsByYield.map((c, i) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 16 }}>{i + 1}.</span>
              <div style={{ height: 8, borderRadius: 4, background: yieldColor(c.value / Math.max(...stats.topCropsByYield.map((x) => x.value), 1)), width: `${Math.round((c.value / Math.max(...stats.topCropsByYield.map((x) => x.value), 1)) * 100)}%`, maxWidth: 120 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>{c.label}</span>
              <span style={{ fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>{c.value.toLocaleString()} kg/ha</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Crop Analytics Tab ────────────────────────────────────────────────────
function CropAnalyticsTab({ samples, crops }: { samples: Sample[]; crops: string[] }) {
  const cropStats = useMemo(() => {
    return crops.map((c) => {
      const rows = samples.filter((s) => s.Crop === c);
      const yields = rows.map((s) => s.Yield_kg_ha);
      return {
        name: c,
        samples: rows.length,
        avgYield: yields.length ? Math.round(mean(yields)) : 0,
        min: yields.length ? Math.round(Math.min(...yields)) : 0,
        max: yields.length ? Math.round(Math.max(...yields)) : 0,
      };
    }).sort((a, b) => b.avgYield - a.avgYield);
  }, [samples, crops]);

  const maxAvg = Math.max(...cropStats.map((c) => c.avgYield), 1);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Crop Yield Comparison (All Crops)</div></div>
        <div className="card-body">
          <table className="data-table">
            <thead><tr><th>#</th><th>Crop</th><th>Samples</th><th>Avg Yield (kg/ha)</th><th>Min</th><th>Max</th><th>Yield Bar</th></tr></thead>
            <tbody>
              {cropStats.map((c, i) => (
                <tr key={c.name}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.samples.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{c.avgYield.toLocaleString()}</td>
                  <td>{c.min.toLocaleString()}</td>
                  <td>{c.max.toLocaleString()}</td>
                  <td style={{ width: "30%" }}>
                    <div style={{ height: 10, borderRadius: 5, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 5, background: yieldColor(c.avgYield / maxAvg), width: `${(c.avgYield / maxAvg) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── District Analytics Tab ────────────────────────────────────────────────
function DistrictAnalyticsTab({ samples, districts }: { samples: Sample[]; districts: string[] }) {
  const years = useMemo(() => [...new Set(samples.map((s) => s.Year))].sort(), [samples]);

  const districtYearData = useMemo(() => {
    return districts.map((d) => {
      const yearVals: Record<number, number> = {};
      for (const y of years) {
        const rows = samples.filter((s) => s.District === d && s.Year === y);
        yearVals[y] = rows.length ? Math.round(mean(rows.map((r) => r.Yield_kg_ha))) : 0;
      }
      const allYields = samples.filter((s) => s.District === d).map((s) => s.Yield_kg_ha);
      const avg = allYields.length ? Math.round(mean(allYields)) : 0;
      return { district: d, yearVals, avg };
    }).sort((a, b) => b.avg - a.avg);
  }, [samples, districts, years]);

  const maxVal = Math.max(...districtYearData.flatMap((d) => years.map((y) => d.yearVals[y] ?? 0)), 1);

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">District × Year Yield Heatmap</div></div>
      <div className="card-body" style={{ overflowX: "auto", padding: 0 }}>
        <table className="data-table" style={{ fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, background: "#f9fafb", zIndex: 1 }}>District</th>
              {years.map((y) => <th key={y} style={{ textAlign: "center" }}>{y}</th>)}
              <th style={{ textAlign: "center", background: "#f0fdf4" }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {districtYearData.map((d) => (
              <tr key={d.district}>
                <td style={{ fontWeight: 500, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>{d.district}</td>
                {years.map((y) => {
                  const val = d.yearVals[y] ?? 0;
                  return (
                    <td key={y} style={{ textAlign: "center", padding: "4px 6px" }}>
                      <div title={`${d.district} · ${y}: ${val.toLocaleString()} kg/ha`}
                        style={{ height: 22, borderRadius: 3, background: val > 0 ? yieldColor(val / maxVal) : "#f3f4f6",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                          color: val > 0 ? "#fff" : "#ccc", fontWeight: 600, minWidth: 40 }}>
                        {val > 0 ? val.toLocaleString() : "—"}
                      </div>
                    </td>
                  );
                })}
                <td style={{ textAlign: "center", fontWeight: 600, background: "#f0fdf4" }}>{d.avg.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Seasonal Analytics Tab ────────────────────────────────────────────────
function SeasonalAnalyticsTab({ samples }: { samples: Sample[] }) {
  const seasonData = useMemo(() => {
    const seasons = [...new Set(samples.map((s) => s.Season))].sort();
    return seasons.map((se) => {
      const rows = samples.filter((s) => s.Season === se);
      const yields = rows.map((s) => s.Yield_kg_ha);
      return {
        season: se,
        samples: rows.length,
        avgYield: yields.length ? Math.round(mean(yields)) : 0,
        crops: [...new Set(rows.map((s) => s.Crop))].length,
      };
    });
  }, [samples]);

  const kharifRabi = useMemo(() => {
    const kh = samples.filter((s) => s.Season === "Kharif");
    const ra = samples.filter((s) => s.Season === "Rabi");
    const khYields = kh.map((s) => s.Yield_kg_ha);
    const raYields = ra.map((s) => s.Yield_kg_ha);
    return {
      kharif: { count: kh.length, avg: khYields.length ? Math.round(mean(khYields)) : 0, crops: [...new Set(kh.map((s) => s.Crop))].length },
      rabi: { count: ra.length, avg: raYields.length ? Math.round(mean(raYields)) : 0, crops: [...new Set(ra.map((s) => s.Crop))].length },
    };
  }, [samples]);

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header"><div className="card-title">Season Comparison</div></div>
        <div className="card-body">
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {seasonData.map((s) => (
              <div key={s.season} className="metric-card">
                <div className="metric-icon">{s.season === "Kharif" ? "🌧️" : "❄️"}</div>
                <div className="metric-value">{s.avgYield.toLocaleString()}</div>
                <div className="metric-label">{s.season} Avg Yield</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{s.samples.toLocaleString()} samples · {s.crops} crops</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Kharif vs Rabi Details</div></div>
        <div className="card-body">
          <table className="data-table">
            <thead><tr><th>Metric</th><th>Kharif</th><th>Rabi</th></tr></thead>
            <tbody>
              <tr><td>Samples</td><td>{kharifRabi.kharif.count.toLocaleString()}</td><td>{kharifRabi.rabi.count.toLocaleString()}</td></tr>
              <tr><td>Avg Yield (kg/ha)</td><td style={{ fontWeight: 600 }}>{kharifRabi.kharif.avg.toLocaleString()}</td><td style={{ fontWeight: 600 }}>{kharifRabi.rabi.avg.toLocaleString()}</td></tr>
              <tr><td>Crops Tracked</td><td>{kharifRabi.kharif.crops}</td><td>{kharifRabi.rabi.crops}</td></tr>
              <tr><td>Yield Difference</td><td colSpan={2} style={{ color: kharifRabi.kharif.avg > kharifRabi.rabi.avg ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {Math.abs(kharifRabi.kharif.avg - kharifRabi.rabi.avg).toLocaleString()} kg/ha ({kharifRabi.kharif.avg > kharifRabi.rabi.avg ? "Kharif" : "Rabi"} higher)
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reusable chart components ─────────────────────────────────────────────
function LineChart({ data, unit, color = "#22c55e" }: { data: Array<{ label: string; value: number }>; unit: string; color?: string }) {
  const w = 600, h = 180, pad = 45;
  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals) * 0.9, maxV = Math.max(...vals) * 1.05;
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d.value - minV) / range) * (h - pad * 2), ...d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = h - pad - t * (h - pad * 2);
        const val = Math.round(minV + t * range);
        return <g key={t}><line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#f3f4f6" strokeWidth={1} /><text x={pad - 6} y={y + 3} textAnchor="end" fontSize={10} fill="#9ca3af">{val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}</text></g>;
      })}
      <path d={`${pathD} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`} fill={`${color}18`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke={color} strokeWidth={2} /><text x={p.x} y={h - pad + 14} textAnchor="middle" fontSize={10} fill="#6b7280">{p.label}</text></g>)}
      <text x={6} y={pad - 4} fontSize={10} fill="#9ca3af">{unit}</text>
    </svg>
  );
}

function BarChartSimple({ data, color }: { data: Array<{ label: string; value: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart" style={{ height: "100%" }}>
      {data.map((d) => (
        <div className="bar-col" key={d.label}>
          <div className="bar-value">{d.value}</div>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
          <div className="bar-label" style={{ fontSize: 8 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Correlations Tab ────────────────────────────────────────────────

function CorrelationsTab({ samples }: { samples: Sample[] }) {
  const variables = ["NDVI", "NDWI", "EVI", "Rainfall_mm", "Temperature_C", "Soil_Moisture", "Yield_kg_ha"];
  const labels: Record<string, string> = {
    NDVI: "NDVI", NDWI: "NDWI", EVI: "EVI",
    Rainfall_mm: "Rainfall", Temperature_C: "Temp",
    Soil_Moisture: "Soil Moisture", Yield_kg_ha: "Yield",
  };
  const data = useMemo(() => samples.map((s) => ({
    NDVI: s.NDVI, NDWI: s.NDWI, EVI: s.EVI,
    Rainfall_mm: s.Rainfall_mm, Temperature_C: s.Temperature_C,
    Soil_Moisture: s.Soil_Moisture, Yield_kg_ha: s.Yield_kg_ha,
  })), [samples]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📊 Correlation Heatmap</div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>{samples.length.toLocaleString()} samples</div>
      </div>
      <div className="card-body" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 1.6 }}>
          Hover over cells to see exact correlation values. Strong positive correlations (dark green)
          indicate variables that move together. Negative correlations (red) indicate inverse relationships.
        </div>
        <CorrelationHeatmap data={data} variables={variables} labels={labels} />
      </div>
    </div>
  );
}
