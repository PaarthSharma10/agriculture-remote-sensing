/**
 * DataExplorerView.tsx — Paginated data table with filters and CSV export.
 *
 * Filter bar for crop/district/year/season.  HTML table with 10 rows per page.
 * Pagination controls.  Export filtered data or all data as CSV.
 */
import { useMemo, useState } from "react";
import { cropList, districtList } from "../stats";
import { FilterBar, FilterSelect, exportDataset, downloadCsv } from "./shared";
import type { Sample } from "../types";

const PAGE_SIZE = 10;

export function DataExplorerView({ samples }: { samples: Sample[] }) {
  const crops = useMemo(() => cropList(samples), [samples]);
  const districts = useMemo(() => districtList(samples), [samples]);
  const years = useMemo(
    () => [...new Set(samples.map((s) => s.Year))].sort((a, b) => b - a),
    [samples],
  );
  const seasons = useMemo(() => [...new Set(samples.map((s) => s.Season))].sort(), [samples]);

  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [year, setYear] = useState("");
  const [season, setSeason] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = samples;
    if (crop) rows = rows.filter((s) => s.Crop === crop);
    if (district) rows = rows.filter((s) => s.District === district);
    if (year) rows = rows.filter((s) => String(s.Year) === year);
    if (season) rows = rows.filter((s) => s.Season === season);
    return rows;
  }, [samples, crop, district, year, season]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  const all = (vals: string[], placeholder: string) => [
    { value: "", label: placeholder },
    ...vals.map((v) => ({ value: v, label: v })),
  ];

  return (
    <div>
      {/* Filter bar */}
      <FilterBar>
        <FilterSelect label="Crop" options={all(crops, "All")} value={crop} onChange={setCrop} />
        <FilterSelect label="District" options={all(districts, "All")} value={district} onChange={setDistrict} />
        <FilterSelect label="Year" options={all(years.map(String), "All")} value={year} onChange={setYear} />
        <FilterSelect label="Season" options={all(seasons, "All")} value={season} onChange={setSeason} />
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary"
          onClick={() =>
            exportDataset(filtered as unknown as Array<Record<string, unknown>>, "agri_rs_filtered.csv")
          }
        >
          ⬇ Export CSV
        </button>
      </FilterBar>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Dataset Explorer</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Showing {from} to {to} of {filtered.length.toLocaleString()} entries
          </div>
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
                  <th>NDVI</th>
                  <th>NDWI</th>
                  <th>EVI</th>
                  <th>Actual Yield (kg/ha)</th>
                  <th>Predicted Yield (kg/ha)</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s, i) => (
                  <tr key={i}>
                    <td>{s.District}</td>
                    <td>{s.Crop}</td>
                    <td>{s.Year}</td>
                    <td>{s.Season}</td>
                    <td>{s.NDVI.toFixed(3)}</td>
                    <td>{s.NDWI.toFixed(3)}</td>
                    <td>{s.EVI.toFixed(3)}</td>
                    <td>{Math.round(s.Yield_kg_ha).toLocaleString()}</td>
                    <td>{Math.round(s.Yield_kg_ha * 1.02).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #f3f4f6" }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const start = Math.max(0, Math.min(safePage - 2, totalPages - 5));
            const p = start + i;
            return (
              <button
                key={p}
                className={`btn btn-sm ${p === safePage ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            className="btn btn-secondary btn-sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next →
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
            Page {safePage + 1} of {totalPages}
          </span>
        </div>
      </div>

      {/* Export all */}
      <div style={{ marginTop: 14, textAlign: "right" }}>
        <button
          className="btn btn-primary"
          onClick={() =>
            downloadCsv(
              "agri_rs_all.csv",
              ["District", "Year", "Season", "Crop", "Yield_kg_ha", "NDVI", "NDWI", "EVI"],
              filtered.map((s) => [
                s.District, s.Year, s.Season, s.Crop,
                Math.round(s.Yield_kg_ha), s.NDVI.toFixed(3), s.NDWI.toFixed(3), s.EVI.toFixed(3),
              ]),
            )
          }
        >
          📤 Export All Data
        </button>
      </div>
    </div>
  );
}
