/**
 * App.tsx — Root application component for the Agri RS dashboard.
 *
 * ARCHITECTURE:
 *   • Sidebar navigation with 15 tabs (Overview → About)
 *   • Tab content is conditionally rendered with ErrorBoundary per tab
 *   • DistrictContext provides cross-tab district selection sync
 *   • ToastProvider for global notifications
 *   • Dark mode toggle with CSS variables
 *   • Keyboard shortcuts (Ctrl+1-9 for tabs, / for search)
 *   • URL bookmarkable state via query params
 *   • Undo/redo for tab changes via browser history
 *   • i18n: all UI strings go through t(key, lang) for EN/HI/PA
 *   • Data loading: tries FastAPI backend first, falls back to demo.ts
 *
 * DATA FLOW:
 *   DashboardData { samples[], predictions[], live } → passed as props to each view.
 *   Each view computes its own statistics via stats.ts helper functions.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadDashboard, type DashboardData } from "./api";
import type { TabDef, TabId } from "./types";
import { ToastProvider, useToast } from "./ToastContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { OverviewView } from "./views/OverviewView";
import { CropsView } from "./views/CropsView";
import { DistrictsView } from "./views/DistrictsView";
import { PredictionsView } from "./views/PredictionsView";
import { MapsView } from "./views/MapsView";
import { AnalyticsView } from "./views/AnalyticsView";
import { EnvironmentView } from "./views/EnvironmentView";
import { ReliabilityView } from "./views/ReliabilityView";
import { DataExplorerView } from "./views/DataExplorerView";
import { ReportsView } from "./views/ReportsView";
import { AboutView } from "./views/AboutView";
import { SuitabilityView } from "./views/SuitabilityView";
import { ChatbotView } from "./views/ChatbotView";
import { GlossaryView } from "./views/GlossaryView";
import { CompareView } from "./views/CompareView";
import { exportDataset } from "./views/shared";
import { t, LANGUAGES, type Lang } from "./i18n";
import "./app.css";

const TABS: TabDef[] = [
  { id: "overview", label: "tab.overview", icon: "📊" },
  { id: "crops", label: "tab.crops", icon: "🌾" },
  { id: "districts", label: "tab.districts", icon: "🗺️" },
  { id: "predictions", label: "tab.predictions", icon: "🎯" },
  { id: "maps", label: "tab.maps", icon: "📍" },
  { id: "analytics", label: "tab.analytics", icon: "📈" },
  { id: "environment", label: "tab.environment", icon: "🌿" },
  { id: "reliability", label: "tab.reliability", icon: "🛡️" },
  { id: "data", label: "tab.data", icon: "🔎" },
  { id: "reports", label: "tab.reports", icon: "📄" },
  { id: "suitability", label: "tab.suitability", icon: "🌱" },
  { id: "chatbot", label: "tab.chatbot", icon: "🤖" },
  { id: "compare", label: "tab.compare", icon: "⚖️" },
  { id: "glossary", label: "tab.glossary", icon: "📖" },
  { id: "about", label: "tab.about", icon: "ℹ️" },
];

const SUBTITLES: Record<TabId, string> = {
  overview: "sub.overview",
  crops: "sub.crops",
  districts: "sub.districts",
  predictions: "sub.predictions",
  maps: "sub.maps",
  analytics: "sub.analytics",
  environment: "sub.environment",
  reliability: "sub.reliability",
  data: "sub.data",
  reports: "sub.reports",
  about: "sub.about",
  suitability: "sub.suitability",
  chatbot: "sub.chatbot",
  compare: "sub.compare",
  glossary: "sub.glossary",
};

interface DistrictContextType {
  selectedDistrict: string | null;
  setSelectedDistrict: (district: string | null) => void;
}

const DistrictContext = createContext<DistrictContextType>({
  selectedDistrict: null,
  setSelectedDistrict: () => {},
});

export function useDistrictSelection() {
  return useContext(DistrictContext);
}

function AppInner() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Dark mode ---
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("agri_dark") === "1"; } catch { return false; }
  });

  // --- Language with persistence ---
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("agri_lang") as Lang) || "en"; } catch { return "en"; }
  });

  // --- URL bookmarkable tab state ---
  const [tab, setTabState] = useState<TabId>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab") as TabId | null;
    if (urlTab && TABS.some((t) => t.id === urlTab)) return urlTab;
    return "overview";
  });

  // --- Undo/redo via browser history ---
  const historyRef = useRef<TabId[]>([tab]);
  const historyIdx = useRef(0);
  const skipHistory = useRef(false);

  const setTab = useCallback((newTab: TabId) => {
    if (newTab === tab) return;
    setTabState(newTab);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.pushState({ tab: newTab }, "", url.toString());
    // Track history for undo
    if (!skipHistory.current) {
      historyRef.current = [...historyRef.current.slice(0, historyIdx.current + 1), newTab];
      historyIdx.current = historyRef.current.length - 1;
    }
  }, [tab]);

  // Handle browser back/forward
  useEffect(() => {
    const handler = (_e: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as TabId | null;
      if (urlTab && TABS.some((t) => t.id === urlTab)) {
        skipHistory.current = true;
        setTabState(urlTab);
        skipHistory.current = false;
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+1 through Ctrl+9 for tabs
      if (e.ctrlKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (TABS[idx]) setTab(TABS[idx].id);
      }
      // / to focus search (if any input exists)
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".filter-input")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setTab]);

  // --- Dark mode effect ---
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("agri_dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  // --- Data loading ---
  useEffect(() => {
    let cancelled = false;
    loadDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem("agri_lang", newLang); } catch {}
    toast(`Language changed to ${newLang.toUpperCase()}`, "success");
  };

  const activeTab = useMemo(() => TABS.find((t) => t.id === tab) ?? TABS[0], [tab]);

  const exportCSV = () => {
    if (data) {
      exportDataset(data.samples as unknown as Array<Record<string, unknown>>);
      toast("Dataset exported as CSV", "success");
    }
  };

  return (
    <DistrictContext.Provider value={{ selectedDistrict, setSelectedDistrict }}>
      <div className={`app${dark ? " dark" : ""}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="logo">🌾</span>
            <div>
              <div className="logo-text">Agri RS</div>
              <div className="logo-subtitle">{t("app.logo", lang)}</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {TABS.map((tabDef) => (
              <button
                key={tabDef.id}
                className={`nav-item${tab === tabDef.id ? " active" : ""}`}
                onClick={() => setTab(tabDef.id)}
              >
                <span className="nav-icon">{tabDef.icon}</span>
                <span>{t(tabDef.label, lang)}</span>
              </button>
            ))}
          </nav>
          {/* Dark mode + Language selector */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setDark(!dark)}
              style={{
                width: "100%", padding: "5px 8px", marginBottom: 6, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4,
                background: "rgba(255,255,255,0.08)", color: "#b8d4c8", fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  style={{
                    flex: 1, padding: "4px 6px", border: "none", borderRadius: 4,
                    background: lang === l.code ? "#22c55e" : "rgba(255,255,255,0.08)",
                    color: lang === l.code ? "#fff" : "#b8d4c8",
                    fontSize: 10, fontWeight: lang === l.code ? 600 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="sidebar-footer">© 2026 Agri RS</div>
        </aside>

        {/* Main */}
        <main className="main">
          <header className="header">
            <div>
              <h1 className="header-title">{t("app.title", lang)}</h1>
              <p className="header-subtitle">{t(SUBTITLES[tab], lang)}</p>
            </div>
            <div className="header-right" style={{ gap: 6 }}>
              {data && (
                <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                  <span className="badge-dot" style={{ background: "#0369a1" }} />
                  {data.samples.length.toLocaleString()} samples
                </span>
              )}
              <span className={`badge ${data?.live ? "badge-live" : "badge-demo"}`}>
                <span className="badge-dot" />
                {data?.live ? t("app.live", lang) : t("app.demo", lang)}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ fontSize: 11, padding: "3px 8px" }}>📥 CSV</button>
              <span className="tab-indicator">📌 {activeTab.label.startsWith("tab.") ? t(activeTab.label, lang) : activeTab.label}</span>
            </div>
          </header>

          <div className="content">
            {!data ? (
              <div className="loader">
                <div className="spinner" />
                <p>{loadError ? t("app.error", lang) : t("app.loading", lang)}</p>
              </div>
            ) : (
              <ErrorBoundary tabName={activeTab.label.startsWith("tab.") ? t(activeTab.label, lang) : activeTab.label} key={tab}>
                {tab === "overview" && <OverviewView samples={data.samples} predictions={data.predictions} />}
                {tab === "crops" && <CropsView samples={data.samples} onExport={() => { exportDataset(data.samples as unknown as Array<Record<string, unknown>>); toast("CSV exported", "success"); }} />}
                {tab === "districts" && <DistrictsView samples={data.samples} onExport={() => { exportDataset(data.samples as unknown as Array<Record<string, unknown>>); toast("CSV exported", "success"); }} />}
                {tab === "predictions" && <PredictionsView samples={data.samples} predictions={data.predictions} />}
                {tab === "maps" && <MapsView samples={data.samples} />}
                {tab === "analytics" && <AnalyticsView samples={data.samples} />}
                {tab === "environment" && <EnvironmentView samples={data.samples} />}
                {tab === "reliability" && <ReliabilityView predictions={data.predictions} />}
                {tab === "data" && <DataExplorerView samples={data.samples} />}
                {tab === "reports" && <ReportsView samples={data.samples} predictions={data.predictions} />}
                {tab === "suitability" && <SuitabilityView lang={lang} />}
                {tab === "chatbot" && <ChatbotView lang={lang} />}
                {tab === "compare" && <CompareView samples={data.samples} />}
                {tab === "glossary" && <GlossaryView lang={lang} />}
                {tab === "about" && <AboutView samples={data.samples.length} />}
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
    </DistrictContext.Provider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
