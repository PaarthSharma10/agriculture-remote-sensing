/**
 * theme.ts — Color palette and utility functions for the Agri RS dashboard.
 *
 * PALETTE:
 *   • Dark green sidebar (#0a2e1f → #0d3b2b)
 *   • White panels with subtle shadows
 *   • Green accents (#22c55e primary, #0e7a38 dark)
 *
 * FUNCTIONS:
 *   • yieldColor(t) — sequential green colormap for choropleth maps (0→1)
 *   • palette(i)    — categorical color palette for crop/district distinction
 */
// Palette matching the mockup: dark-green sidebar, white panels, green accents.
export const colors = {
  bg: "#0b1f16",
  sidebar: "#003322",
  sidebarLight: "#0a4a34",
  sidebarActive: "#16a34a",
  panel: "#ffffff",
  panelMuted: "#f4f7f5",
  border: "#dce5df",
  text: "#13261c",
  textMuted: "#5b7266",
  accent: "#16a34a",
  accentDark: "#0e7a38",
  accentLight: "#dcf5e6",
  grid: "#e3ece7",
  danger: "#d9534f",
  warn: "#e0a800",
};

// Sequential green colormap used by charts and the 3D map.
export function yieldColor(t: number): string {
  const stops: Array<[number, string]> = [
    [0.0, "#f1f8e9"],
    [0.25, "#c8e6c9"],
    [0.5, "#81c784"],
    [0.75, "#43a047"],
    [1.0, "#0e7a38"],
  ];
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [x0, c0] = stops[i - 1];
      const [x1, c1] = stops[i];
      const f = (x - x0) / (x1 - x0 || 1);
      return lerpColor(c0, c1, f);
    }
  }
  return stops[stops.length - 1][1];
}

function lerpColor(a: string, b: string, f: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * f);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * f);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * f);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const PALETTE = [
  "#16a34a",
  "#0e7a38",
  "#66bb6a",
  "#2e7d32",
  "#a5d6a7",
  "#1b5e20",
  "#81c784",
  "#43a047",
  "#388e3c",
  "#c8e6c9",
  "#00695c",
  "#4db6ac",
];

export function palette(i: number): string {
  return PALETTE[i % PALETTE.length];
}

// distanceFactor for drei <Html> overlays. drei scales DOM content by
// DF / cameraDistance, so DF is tied to the window height to keep text in
// proportion with the 3D panels at any window size. Updated at runtime by
// the DFAdapter in App.tsx.
export let DF = 32;
export function updateDF(value: number) {
  DF = value;
}