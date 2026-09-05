/**
 * shared.tsx — Reusable UI components and utility functions.
 *
 * COMPONENTS:
 *   • FilterBar / FilterSelect — dropdown filter controls
 *   • SearchInput — text search with magnifying glass icon
 *   • DataTable — styled HTML table with header/body
 *   • statusPill — colored risk-level badges
 *
 * UTILITIES:
 *   • downloadCsv() — generates and downloads a CSV file
 *   • exportDataset() — exports full dataset with standard columns
 */
import type { ReactNode } from "react";

// ---- Filter / search components -------------------------------------------

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="filter-wrap">
      <label className="filter-label">{label}</label>
      <select
        className="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ---- Table ----------------------------------------------------------------

export function DataTable({
  columns,
  rows,
  maxRows = 8,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
  maxRows?: number;
}) {
  const visible = rows.slice(0, maxRows);
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Status pill ----------------------------------------------------------

export function statusPill(level: string): string {
  if (level.includes("High")) return "pill high";
  if (level.includes("Medium")) return "pill medium";
  return "pill low";
}

// ---- CSV helpers ----------------------------------------------------------

export function downloadCsv(
  filename: string,
  header: string[],
  rows: Array<Array<string | number>>,
) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    header.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataset(
  samples: Array<Record<string, unknown>>,
  filename = "agri_rs_dataset.csv",
) {
  const header = [
    "District",
    "Year",
    "Season",
    "Crop",
    "Area_Hectare",
    "Production_Tonnes",
    "Yield_kg_ha",
    "NDVI",
    "NDWI",
    "EVI",
    "Rainfall_mm",
    "Temperature_C",
    "Soil_Moisture",
  ];
  const rows = samples.map((s) =>
    header.map((h) => (s[h] as string | number) ?? ""),
  );
  downloadCsv(filename, header, rows);
}

export { colors } from "../theme";
