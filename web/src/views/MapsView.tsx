/**
 * MapsView.tsx — Interactive Leaflet map with real Punjab district boundaries.
 *
 * FEATURES:
 *   • OpenStreetMap tiles with real geographic rendering
 *   • GeoJSON district overlays with choropleth coloring
 *   • Mode tabs: Yield Map | NDVI | NDWI | EVI | Land Cover
 *   • Filters: Crop, Year, Season + Show Map button
 *   • Click districts for drill-down detail panel
 *   • Legend with color scale
 *   • District selection syncs with Districts tab via context
 *   • Sidebar synopsis explaining the feature
 *
 * NOTE: Uses Leaflet directly (not react-leaflet) to avoid React Context compatibility issues.
 */

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cropList, districtDetail, formatNumber, mean } from "../stats";
import { FilterSelect } from "./shared";
import type { Sample } from "../types";
import { yieldColor } from "../theme";
import { useDistrictSelection } from "../App";
import { PUNJAB_GEOJSON, type DistrictFeature } from "../punjab-geo";
import { useWeather, DISTRICT_COORDS } from "../useWeather";

const MODES = ["Yield Map", "NDVI", "NDWI", "EVI", "Land Cover"] as const;
type Mode = (typeof MODES)[number];

/** Punjab center coordinates for the map */
const PUNJAB_CENTER: [number, number] = [31.0, 75.5];
const DEFAULT_ZOOM = 7;

export function MapsView({ samples }: { samples: Sample[] }) {
  const crops = useMemo(() => cropList(samples), [samples]);
  const years = useMemo(() => [...new Set(samples.map((s) => s.Year))].sort((a, b) => b - a), [samples]);
  const seasons = useMemo(() => [...new Set(samples.map((s) => s.Season))].sort(), [samples]);

  const [mode, setMode] = useState<Mode>("Yield Map");
  const [crop, setCrop] = useState("");
  const [year, setYear] = useState("");
  const [season, setSeason] = useState("");
  const [animYear, setAnimYear] = useState(0); // 0 = all years
  const [playing, setPlaying] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const { selectedDistrict, setSelectedDistrict } = useDistrictSelection();
  const { weather } = useWeather(showWeather ? Object.keys(DISTRICT_COORDS).slice(0, 8) : undefined);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [selected, setSelected] = useState<string | null>(selectedDistrict);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => { setSelected(selectedDistrict); }, [selectedDistrict]);

  const allYears = useMemo(() => [...new Set(samples.map((s) => s.Year))].sort(), [samples]);

  const filtered = useMemo(() => {
    let rows = samples;
    if (crop) rows = rows.filter((s) => s.Crop === crop);
    if (animYear > 0) rows = rows.filter((s) => s.Year === animYear);
    else if (year) rows = rows.filter((s) => String(s.Year) === year);
    if (season) rows = rows.filter((s) => s.Season === season);
    return rows;
  }, [samples, crop, year, season, animYear]);

  // --- Time-series animation ---
  useEffect(() => {
    if (!playing) return;
    let idx = 0;
    const years = allYears;
    const interval = setInterval(() => {
      setAnimYear(years[idx % years.length]);
      idx++;
      if (idx >= years.length * 2) {
        setPlaying(false);
        setAnimYear(0);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [playing, allYears]);

  // --- Weather markers overlay ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }
    if (!showWeather || weather.size === 0) return;
    const group = L.layerGroup();
    weather.forEach((w) => {
      const coords = DISTRICT_COORDS[w.district];
      if (!coords) return;
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#fff;border-radius:6px;padding:3px 6px;box-shadow:0 2px 6px rgba(0,0,0,0.2);font-size:10px;font-weight:600;white-space:nowrap;text-align:center;line-height:1.3;border:1px solid #e5e7eb">
          <div style="font-size:14px">${w.icon}</div>
          <div style="color:#374151">${w.temp}°C</div>
          <div style="color:#6b7280;font-size:9px">${w.humidity}%💧</div>
        </div>`,
        iconSize: [60, 50],
        iconAnchor: [30, 25],
      });
      L.marker([coords[0], coords[1]], { icon }).addTo(group);
    });
    group.addTo(map);
    markerLayerRef.current = group;
  }, [showWeather, weather]);

  const detail = useMemo(() => (selected ? districtDetail(samples, selected) : null), [samples, selected]);

  const { districtValues, unit, legendTitle, legendMin, legendMax } = useMemo(() => {
    const byDistrict = new Map<string, number[]>();
    for (const s of filtered) {
      const vals = byDistrict.get(s.District) ?? [];
      vals.push(mode === "NDVI" ? s.NDVI : mode === "NDWI" ? s.NDWI : mode === "EVI" ? s.EVI : s.Yield_kg_ha);
      byDistrict.set(s.District, vals);
    }
    const districtValues = new Map<string, number>();
    for (const [d, vals] of byDistrict) districtValues.set(d, vals.length ? mean(vals) : 0);
    const unit = mode === "Yield Map" ? "kg/ha" : mode === "Land Cover" ? "crop" : "index";
    const legendTitle = mode === "Yield Map" ? "Predicted Yield" : mode;
    const vals = [...districtValues.values()];
    return { districtValues, unit, legendTitle, legendMin: Math.min(...vals, 0), legendMax: Math.max(...vals, 1) };
  }, [filtered, mode]);

  const handleClick = useCallback((name: string) => {
    setSelected(name);
    setSelectedDistrict(name);
  }, [setSelectedDistrict]);

  const all = (vals: string[], placeholder: string) => [{ value: "", label: placeholder }, ...vals.map((v) => ({ value: v, label: v }))];

  /** Initialize Leaflet map */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PUNJAB_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Fit bounds to Punjab
    const bounds = L.latLngBounds(
      [30.1, 74.3], // SW corner
      [32.5, 77.1], // NE corner
    );
    map.fitBounds(bounds.pad(0.05));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /** Update GeoJSON layer when data/filter/selection changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    // Build styled GeoJSON
    const styledData = {
      ...PUNJAB_GEOJSON,
      features: PUNJAB_GEOJSON.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          value: districtValues.get(f.properties.name) ?? 0,
        },
      })),
    };

    const geoJsonLayer = L.geoJSON(styledData as any, {
      style: (feature?: any) => {
        const name = feature?.properties?.name ?? "";
        const value = feature?.properties?.value ?? 0;
        const t = legendMax > legendMin ? (value - legendMin) / (legendMax - legendMin) : 0.5;
        const fill = mode === "Land Cover" ? "#22c55e" : yieldColor(t);
        const isSel = name === selected;
        return {
          fillColor: fill,
          weight: isSel ? 3 : 1.5,
          opacity: 1,
          color: isSel ? "#13261c" : "#ffffff",
          fillOpacity: isSel ? 0.85 : 0.7,
        };
      },
      onEachFeature: (feature: DistrictFeature, layer: L.Layer) => {
        const name = feature.properties.name;
        const value = districtValues.get(name) ?? 0;
        const displayVal = value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(2);

        layer.bindTooltip(
          `<div style="font-weight:600;font-size:12px;font-family:'Segoe UI',sans-serif">${name}</div><div style="font-size:11px;color:#555;font-family:'Segoe UI',sans-serif">${displayVal} ${unit}</div>`,
          { sticky: true, className: "district-tooltip" }
        );

        layer.on({
          click: () => handleClick(name),
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ weight: 3, color: "#13261c", fillOpacity: 0.9 });
            l.bringToFront();
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [districtValues, unit, legendMin, legendMax, mode, selected, handleClick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Synopsis */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #bbf7d0" }}>
        <div className="card-body" style={{ padding: "10px 14px", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
          <b>📡 Interactive District Map</b> — Explore yield predictions, NDVI, NDWI, EVI and Land Cover
          across all 22 Punjab districts on a real geographic map. Each district is color-coded by the selected metric.
          <b> Click any district</b> to drill down. Hover for quick stats. Use filters to narrow by crop, year, or season.
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <button key={m} className={`mode-tab${m === mode ? " active" : ""}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <FilterSelect label="Crop" options={all(crops, "All Crops")} value={crop} onChange={setCrop} />
        <FilterSelect label="Year" options={all(years.map(String), "All Years")} value={animYear > 0 ? String(animYear) : year} onChange={(v) => { setYear(v); setAnimYear(0); setPlaying(false); }} />
        <FilterSelect label="Season" options={all(seasons, "All Seasons")} value={season} onChange={setSeason} />
        <div style={{ flex: 1 }} />
        <button
          className="btn"
          onClick={() => { setPlaying(!playing); if (!playing) setAnimYear(allYears[0]); }}
          style={{ fontSize: 11, padding: "5px 10px", background: playing ? "#dc2626" : "#22c55e", color: "#fff", borderRadius: 4, border: "none", cursor: "pointer" }}
        >
          {playing ? "⏸ Pause" : "▶ Play Years"}
        </button>
        <button
          className="btn"
          onClick={() => setShowWeather(!showWeather)}
          style={{ fontSize: 11, padding: "5px 10px", background: showWeather ? "#3b82f6" : "#e5e7eb", color: showWeather ? "#fff" : "#374151", borderRadius: 4, border: "none", cursor: "pointer" }}
        >
          🌤️ Weather {showWeather ? "ON" : "OFF"}
        </button>
      </div>

      {/* Year animation timeline */}
      {allYears.length > 1 && (
        <div className="card" style={{ padding: "8px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>📅 Timeline:</span>
            <div style={{ flex: 1, display: "flex", gap: 4 }}>
              <button
                onClick={() => { setAnimYear(0); setPlaying(false); }}
                style={{
                  flex: 1, padding: "4px 0", border: `1px solid ${animYear === 0 ? "#22c55e" : "#e5e7eb"}`, borderRadius: 4,
                  background: animYear === 0 ? "#22c55e" : "transparent", color: animYear === 0 ? "#fff" : "#6b7280",
                  fontSize: 11, cursor: "pointer", fontWeight: animYear === 0 ? 600 : 400,
                }}
              >All</button>
              {allYears.map((y) => (
                <button
                  key={y}
                  onClick={() => { setAnimYear(y); setPlaying(false); }}
                  style={{
                    flex: 1, padding: "4px 0", border: `1px solid ${animYear === y ? "#22c55e" : "#e5e7eb"}`, borderRadius: 4,
                    background: animYear === y ? "#22c55e" : "transparent", color: animYear === y ? "#fff" : "#6b7280",
                    fontSize: 11, cursor: "pointer", fontWeight: animYear === y ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >{y}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map + Legend + Detail */}
      <div className="map-layout">
        {/* Leaflet Map */}
        <div className="card" style={{ flex: 1, minWidth: 0, minHeight: 500 }}>
          <div className="card-header">
            <div className="card-title">{mode} — Punjab Districts</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              {filtered.length.toLocaleString()} samples · 22 districts
            </div>
          </div>
          <div style={{ height: 450, borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
            <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>

        {/* Legend + Detail sidebar */}
        <div className="map-sidebar">
          {/* Legend */}
          <div className="legend">
            <div className="legend-title">{legendTitle}</div>
            {Array.from({ length: 6 }).map((_, i) => {
              const val = legendMin + ((legendMax - legendMin) * (i + 1)) / 6;
              return (
                <div className="legend-row" key={i}>
                  <span className="legend-swatch" style={{ background: yieldColor((i + 1) / 6) }} />
                  <span>{Math.round(val).toLocaleString()}</span>
                </div>
              );
            })}
            <div className="legend-unit">{unit}</div>
          </div>

          {/* District Detail */}
          {detail ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">District: {detail.district}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                  {detail.samples} samples · {detail.crops} crops
                </div>
              </div>
              <div className="card-body" style={{ padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{formatNumber(detail.samples)}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>Samples</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{formatNumber(detail.avgYield)}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>Avg Yield</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{detail.crops}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>Crops</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Top Crops by Samples</div>
                {detail.topCrops.slice(0, 5).map((c) => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <div style={{
                      height: 5, borderRadius: 2, background: "#22c55e",
                      width: `${Math.round((c.value / detail.topCrops[0].value) * 80)}%`,
                      maxWidth: 80, minWidth: 8
                    }} />
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{c.label}</span>
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: "100%" }} onClick={() => setSelected(null)}>
                  ✕ Close
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🖱️</div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                  Click any district on the map to see its statistics, top crops and sample distribution.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
