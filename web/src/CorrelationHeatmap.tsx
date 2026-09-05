/**
 * CorrelationHeatmap.tsx — Interactive correlation matrix heatmap.
 *
 * PURPOSE:
 *   Shows pairwise Pearson correlation coefficients between numeric variables
 *   (NDVI, NDWI, EVI, Rainfall, Temperature, Soil Moisture, Yield) as a
 *   color-coded heatmap. Hover reveals exact values.
 *
 * COLOR SCALE:
 *   +1.0 = Strong positive (dark green)
 *    0.0 = No correlation (white)
 *   -1.0 = Strong negative (dark red)
 */

import { useMemo, useState } from "react";

interface Props {
  data: Array<Record<string, number>>;
  variables: string[];
  labels?: Record<string, string>;
}

/** Pearson correlation coefficient between two arrays. */
function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

/** Map correlation to color: -1=red, 0=white, +1=green. */
function corrColor(r: number): string {
  if (r > 0) {
    const t = Math.min(r, 1);
    const r2 = Math.round(255 - t * 200);
    const g = Math.round(255 - t * 60);
    const b = Math.round(255 - t * 200);
    return `rgb(${r2}, ${g}, ${b})`;
  } else {
    const t = Math.min(-r, 1);
    const r2 = Math.round(255 - t * 20);
    const g = Math.round(255 - t * 200);
    const b = Math.round(255 - t * 200);
    return `rgb(${r2}, ${g}, ${b})`;
  }
}

export function CorrelationHeatmap({ data, variables, labels }: Props) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const matrix = useMemo(() => {
    const cols = variables.map((v) => data.map((d) => d[v] ?? 0));
    return variables.map((_, i) =>
      variables.map((_, j) => pearson(cols[i], cols[j]))
    );
  }, [data, variables]);

  const cellSize = Math.min(60, Math.max(36, 320 / variables.length));

  return (
    <div style={{ overflow: "auto" }}>
      {/* Column headers */}
      <div style={{ display: "flex", marginLeft: cellSize + 8 }}>
        {variables.map((v) => (
          <div
            key={v}
            style={{
              width: cellSize, textAlign: "center", fontSize: 9, fontWeight: 600,
              color: "#374151", padding: "4px 0",
              transform: "rotate(-30deg)", transformOrigin: "center",
              whiteSpace: "nowrap",
            }}
          >
            {labels?.[v] ?? v}
          </div>
        ))}
      </div>

      {/* Rows */}
      {variables.map((rowVar, ri) => (
        <div key={rowVar} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: cellSize + 8, fontSize: 9, fontWeight: 600,
            color: "#374151", textAlign: "right", paddingRight: 6,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {labels?.[rowVar] ?? rowVar}
          </div>
          {variables.map((colVar, ci) => {
            const r = matrix[ri][ci];
            const isHovered = hovered?.row === ri && hovered?.col === ci;
            return (
              <div
                key={colVar}
                onMouseEnter={() => setHovered({ row: ri, col: ci })}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: cellSize, height: cellSize,
                  background: corrColor(r),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: isHovered ? 700 : 500,
                  color: Math.abs(r) > 0.6 ? "#fff" : "#374151",
                  border: isHovered ? "2px solid #13261c" : "1px solid #fff",
                  borderRadius: 3, cursor: "default",
                  transition: "all 0.1s",
                  transform: isHovered ? "scale(1.15)" : "scale(1)",
                  zIndex: isHovered ? 2 : 1,
                }}
                title={`${labels?.[rowVar] ?? rowVar} × ${labels?.[colVar] ?? colVar}: ${r.toFixed(3)}`}
              >
                {ri === ci ? "1.00" : r.toFixed(2)}
              </div>
            );
          })}
        </div>
      ))}

      {/* Hover detail */}
      {hovered && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#374151", textAlign: "center" }}>
          <b>{labels?.[variables[hovered.row]] ?? variables[hovered.row]}</b>
          {" × "}
          <b>{labels?.[variables[hovered.col]] ?? variables[hovered.col]}</b>
          {": r = "}
          <b style={{ color: matrix[hovered.row][hovered.col] > 0 ? "#059669" : "#dc2626" }}>
            {matrix[hovered.row][hovered.col].toFixed(3)}
          </b>
          {" — "}
          {Math.abs(matrix[hovered.row][hovered.col]) > 0.7
            ? "Strong correlation"
            : Math.abs(matrix[hovered.row][hovered.col]) > 0.4
            ? "Moderate correlation"
            : "Weak correlation"}
        </div>
      )}

      {/* Color legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8, fontSize: 10, color: "#6b7280" }}>
        <span>-1.0</span>
        <div style={{ display: "flex", height: 10, borderRadius: 2, overflow: "hidden" }}>
          {Array.from({ length: 20 }).map((_, idx) => {
            const r = -1 + (idx / 19) * 2;
            return <div key={idx} style={{ width: 12, background: corrColor(r) }} />;
          })}
        </div>
        <span>+1.0</span>
      </div>
    </div>
  );
}
