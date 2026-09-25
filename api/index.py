"""Vercel serverless entry point for the Agricultural Intelligence API.

Vercel's Python builder imports this module and exposes ``app`` as the ASGI
application. The FastAPI app itself lives in ``src/api/main.py`` so that the
local ``uvicorn src.api.main:app`` server and the serverless deployment run
exactly the same code — this file only exists to satisfy the builder and to
put the repository root on ``sys.path``.

Routes are unchanged from local dev: /api/overview, /api/crops,
/api/districts, /api/predictions, /api/reliability, /api/dataset, plus / and
/health for smoke tests. The dashboard only calls /api/dataset and
/api/predictions.
"""

from __future__ import annotations

import sys
from pathlib import Path

# The builder executes api/index.py on its own, so make the repository root
# importable before pulling in the `src` package.
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.api.main import app  # noqa: E402  (must follow the sys.path fix)

__all__ = ["app"]
