/**
 * AboutView.tsx — Project information, data sources, and methodology.
 *
 * Two-column layout: Data Sources (Sentinel-2, Landsat-8, ERA5, Ag Stats) on the
 * left, Methodology (Collection → Features → Training → Prediction) on the right.
 * Bottom: project description with sample/district/crop/year counts.
 */
const DATA_SOURCES = [
  { icon: "🛰️", name: "Sentinel-2", desc: "10m multispectral imagery" },
  { icon: "🌍", name: "Landsat-8", desc: "30m land-surface reflectance" },
  { icon: "🌡️", name: "ERA5 Climate Data", desc: "temperature, rainfall, moisture" },
  { icon: "📈", name: "Agricultural Statistics", desc: "district-level yield records" },
];

const METHOD_STEPS = [
  { icon: "📥", title: "Data Collection", desc: "Satellite imagery, climate variables, and district yield statistics" },
  { icon: "🔧", title: "Feature Engineering", desc: "NDVI, NDWI, EVI vegetation indices + climate features" },
  { icon: "🧠", title: "Model Training", desc: "ML regression with calibrated uncertainty estimates" },
  { icon: "📊", title: "Prediction & Analytics", desc: "Yield forecasts with confidence intervals and insights" },
];

export function AboutView({ samples }: { samples: number }) {
  return (
    <div>
      <div className="grid-2">
        {/* Data Sources */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Data Sources</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>satellite + climate + statistics</div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DATA_SOURCES.map((s) => (
              <div className="source-card" key={s.name}>
                <div className="source-icon">{s.icon}</div>
                <div>
                  <div className="source-name">{s.name}</div>
                  <div className="source-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Methodology</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>how predictions are made</div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {METHOD_STEPS.map((s, i) => (
              <div className="source-card" key={s.title}>
                <div className="source-icon">{s.icon}</div>
                <div>
                  <div className="source-name">{i + 1}. {s.title}</div>
                  <div className="source-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About text */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">About</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>project overview</div>
        </div>
        <div className="card-body">
          <div className="about-text">
            This project uses satellite imagery, environmental data, and machine
            learning to predict crop yields across Punjab districts and provide
            actionable insights for agriculture planning. It combines Sentinel-2
            and Landsat vegetation indices with ERA5 climate variables and
            district-level statistics to forecast Kharif and Rabi yields with
            calibrated uncertainty estimates.
          </div>
          <div className="about-stats">
            <span className="about-stat"><b>{samples.toLocaleString()}</b> samples</span>
            <span className="about-stat"><b>22</b> districts</span>
            <span className="about-stat"><b>17</b> crops</span>
            <span className="about-stat"><b>5</b> years</span>
          </div>
        </div>
      </div>

      <div className="about-foot">
        © 2025 Agriculture Remote Sensing Project · Crop Yield Prediction & Analytics
      </div>
    </div>
  );
}
