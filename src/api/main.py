from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import crops
from src.api.routes import dataset
from src.api.routes import districts
from src.api.routes import overview
from src.api.routes import predictions
from src.api.routes import reliability


PROJECT_ROOT = Path(__file__).resolve().parents[2]

app = FastAPI(
    title="Agricultural Intelligence API",
    description="Remote sensing based agricultural yield and crop diversification API",
    version="1.0.0",
)

# The dashboard normally reaches the API through its own origin (Vite proxies
# /api in dev, and Vercel rewrites /api/* to this service in production), so
# CORS only matters when the API is called cross-origin directly — local dev
# servers on other ports, or the deployed API opened on its own.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://agri-rs-dashboard.vercel.app",
    "https://agri-rs-dashboard-gcsh448wf-paarth2727-2373.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Covers Vercel preview URLs for future branches of the dashboard.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api/overview", tags=["Overview"])
app.include_router(crops.router, prefix="/api/crops", tags=["Crops"])
app.include_router(
    districts.router, prefix="/api/districts", tags=["Districts"])
app.include_router(predictions.router,
                   prefix="/api/predictions", tags=["Predictions"])
app.include_router(reliability.router,
                   prefix="/api/reliability", tags=["Reliability"])
app.include_router(dataset.router,
                   prefix="/api/dataset", tags=["Dataset"])


@app.get("/")
def root():
    return {
        "name": "Agricultural Intelligence API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "agricultural-intelligence-api",
    }
