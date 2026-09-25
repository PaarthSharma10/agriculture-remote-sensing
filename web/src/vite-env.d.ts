/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Which dataset the dashboard loads:
   *  - "live" — fetch /api/dataset + /api/predictions, fall back to demo on failure
   *  - "demo" — always use the synthetic dataset (demo.ts); no /api calls at all
   * Set in .env.production / .env.local. Defaults to "live".
   */
  readonly VITE_DATA_MODE?: "live" | "demo";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
