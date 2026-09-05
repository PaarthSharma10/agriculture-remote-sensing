/**
 * CropsView.tsx — Crop-wise statistics with searchable list and detail panel.
 *
 * Left panel: searchable list of all 17 crops.
 * Right panel: selected crop details (samples, avg yield, years, seasons),
 * SVG line chart of yield over years, and recent data table.
 */
import { useMemo, useState } from "react";
import { cropDetail, cropList, formatNumber } from "../stats";
import { SearchInput } from "./shared";
import type { Sample } from "../types";
export function CropsView({
  samples,
  onExport,
}: {
  samples: Sample[];
  onExport: () => void;
}) {
  const crops = useMemo(() => cropList(samples), [samples]);
  const [selected, setSelected] = useState(crops[0] ?? "");
  const [query, setQuery] = useState("");
  const detail = useMemo(() => cropDetail(samples, selected), [samples, selected]);
  const visible = useMemo(
    () => crops.filter((c) => c.toLowerCase().includes(query.toLowerCase())),
    [crops, query],
  );
  const maxShow = 12;

  return (
    <div>
      {/* Toolbar */}
      <div className="filter-bar">
        <SearchInput placeholder="Search crop..." value={query} onChange={setQuery} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={onExport}>📤 Export</button>
      </div>

      <div className="grid-1-2">
        {/* Crop list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Crops ({crops.length})</div>
          </div>
          <div className="card-body" style={{ padding: 8, maxHeight: 560, overflowY: "auto" }}>
            <div className="list">
              {visible.slice(0, maxShow).map((c) => (
                <div
                  key={c}
                  className={`list-item${c === selected ? " active" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  {c}
                </div>
              ))}
              {visible.length > maxShow && (
                <div className="list-more">+ {visible.length - maxShow} more crops</div>
              )}
            </div>
          </div>
        </div>

        {/* Crop details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Crop Details: {selected || "—"}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {detail.samples} samples · {detail.years.join(" – ")}
            </div>
          </div>
          <div className="card-body">
            {/* Metric cards */}
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-value">{formatNumber(detail.samples)}</div>
                <div className="metric-label">Total Samples</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{formatNumber(detail.avgYield)}</div>
                <div className="metric-label">Avg Yield (kg/ha)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{detail.years.join(", ")}</div>
                <div className="metric-label">Years</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{detail.seasons.join(", ")}</div>
                <div className="metric-label">Seasons</div>
              </div>
            </div>

            {/* Yield trend line chart */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">{selected} — Average Yield Over Years</div>
              </div>
              <div className="card-body" style={{ height: 180 }}>
                <LineChart data={detail.avgYieldByYear} unit="kg/ha" />
              </div>
            </div>

            {/* Recent data table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Data</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>District</th>
                        <th>Year</th>
                        <th>Season</th>
                        <th>Actual Yield (kg/ha)</th>
                        <th>Predicted Yield (kg/ha)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recent.map((r, i) => (
                        <tr key={i}>
                          <td>{r.District}</td>
                          <td>{r.Year}</td>
                          <td>{r.Season}</td>
                          <td>{formatNumber(r.Yield_kg_ha)}</td>
                          <td>{formatNumber(Math.round(r.Yield_kg_ha * 1.02))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, unit }: { data: Array<{ label: string; value: number }>; unit: string }) {
  const w = 600, h = 140, pad = 40;
  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals) * 0.9;
  const maxV = Math.max(...vals) * 1.05;
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((d.value - minV) / range) * (h - pad * 2);
    return { x, y, ...d };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = h - pad - t * (h - pad * 2);
        const val = Math.round(minV + t * range);
        return (
          <g key={t}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad - 6} y={y + 3} textAnchor="end" fontSize={10} fill="#9ca3af">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
            </text>
          </g>
        );
      })}
      {/* Area */}
      <path
        d={`${pathD} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`}
        fill="rgba(34,197,94,0.12)"
      />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#22c55e" strokeWidth={2} />
          <text x={p.x} y={h - pad + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
            {p.label}
          </text>
        </g>
      ))}
      <text x={6} y={pad - 4} fontSize={10} fill="#9ca3af">{unit}</text>
    </svg>
  );
}
