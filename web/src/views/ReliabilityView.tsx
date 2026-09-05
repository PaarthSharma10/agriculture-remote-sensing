/**
 * ReliabilityView.tsx — Comprehensive model reliability and uncertainty analysis.
 *
 * SECTIONS:
 *   • 4 metric cards: Uncertainty, R², 95% Coverage, Calibration Slope
 *   • Uncertainty Distribution histogram
 *   • Reliability Diagram (calibration curve)
 *   • Risk Level Breakdown donut
 *   • Prediction Error Analysis (new)
 *   • Confidence Interval Coverage (new)
 */

import { useMemo } from "react";
import { reliabilityStats } from "../stats";
import type { Prediction } from "../types";

export function ReliabilityView({ predictions }: { predictions: Prediction[] }) {
  const stats = useMemo(() => reliabilityStats(predictions), [predictions]);

  // Additional analysis
  const errorAnalysis = useMemo(() => {
    const errors = predictions.map((p) => p.Absolute_Error_Percent);
    const within5 = errors.filter((e) => e <= 5).length;
    const within10 = errors.filter((e) => e <= 10).length;
    const within20 = errors.filter((e) => e <= 20).length;
    const total = errors.length;
    return {
      within5Pct: Math.round((within5 / total) * 100),
      within10Pct: Math.round((within10 / total) * 100),
      within20Pct: Math.round((within20 / total) * 100),
      meanError: Math.round(errors.reduce((a, b) => a + b, 0) / total * 10) / 10,
      medianError: Math.round([...errors].sort((a, b) => a - b)[Math.floor(total / 2)] * 10) / 10,
    };
  }, [predictions]);

  const intervalCoverage = useMemo(() => {
    const total = predictions.length;
    const covered = predictions.filter((p) => p.Actual_Yield >= p.Lower_95_Interval && p.Actual_Yield <= p.Upper_95_Interval).length;
    const avgWidth = Math.round(mean(predictions.map((p) => p.Upper_95_Interval - p.Lower_95_Interval)));
    return { covered, total, pct: Math.round((covered / total) * 100), avgWidth };
  }, [predictions]);

  return (
    <div>
      {/* Metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">🎲</div>
          <div className="metric-value">± {Math.round(stats.meanUncertainty).toLocaleString()}</div>
          <div className="metric-label">Mean Prediction Uncertainty (kg/ha)</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-value">{stats.r2.toFixed(2)}</div>
          <div className="metric-label">R² Score</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-value">{stats.coverage95.toFixed(1)}%</div>
          <div className="metric-label">95% Coverage</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{stats.calibrationSlope.toFixed(2)}</div>
          <div className="metric-label">Calibration Slope (1.0 = perfect)</div>
        </div>
      </div>

      {/* Main charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Prediction Uncertainty Distribution</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>percent uncertainty across predictions</div>
          </div>
          <div className="card-body" style={{ height: 220 }}>
            <div className="bar-chart" style={{ height: "100%" }}>
              {stats.uncertaintyHist.map((d) => (
                <div className="bar-col" key={d.label}>
                  <div className="bar-value">{d.value}</div>
                  <div className="bar" style={{ height: `${(d.value / Math.max(...stats.uncertaintyHist.map((x) => x.value), 1)) * 100}%`, background: "linear-gradient(180deg, #e0a800, #d97706)" }} />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Reliability Diagram</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>predicted confidence vs observed frequency</div>
          </div>
          <div className="card-body">
            <ReliabilityDiagram data={stats.reliabilityDiagram} />
          </div>
        </div>
      </div>

      {/* Risk breakdown + Error analysis */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Risk Level Breakdown</div></div>
          <div className="card-body">
            <DonutChart data={stats.riskBreakdown} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Prediction Error Analysis</div></div>
          <div className="card-body">
            <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }}>
              <div className="metric-card">
                <div className="metric-value" style={{ color: "#22c55e" }}>{errorAnalysis.within5Pct}%</div>
                <div className="metric-label">Within 5% Error</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: "#eab308" }}>{errorAnalysis.within10Pct}%</div>
                <div className="metric-label">Within 10% Error</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: "#ef4444" }}>{errorAnalysis.within20Pct}%</div>
                <div className="metric-label">Within 20% Error</div>
              </div>
            </div>
            <table className="data-table">
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td>Mean Absolute Error</td><td style={{ fontWeight: 600 }}>{errorAnalysis.meanError}%</td></tr>
                <tr><td>Median Absolute Error</td><td style={{ fontWeight: 600 }}>{errorAnalysis.medianError}%</td></tr>
                <tr><td>Total Predictions</td><td>{predictions.length.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confidence Interval Coverage */}
      <div className="card">
        <div className="card-header"><div className="card-title">Confidence Interval Coverage Analysis</div></div>
        <div className="card-body">
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="metric-card">
              <div className="metric-value">{intervalCoverage.pct}%</div>
              <div className="metric-label">95% CI Coverage</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{intervalCoverage.covered.toLocaleString()}</div>
              <div className="metric-label">Covered</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{intervalCoverage.total.toLocaleString()}</div>
              <div className="metric-label">Total</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{intervalCoverage.avgWidth.toLocaleString()}</div>
              <div className="metric-label">Avg CI Width (kg/ha)</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
            <strong>Interpretation:</strong> A well-calibrated model should have ~95% of actual values fall within the 95% prediction interval.
            {intervalCoverage.pct >= 90 && intervalCoverage.pct <= 98
              ? <span style={{ color: "#22c55e" }}> This model is well-calibrated ({intervalCoverage.pct}% coverage).</span>
              : intervalCoverage.pct < 90
                ? <span style={{ color: "#ef4444" }}> This model is under-confident ({intervalCoverage.pct}% coverage) — intervals are too narrow.</span>
                : <span style={{ color: "#eab308" }}> This model is over-confident ({intervalCoverage.pct}% coverage) — intervals are too wide.</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
function mean(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function ReliabilityDiagram({ data }: { data: Array<{ label: number; value: number }> }) {
  const w = 400, h = 280, pad = 45;
  const diagD = `M${pad},${h - pad} L${w - pad},${pad}`;
  const maxVal = Math.max(...data.map((d) => Math.max(d.label, d.value)), 0.1);
  const pts = data.map((d) => ({
    x: pad + (d.label / maxVal) * (w - pad * 2),
    y: h - pad - (d.value / maxVal) * (h - pad * 2), ...d,
  }));
  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart" style={{ maxHeight: 260 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = h - pad - t * (h - pad * 2), x = pad + t * (w - pad * 2);
        return <g key={t}><line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#f3f4f6" strokeWidth={1} /><line x1={x} y1={pad} x2={x} y2={h - pad} stroke="#f3f4f6" strokeWidth={1} /><text x={pad - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{(t * maxVal).toFixed(1)}</text><text x={x} y={h - pad + 12} textAnchor="middle" fontSize={9} fill="#9ca3af">{(t * maxVal).toFixed(1)}</text></g>;
      })}
      <path d={diagD} fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4,4" />
      <path d={lineD} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#22c55e" strokeWidth={2} />)}
      <text x={w / 2} y={h - 6} textAnchor="middle" fontSize={10} fill="#6b7280">Predicted Probability</text>
      <text x={10} y={h / 2} textAnchor="middle" fontSize={10} fill="#6b7280" transform={`rotate(-90, 10, ${h / 2})`}>Observed Frequency</text>
    </svg>
  );
}

function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const colors: Record<string, string> = { "High Risk": "#dc2626", "Medium Risk": "#d97706", "Low Risk": "#22c55e" };
  const stops = data.map((d) => {
    const pct = (d.value / total) * 100;
    const c = colors[d.label] || "#9ca3af";
    const s = `${c} ${cum}% ${cum + pct}%`;
    cum += pct;
    return s;
  });
  return (
    <div className="donut-chart-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(", ")})` }}><div className="donut-hole" /></div>
      <div className="donut-legend">
        {data.map((d) => (
          <div className="donut-legend-item" key={d.label}>
            <span className="donut-swatch" style={{ background: colors[d.label] || "#9ca3af" }} />
            <span>{d.label} ({d.value.toLocaleString()} — {Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
