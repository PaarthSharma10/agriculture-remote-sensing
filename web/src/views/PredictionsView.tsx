/**
 * PredictionsView.tsx — Actual vs predicted yield comparison with SVG scatter plot.
 *
 * Filter bar for crop/district/year/season.  4 metric cards showing summary.
 * SVG scatter plot with color-coded points (green=good, amber=moderate, red=bad).
 * Detail panel and recent predictions table.
 */
import { useMemo, useState } from "react";
import { cropList, districtList, formatNumber, predictionSummary } from "../stats";
import { FilterBar, FilterSelect } from "./shared";
import type { Prediction, Sample } from "../types";

export function PredictionsView({
  samples,
  predictions,
}: {
  samples: Sample[];
  predictions: Prediction[];
}) {
  const crops = useMemo(() => cropList(samples), [samples]);
  const districts = useMemo(() => districtList(samples), [samples]);
  const years = useMemo(
    () => [...new Set(predictions.map((p) => p.Year))].sort((a, b) => b - a),
    [predictions],
  );
  const seasons = useMemo(
    () => [...new Set(predictions.map((p) => p.Season))].sort(),
    [predictions],
  );

  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [year, setYear] = useState("");
  const [season, setSeason] = useState("");

  const filtered = useMemo(() => {
    let rows = predictions;
    if (crop) rows = rows.filter((p) => p.Crop === crop);
    if (district) rows = rows.filter((p) => p.District === district);
    if (year) rows = rows.filter((p) => String(p.Year) === year);
    if (season) rows = rows.filter((p) => p.Season === season);
    return rows;
  }, [predictions, crop, district, year, season]);

  const summary = useMemo(() => predictionSummary(filtered), [filtered]);
  const scatterPoints = useMemo(
    () => filtered.map((p) => ({ actual: p.Actual_Yield, predicted: p.Predicted_Yield })),
    [filtered],
  );

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
        <FilterSelect label="Year" options={all(years.map(String), "All Years")} value={year} onChange={setYear} />
        <FilterSelect label="Season" options={all(seasons, "All Seasons")} value={season} onChange={setSeason} />
      </FilterBar>

      {/* Metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-value">{formatNumber(summary.actual)}</div>
          <div className="metric-label">Actual Yield (kg/ha)</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{formatNumber(summary.predicted)}</div>
          <div className="metric-label">Predicted Yield (kg/ha)</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚖️</div>
          <div className="metric-value">{summary.difference >= 0 ? "+" : ""}{formatNumber(summary.difference)}</div>
          <div className="metric-label">Difference (kg/ha)</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📉</div>
          <div className="metric-value">{summary.errorPct >= 0 ? "+" : ""}{summary.errorPct.toFixed(2)}%</div>
          <div className="metric-label">Error ({summary.count} predictions)</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Scatter plot */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Actual vs Predicted Yield</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>green = good fit · larger error = further from diagonal</div>
          </div>
          <div className="card-body">
            <ScatterPlot points={scatterPoints} />
          </div>
        </div>

        {/* Prediction Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Prediction Details</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>summary for selected filters</div>
          </div>
          <div className="card-body">
            <div className="detail-list">
              <div className="detail-row"><span className="detail-key">Crop</span><span className="detail-val">{crop || "All crops"}</span></div>
              <div className="detail-row"><span className="detail-key">District</span><span className="detail-val">{district || "All districts"}</span></div>
              <div className="detail-row"><span className="detail-key">Year</span><span className="detail-val">{year || "All years"}</span></div>
              <div className="detail-row"><span className="detail-key">Season</span><span className="detail-val">{season || "All seasons"}</span></div>
              <div className="detail-row strong"><span className="detail-key">Actual Yield</span><span className="detail-val">{formatNumber(summary.actual)} kg/ha</span></div>
              <div className="detail-row strong"><span className="detail-key">Predicted Yield</span><span className="detail-val">{formatNumber(summary.predicted)} kg/ha</span></div>
              <div className="detail-row"><span className="detail-key">Difference</span><span className="detail-val">{summary.difference >= 0 ? "+" : ""}{formatNumber(summary.difference)} kg/ha</span></div>
              <div className="detail-row"><span className="detail-key">Error</span><span className="detail-val">{summary.errorPct >= 0 ? "+" : ""}{summary.errorPct.toFixed(2)}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent predictions table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Predictions</div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Crop</th>
                  <th>Year</th>
                  <th>Season</th>
                  <th>Actual (kg/ha)</th>
                  <th>Predicted (kg/ha)</th>
                  <th>Error (%)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 8).map((p, i) => (
                  <tr key={i}>
                    <td>{p.District}</td>
                    <td>{p.Crop}</td>
                    <td>{p.Year}</td>
                    <td>{p.Season}</td>
                    <td>{formatNumber(p.Actual_Yield)}</td>
                    <td>{formatNumber(p.Predicted_Yield)}</td>
                    <td>{(p.Absolute_Error_Percent ?? 0).toFixed(1)}%</td>
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

function ScatterPlot({ points }: { points: Array<{ actual: number; predicted: number }> }) {
  const w = 600, h = 350, pad = 50;
  const allVals = points.flatMap((p) => [p.actual, p.predicted]);
  const minV = Math.min(...allVals, 0) * 0.9;
  const maxV = Math.max(...allVals, 1) * 1.05;
  const range = maxV - minV || 1;
  const cx = (v: number) => pad + ((v - minV) / range) * (w - pad * 2);
  const cy = (v: number) => h - pad - ((v - minV) / range) * (h - pad * 2);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart" style={{ maxHeight: 320 }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const val = minV + t * range;
        return (
          <g key={t}>
            <line x1={pad} y1={cy(val)} x2={w - pad} y2={cy(val)} stroke="#f3f4f6" strokeWidth={1} />
            <line x1={cx(val)} y1={pad} x2={cx(val)} y2={h - pad} stroke="#f3f4f6" strokeWidth={1} />
            <text x={pad - 6} y={cy(val) + 3} textAnchor="end" fontSize={10} fill="#9ca3af">
              {Math.round(val).toLocaleString()}
            </text>
            <text x={cx(val)} y={h - pad + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {Math.round(val).toLocaleString()}
            </text>
          </g>
        );
      })}
      {/* Diagonal line */}
      <line x1={cx(minV)} y1={cy(minV)} x2={cx(maxV)} y2={cy(maxV)} stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4,4" />
      {/* Points */}
      {points.map((p, i) => {
        const err = Math.abs(p.predicted - p.actual) / (p.actual || 1);
        const color = err < 0.05 ? "#22c55e" : err < 0.1 ? "#eab308" : "#ef4444";
        return (
          <circle
            key={i}
            cx={cx(p.actual)}
            cy={cy(p.predicted)}
            r={3.5}
            fill={color}
            opacity={0.7}
            className="scatter-dot"
          />
        );
      })}
      {/* Axes */}
      <text x={w / 2} y={h - 6} textAnchor="middle" fontSize={11} fill="#6b7280">Actual Yield (kg/ha)</text>
      <text x={12} y={h / 2} textAnchor="middle" fontSize={11} fill="#6b7280" transform={`rotate(-90, 12, ${h / 2})`}>Predicted Yield (kg/ha)</text>
    </svg>
  );
}
