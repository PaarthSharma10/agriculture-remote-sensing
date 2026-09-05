/**
 * DistrictsView.tsx — District-wise statistics with synced selection.
 *
 * Uses DistrictContext so selecting a district here also selects it on the Maps
 * tab and vice versa.  Left: searchable district list.  Right: metrics, bar chart,
 * and donut chart for the selected district.
 */
import { useMemo, useState } from "react";
import { districtDetail, districtList, formatNumber } from "../stats";
import { SearchInput } from "./shared";
import type { Sample } from "../types";
import { useDistrictSelection } from "../App";

export function DistrictsView({
  samples,
  onExport,
}: {
  samples: Sample[];
  onExport: () => void;
}) {
  const districts = useMemo(() => districtList(samples), [samples]);
  const { selectedDistrict, setSelectedDistrict } = useDistrictSelection();
  const selected = selectedDistrict ?? districts[0] ?? "";
  const [query, setQuery] = useState("");
  const detail = useMemo(() => districtDetail(samples, selected), [samples, selected]);
  const visible = useMemo(
    () => districts.filter((d) => d.toLowerCase().includes(query.toLowerCase())),
    [districts, query],
  );
  const maxShow = 22;

  return (
    <div>
      {/* Toolbar */}
      <div className="filter-bar">
        <SearchInput placeholder="Search district..." value={query} onChange={setQuery} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={onExport}>📤 Export</button>
      </div>

      <div className="grid-1-2">
        {/* District list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Districts ({districts.length})</div>
          </div>
          <div className="card-body" style={{ padding: 8, maxHeight: 560, overflowY: "auto" }}>
            <div className="list">
              {visible.slice(0, maxShow).map((d) => (
                <div
                  key={d}
                  className={`list-item${d === selected ? " active" : ""}`}
                  onClick={() => setSelectedDistrict(d)}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* District details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">District Details: {selected || "—"}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {detail.samples} samples · {detail.crops} crops · {detail.years.join(" – ")}
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
                <div className="metric-value">{detail.crops}</div>
                <div className="metric-label">Crops</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{formatNumber(detail.avgYield)}</div>
                <div className="metric-label">Avg Yield (kg/ha)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{detail.years.join(", ")}</div>
                <div className="metric-label">Years</div>
              </div>
            </div>

            <div className="grid-2">
              {/* Samples over years */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Samples Over Years</div>
                </div>
                <div className="card-body" style={{ height: 180 }}>
                  <BarChart data={detail.samplesByYear} color="#22c55e" />
                </div>
              </div>

              {/* Top crops */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Top 5 Crops in {selected}</div>
                </div>
                <div className="card-body">
                  <DonutMini
                    data={detail.topCrops}
                    colors={["#22c55e", "#16a34a", "#0e7a38", "#66bb6a", "#a5d6a7"]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, color }: { data: Array<{ label: string; value: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart" style={{ height: "100%" }}>
      {data.map((d) => (
        <div className="bar-col" key={d.label}>
          <div className="bar-value">{d.value.toLocaleString()}</div>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutMini({ data, colors }: { data: Array<{ label: string; value: number }>; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const stops: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const pct = (data[i].value / total) * 100;
    stops.push(`${colors[i % colors.length]} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  }
  return (
    <div className="donut-chart-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(", ")})`, width: 120, height: 120 }}>
        <div className="donut-hole" />
      </div>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div className="donut-legend-item" key={d.label}>
            <span className="donut-swatch" style={{ background: colors[i % colors.length] }} />
            <span>{d.label} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
