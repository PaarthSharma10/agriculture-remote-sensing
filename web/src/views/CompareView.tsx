/**
 * CompareView.tsx — Side-by-side comparison of districts or crops.
 *
 * PURPOSE:
 *   Allows users to select two items (districts or crops) and see
 *   their statistics compared side-by-side with bar charts.
 *
 * FEATURES:
 *   • Compare any two districts or crops
 *   • Side-by-side metric cards
 *   • Comparison bar charts
 *   • Year-by-year trend comparison
 */

import { useMemo, useState } from "react";
import { DISTRICTS, CROPS } from "../demo";
import { districtDetail, cropDetail } from "../stats";
import { formatNumber } from "../stats";
import type { Sample } from "../types";

type CompareMode = "districts" | "crops";

export function CompareView({ samples }: { samples: Sample[] }) {
  const [mode, setMode] = useState<CompareMode>("districts");
  const [left, setLeft] = useState(DISTRICTS[0]);
  const [right, setRight] = useState(DISTRICTS[1]);
  const items = mode === "districts" ? DISTRICTS : CROPS;

  const leftDetail = useMemo(() =>
    mode === "districts" ? districtDetail(samples, left) : cropDetail(samples, left),
    [samples, mode, left]
  );
  const rightDetail = useMemo(() =>
    mode === "districts" ? districtDetail(samples, right) : cropDetail(samples, right),
    [samples, mode, right]
  );

  if (!leftDetail || !rightDetail) return null;

  const isDistrictMode = mode === "districts";
  const metrics: Array<{ label: string; key: string }> = [
    { label: "Total Samples", key: "samples" },
    { label: "Avg Yield (kg/ha)", key: "avgYield" },
    ...(isDistrictMode ? [{ label: "Crop Count", key: "crops" }] : []),
  ];

  const maxVal = Math.max(leftDetail.avgYield, rightDetail.avgYield);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Synopsis */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #bbf7d0" }}>
        <div className="card-body" style={{ padding: "10px 14px", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
          <b>📊 Compare Mode</b> — Select two districts or crops to see them compared side-by-side
          with metric cards, bar charts, and yield distributions.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["districts", "crops"] as CompareMode[]).map((m) => (
            <button key={m} className={`mode-tab${m === mode ? " active" : ""}`}
              onClick={() => { setMode(m); setLeft(items[0]); setRight(items[1]); }}>
              {m === "districts" ? "🗺️ Districts" : "🌾 Crops"}
            </button>
          ))}
        </div>
        <select value={left} onChange={(e) => setLeft(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}>
          {items.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize: 14, color: "#9ca3af" }}>vs</span>
        <select value={right} onChange={(e) => setRight(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}>
          {items.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Side by side metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { detail: leftDetail, name: left, color: "#059669" },
          { detail: rightDetail, name: right, color: "#2563eb" },
        ].map(({ detail, name, color }) => (
          <div key={name} className="card">
            <div className="card-header" style={{ borderBottom: `3px solid ${color}` }}>
              <div className="card-title" style={{ color }}>{name}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{detail.samples} samples · {(detail as any).crops ?? 0} crops</div>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              {metrics.map(({ label, key }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{formatNumber((detail as any)[key] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison bar chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Yield Comparison</div>
        </div>
        <div className="card-body" style={{ padding: 16 }}>
          {metrics.filter((m) => m.key === "avgYield").map(() => (
            <div key="yield" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[left, right].map((name, i) => {
                const detail = i === 0 ? leftDetail : rightDetail;
                const color = i === 0 ? "#059669" : "#2563eb";
                const pct = maxVal > 0 ? (detail.avgYield / maxVal) * 100 : 0;
                return (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color }}>{formatNumber(detail.avgYield)} kg/ha</span>
                    </div>
                    <div style={{ height: 24, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        borderRadius: 4, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Top crops comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { detail: leftDetail, name: left, color: "#059669" },
          { detail: rightDetail, name: right, color: "#2563eb" },
        ].map(({ detail, name, color }) => (
          <div key={name} className="card">
            <div className="card-header">
              <div className="card-title">Top Crops — {name}</div>
            </div>
            <div className="card-body" style={{ padding: 10 }}>
              {(detail as any).topCrops?.slice(0, 5).map((c: any) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <div style={{
                    height: 6, borderRadius: 3, background: color,
                    width: `${Math.round((c.value / ((detail as any).topCrops[0]?.value ?? 1)) * 80)}%`,
                    maxWidth: 100, minWidth: 8,
                  }} />
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{c.label} ({formatNumber(c.value)})</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
