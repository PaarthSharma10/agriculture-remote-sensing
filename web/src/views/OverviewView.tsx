/**
 * OverviewView.tsx — Dashboard home tab with key statistics.
 *
 * Renders 4 metric cards (samples, crops, years, seasons), model performance
 * (MAE, RMSE, R²), samples-over-years bar chart, and two CSS donut charts
 * for top crops and season split.
 */
import { useMemo } from "react";
import { overviewStats } from "../stats";
import type { Prediction, Sample } from "../types";
export function OverviewView({
  samples,
  predictions,
}: {
  samples: Sample[];
  predictions: Prediction[];
}) {
  const stats = useMemo(() => overviewStats(samples, predictions), [samples, predictions]);
  const yearsLabel =
    stats.years.length > 0
      ? `${stats.years[0]} – ${stats.years[stats.years.length - 1]}`
      : "—";
  const maxBar = Math.max(...stats.samplesPerYear.map((d) => d.value), 1);
  const totalSeason = stats.seasonSplit.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* Metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">🗂️</div>
          <div className="metric-value">{stats.samples.toLocaleString()}</div>
          <div className="metric-label">Total Samples</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🌾</div>
          <div className="metric-value">{stats.crops}</div>
          <div className="metric-label">Crops</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-value">{yearsLabel}</div>
          <div className="metric-label">{stats.years.length} Years</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🌦️</div>
          <div className="metric-value">{stats.seasons.length}</div>
          <div className="metric-label">{stats.seasons.join(", ")}</div>
        </div>
      </div>

      {/* Model performance + Samples over years */}
      <div className="grid-2">
        {/* Model Performance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Model Performance (Overall)</div>
          </div>
          <div className="card-body">
            <div className="metric-grid" style={{ marginBottom: 0 }}>
              <div className="metric-card">
                <div className="metric-value">{stats.mae.toFixed(1)}</div>
                <div className="metric-label">MAE (kg/ha)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{stats.rmse.toFixed(1)}</div>
                <div className="metric-label">RMSE (kg/ha)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{stats.r2.toFixed(2)}</div>
                <div className="metric-label">R² Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Samples Over Years */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Samples Over Years</div>
          </div>
          <div className="card-body" style={{ height: 180 }}>
            <div className="bar-chart" style={{ height: "100%" }}>
              {stats.samplesPerYear.map((d) => (
                <div className="bar-col" key={d.label}>
                  <div className="bar-value">{d.value.toLocaleString()}</div>
                  <div
                    className="bar"
                    style={{
                      height: `${(d.value / maxBar) * 100}%`,
                      background: `linear-gradient(180deg, #22c55e 0%, #16a34a 100%)`,
                    }}
                  />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top crops donut + Season split */}
      <div className="grid-2">
        {/* Top 5 Crops by Samples */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top 5 Crops by Samples</div>
          </div>
          <div className="card-body">
            <Donut
              data={stats.topCrops}
              colors={["#22c55e", "#16a34a", "#0e7a38", "#66bb6a", "#a5d6a7"]}
            />
          </div>
        </div>

        {/* Samples by Season */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Samples by Season</div>
          </div>
          <div className="card-body">
            <Donut
              data={stats.seasonSplit}
              colors={["#22c55e", "#0e7a38"]}
              labelFn={(d) => `${d.label} (${Math.round((d.value / totalSeason) * 100)}%)`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Donut({
  data,
  colors: palette,
  labelFn,
}: {
  data: Array<{ label: string; value: number }>;
  colors: string[];
  labelFn?: (d: { label: string; value: number; pct: number }) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const stops: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const pct = (data[i].value / total) * 100;
    stops.push(`${palette[i % palette.length]} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  }
  const bg = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="donut-chart-wrap">
      <div className="donut" style={{ background: bg }}>
        <div className="donut-hole" />
      </div>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div className="donut-legend-item" key={d.label}>
            <span className="donut-swatch" style={{ background: palette[i % palette.length] }} />
            <span>{labelFn ? labelFn({ ...d, pct: (d.value / total) * 100 }) : `${d.label} (${d.value.toLocaleString()})`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
