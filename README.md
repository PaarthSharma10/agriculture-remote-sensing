# Agriculture Remote Sensing — Crop Yield Prediction & Analytics

Satellite-imagery + ML pipeline that predicts crop yields for Punjab districts,
with a **3D web dashboard** built on Three.js / React.

```
├── data/                  CSVs (ml dataset, predictions, reliability, boundaries)
├── src/
│   ├── api/               FastAPI backend (serves data to the dashboard)
│   │   └── routes/        overview, crops, districts, predictions, reliability, dataset
│   ├── analysis/          EDA + ML + reliability analysis scripts
│   ├── models/            model training / prediction code
│   └── config.py          study districts, years, satellite collections
├── notebooks/             (optional) notebooks
└── web/                   Vite + React + Three.js 3D dashboard
```

## 3D Dashboard (`web/`)

A normal, straight-facing dashboard (no tilted/orbiting scene) whose *features*
are true 3D elements — extruded bar/line/donut/scatter charts, a 3D extruded
district map, floating panels, and hover/click interactions.

Ten tabs, mirroring the mockup:

| Tab | Content |
| --- | --- |
| Overview | metric cards, model performance, samples-over-years bars, top-crops & season donuts |
| Crops | searchable crop list, crop details (line chart, recent-data table) |
| Districts | district list, district details (bars, donut) |
| Predictions | filters, actual vs predicted scatter, details panel, recent predictions table |
| Maps | 3D extruded Punjab district terrain, Yield/NDVI/NDWI/EVI/Land Cover modes |
| Analytics | yield trends line, yield-distribution histogram, summary stats, district×year 3D bar surface |
| Reliability | uncertainty histogram, reliability diagram, risk breakdown |
| Data Explorer | filterable paginated table, CSV export |
| Reports | six one-click CSV report generators |
| About | data sources, methodology |

### Run it

```bash
# 1. Start the FastAPI backend (serves the real CSVs on :8000)
.venv/Scripts/python -m uvicorn src.api.main:app --port 8000
# or: source .venv/Scripts/activate && uvicorn src.api.main:app --port 8000

# 2. Start the dashboard (Vite dev server on :5173, proxies /api to :8000)
cd web
npm install
npm run dev
```

Open http://localhost:5173.

- With the backend running the header shows **LIVE DATA** (real 162-row dataset,
  reliability predictions, Punjab district boundaries).
- Without the backend the dashboard automatically falls back to a **DEMO DATA**
  mode (deterministic 6,000-row synthetic dataset) so it always renders.

### Tech

- Vite + React 18 + TypeScript
- Three.js via `@react-three/fiber` + `@react-three/drei`
- `Html` overlays (DOM) anchored in the 3D scene for readable text/tables;
  charts, panels and the map are real 3D geometry
- Mouse wheel zooms; hover lifts/highlights 3D elements with tooltips

### Production build

```bash
cd web && npm run build   # outputs dist/
```