"""Locate the CSV files the API serves, on any host.

Locally the full ``data/`` tree is checked out, so :func:`data_path` returns
the canonical path under it. On serverless hosts such as Vercel the ``data/``
directory is excluded from the deployment (it is ~118 MB and gitignored), so
only the handful of small CSVs the API actually reads are shipped, copied flat
into ``api/bundled/``. When the canonical file is missing we fall back to the
bundled copy of the same basename.

Because the bundled copy is flat, file names must be unique across the tree.
They are: every file we bundle has a distinct name.
"""

from pathlib import Path

# src/api/paths.py -> parents[2] is the repository root.
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Flat bundle shipped with the serverless function.
BUNDLED_DIR = PROJECT_ROOT / "api" / "bundled"


def data_path(*parts: str) -> Path:
    """Return the path to a file stored under ``data/``.

    ``parts`` is the path below ``data/``, e.g.
    ``data_path("features", "ml_features.csv")``.

    Prefers the real file in a full checkout; falls back to the bundled copy
    so the API still answers on hosts that only receive the bundle.
    """
    canonical = PROJECT_ROOT.joinpath("data", *parts)
    if canonical.exists():
        return canonical

    return BUNDLED_DIR / Path(*parts).name
