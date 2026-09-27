/**
 * chatKnowledge.ts — Project knowledge base for the AI Assistant.
 *
 * PURPOSE:
 *   Lets KisanAI answer questions about the PROJECT ITSELF — not just the data:
 *   what the project is, data sources (Sentinel-2 / Landsat-8/9 / ERA5), the ML
 *   pipeline (feature engineering, model candidates, GroupKFold validation),
 *   the live-vs-demo data story (and its honest caveats), the tech stack, the
 *   FastAPI backend, deployment, plus a full multilingual glossary of technical
 *   terms with formulas.
 *
 *   All facts are drawn from the repository itself: src/config.py, src/models/*,
 *   README.md, web/src/views/AboutView.tsx and GlossaryView.tsx — so answers
 *   match what the code actually does.
 *
 * STRUCTURE:
 *   Each entry has multilingual trigger keywords (English, romanized Hindi/
 *   Punjabi, Devanagari, Gurmukhi) and a markdown answer per language.
 *   findKnowledge(input) scores entries by keyword hits and returns the best
 *   matches; chatbot.ts routes definitional/project questions here.
 */

import type { Lang } from "./i18n";

export type KBRole = "project" | "pipeline" | "data" | "deployment" | "glossary";

export interface KnowledgeEntry {
  id: string;
  role: KBRole;
  keywords: string[];
  answer: Record<Lang, string>;
  followUps?: Partial<Record<Lang, string[]>>;
}

const F = (s: string) => `\`${s}\``; // inline code for formulas

export const PROJECT_KB: KnowledgeEntry[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // PROJECT
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "overview",
    role: "project",
    keywords: [
      "what is this project", "about this project", "about the project", "this project", "this dashboard",
      "what is agri", "agri rs", "agriculture remote sensing", "who built", "who made", "purpose of",
      "यह प्रोजेक्ट", "यह डैशबोर्ड", "परियोजना के बारे", "किसने बनाया", "इसका उद्देश्य",
      "ਇਹ ਪ੍ਰੋਜੈਕਟ", "ਇਹ ਡੈਸ਼ਬੋਰਡ", "ਪ੍ਰੋਜੈਕਟ ਬਾਰੇ", "ਕਿਸਨੇ ਬਣਾਇਆ", "ਮਕਸਦ",
    ],
    answer: {
      en: `### 🌾 About this project\n\n**Agriculture Remote Sensing** predicts crop yields across Punjab's 22 districts by combining satellite imagery, climate data and machine learning.\n\n• **Inputs:** Sentinel-2 (10 m) + Landsat-8/9 (30 m) vegetation indices, ERA5 climate variables, district-level agricultural statistics\n• **Output:** crop yield forecasts (kg/ha) with calibrated 95% prediction intervals and reliability scoring\n• **Interface:** a React + Three.js 3D dashboard with 15 tabs — maps, predictions, reliability, reports and this assistant\n• **Seasons covered:** Kharif (Jun–Oct) and Rabi (Nov–Apr), years 2021–2025\n\nThe goal: give farmers, researchers and planners early, honest yield signals before harvest.`,
      hi: `### 🌾 इस प्रोजेक्ट के बारे में\n\n**Agriculture Remote Sensing** सैटेलाइट इमेजरी, जलवायु डेटा और मशीन लर्निंग को मिलाकर पंजाब के 22 जिलों की फसल उपज का पूर्वानुमान लगाता है।\n\n• **इनपुट:** Sentinel-2 (10 मी) + Landsat-8/9 (30 मी) वनस्पति सूचकांक, ERA5 जलवायु वेरिएबल, जिला-स्तरीय कृषि आंकड़े\n• **आउटपुट:** कैलिब्रेटेड 95% भविष्यवाणी अंतराल और विश्वसनीयता स्कोर के साथ उपज पूर्वानुमान (kg/ha)\n• **इंटरफ़ेस:** React + Three.js 3D डैशबोर्ड, 15 टैब — मानचित्र, पूर्वानुमान, विश्वसनीयता, रिपोर्ट और यह सहायक\n• **मौसम:** खरीफ (जून–अक्टूबर) और रबी (नवंबर–अप्रैल), वर्ष 2021–2025\n\nलक्ष्य: किसानों, शोधकर्ताओं और योजनाकारों को फसल कटाई से पहले सही और ईमानदार उपज संकेत देना।`,
      pa: `### 🌾 ਇਸ ਪ੍ਰੋਜੈਕਟ ਬਾਰੇ\n\n**Agriculture Remote Sensing** ਸੈਟੇਲਾਈਟ ਤਸਵੀਰਾਂ, ਮੌਸਮੀ ਡੇਟਾ ਅਤੇ ਮਸ਼ੀਨ ਲਰਨਿੰਗ ਨੂੰ ਮਿਲਾ ਕੇ ਪੰਜਾਬ ਦੇ 22 ਜ਼ਿਲ੍ਹਿਆਂ ਦੇ ਫ਼ਸਲ ਝਾੜ ਦਾ ਅਨੁਮਾਨ ਲਗਾਉਂਦਾ ਹੈ।\n\n• **ਇਨਪੁੱਟ:** Sentinel-2 (10 ਮੀ) + Landsat-8/9 (30 ਮੀ) ਬਨਸਪਤੀ ਸੂਚਕ, ERA5 ਮੌਸਮੀ ਵੇਰਵੇ, ਜ਼ਿਲ੍ਹਾ-ਪੱਧਰੀ ਖੇਤੀ ਅੰਕੜੇ\n• **ਆਉਟਪੁੱਟ:** ਕੈਲੀਬ੍ਰੇਟਿਡ 95% ਭਵਿੱਖਬਾਣੀ ਅੰਤਰਾਲ ਤੇ ਭਰੋਸੇਯੋਗਤਾ ਸਕੋਰ ਸਮੇਤ ਝਾੜ ਅਨੁਮਾਨ (kg/ha)\n• **ਇੰਟਰਫੇਸ:** React + Three.js 3D ਡੈਸ਼ਬੋਰਡ, 15 ਟੈਬ — ਨਕਸ਼ੇ, ਭਵਿੱਖਬਾਣੀਆਂ, ਭਰੋਸੇਯੋਗਤਾ, ਰਿਪੋਰਟਾਂ ਤੇ ਇਹ ਸਹਾਇਕ\n• **ਰੁੱਤਾਂ:** ਸਰਦ/ਖ਼ਰੀਫ (ਜੂਨ–ਅਕਤੂਬਰ) ਤੇ ਰੱਬੀ (ਨਵੰਬਰ–ਅਪ੍ਰੈਲ), ਸਾਲ 2021–2025\n\nਮਕਸਦ: ਕਿਸਾਨਾਂ, ਖੋਜੀਆਂ ਤੇ ਯੋਜਨਾਬੰਦਾਂ ਨੂੰ ਵਾਢੀ ਤੋਂ ਪਹਿਲਾਂ ਸਹੀ ਤੇ ਇਮਾਨਦਾਰ ਝਾੜ ਸੰਕੇਤ ਦੇਣਾ।`,
    },
    followUps: {
      en: ["What data sources does it use?", "How was the model trained?", "What are the limitations?"],
      hi: ["इसमें कौन-से डेटा स्रोत हैं?", "मॉडल कैसे प्रशिक्षित हुआ?", "इसकी सीमाएँ क्या हैं?"],
      pa: ["ਇਸ ਵਿੱਚ ਕਿਹੜੇ ਡੇਟਾ ਸਰੋਤ ਹਨ?", "ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?", "ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?"],
    },
  },
  {
    id: "dataSources",
    role: "data",
    keywords: [
      "data source", "where does the data", "satellite", "sentinel", "landsat", "era5", "earth engine",
      "which satellite", "climate data", "statistics source", "डेटा स्रोत", "सैटेलाइट से", "कहाँ से डेटा",
      "ਡੇਟਾ ਸਰੋਤ", "ਸੈਟੇਲਾਈਟ", "ਕਿਥੋਂ ਡੇਟਾ",
    ],
    answer: {
      en: `### 🛰️ Data sources\n\n• **Sentinel-2** — ${F("COPERNICUS/S2_SR_HARMONIZED")}, 10 m multispectral imagery → NDVI, NDWI, EVI\n• **Landsat-8** — ${F("LANDSAT/LC08/C02/T1_L2")} and **Landsat-9** — ${F("LANDSAT/LC09/C02/T1_L2")}, 30 m surface reflectance → backup indices + land-surface temperature\n• **ERA5 reanalysis** — temperature, rainfall and soil-moisture variables per district-season\n• **District agricultural statistics** — official area/production/yield records used as the prediction target\n\nAll satellite access goes through **Google Earth Engine**; features are aggregated per district × year × season (22 districts × 2021–2025 × Kharif/Rabi).`,
      hi: `### 🛰️ डेटा स्रोत\n\n• **Sentinel-2** — ${F("COPERNICUS/S2_SR_HARMONIZED")}, 10 मी मल्टीस्पेक्ट्रल इमेजरी → NDVI, NDWI, EVI\n• **Landsat-8** — ${F("LANDSAT/LC08/C02/T1_L2")} और **Landsat-9** — ${F("LANDSAT/LC09/C02/T1_L2")}, 30 मी सरफ़ेस रिफ्लेक्टेंस → बैकअप सूचकांक + सतह तापमान\n• **ERA5 रिएनालिसिस** — प्रति जिला-मौसम तापमान, वर्षा और मिट्टी की नमी\n• **जिला कृषि आंकड़े** — आधिकारिक क्षेत्रफल/उत्पादन/उपज रिकॉर्ड, यही प्रेडिक्शन का लक्ष्य है\n\nसारी सैटेलाइट पहुँच **Google Earth Engine** से होती है; फ़ीचर प्रति जिला × वर्ष × मौसम एकत्र किए जाते हैं (22 जिले × 2021–2025 × खरीफ/रबी)।`,
      pa: `### 🛰️ ਡੇਟਾ ਸਰੋਤ\n\n• **Sentinel-2** — ${F("COPERNICUS/S2_SR_HARMONIZED")}, 10 ਮੀ ਮਲਟੀਸਪੈਕਟਰਲ ਤਸਵੀਰਾਂ → NDVI, NDWI, EVI\n• **Landsat-8** — ${F("LANDSAT/LC08/C02/T1_L2")} ਤੇ **Landsat-9** — ${F("LANDSAT/LC09/C02/T1_L2")}, 30 ਮੀ ਸਰਫ਼ੇਸ ਰਿਫਲੈਕਟੈਂਸ → ਬੈਕਅੱਪ ਸੂਚਕ + ਸਤ੍ਹਾ ਤਾਪਮਾਨ\n• **ERA5 ਰੀਐਨਾਲਿਸਿਸ** — ਹਰ ਜ਼ਿਲ੍ਹਾ-ਰੁੱਤ ਲਈ ਤਾਪਮਾਨ, ਮੀਂਹ ਤੇ ਮਿੱਟੀ ਦੀ ਨਮੀ\n• **ਜ਼ਿਲ੍ਹਾ ਖੇਤੀ ਅੰਕੜੇ** — ਸਰਕਾਰੀ ਰਕਬਾ/ਪੈਦਾਵਾਰ/ਝਾੜ ਰਿਕਾਰਡ — ਇਹੀ ਭਵਿੱਖਬਾਣੀ ਦਾ ਟੀਚਾ ਹੈ\n\nਸਾਰੀ ਸੈਟੇਲਾਈਟ ਪਹੁੰਚ **Google Earth Engine** ਰਾਹੀਂ ਹੁੰਦੀ ਹੈ; ਫ਼ੀਚਰ ਹਰ ਜ਼ਿਲ੍ਹਾ × ਸਾਲ × ਰੁੱਤ ਲਈ ਬਣਾਏ ਜਾਂਦੇ ਹਨ (22 ਜ਼ਿਲ੍ਹੇ × 2021–2025 × ਖ਼ਰੀਫ/ਰੱਬੀ)।`,
    },
    followUps: {
      en: ["What features go into the model?", "What is NDVI?", "Demo data vs live data?"],
      hi: ["मॉडल में कौन-से फ़ीचर जाते हैं?", "NDVI क्या है?", "डेमो बनाम लाइव डेटा?"],
      pa: ["ਮਾਡਲ ਵਿੱਚ ਕਿਹੜੇ ਫ਼ੀਚਰ ਜਾਂਦੇ ਹਨ?", "NDVI ਕੀ ਹੈ?", "ਡੈਮੋ ਬਨਾਮ ਲਾਈਵ ਡੇਟਾ?"],
    },
  },
  {
    id: "methodology",
    role: "pipeline",
    keywords: [
      "methodology", "how does it work", "how is it made", "pipeline", "workflow", "steps", "process",
      "how are predictions made", "how do you predict", "पद्धति", "कार्यप्रणाली", "कैसे काम", "प्रक्रिया",
      "ਵਿਧੀ", "ਕਾਰਜ-ਪ੍ਰਣਾਲੀ", "ਕਿਵੇਂ ਕੰਮ", "ਕਿਵੇਂ ਬਣਿਆ",
    ],
    answer: {
      en: `### 🔬 Methodology — end to end\n\n1. **Data collection** — Sentinel-2 + Landsat imagery and ERA5 climate variables per district-season, plus official district yield statistics\n2. **Feature engineering** — vegetation indices (NDVI, NDWI, EVI), rainfall, temperature, soil moisture, district and crop identity\n3. **Model training** — several regressors compared with grouped cross-validation (see *"how was the model trained?"*); the best is selected on validation scores\n4. **Prediction & reliability** — yields forecast with 95% prediction intervals, uncertainty %, and a per-prediction risk score (Low/Medium/High)\n\nEverything is reproducible from the scripts in ${F("src/")} — processing, feature building, training and evaluation are separate stages.`,
      hi: `### 🔬 कार्यप्रणाली — शुरू से अंत तक\n\n1. **डेटा संग्रह** — प्रति जिला-मौसम Sentinel-2 + Landsat इमेजरी, ERA5 जलवायु वेरिएबल, और आधिकारिक जिला उपज आंकड़े\n2. **फ़ीचर इंजीनियरिंग** — वनस्पति सूचकांक (NDVI, NDWI, EVI), वर्षा, तापमान, मिट्टी की नमी, जिला व फसल पहचान\n3. **मॉडल प्रशिक्षण** — कई रिग्रेसर ग्रुप्ड क्रॉस-वैलिडेशन से तुलने जाते हैं (*"मॉडल कैसे प्रशिक्षित हुआ?"* देखें); सबसे अच्छा वैलिडेशन स्कोर पर चुना जाता है\n4. **भविष्यवाणी और विश्वसनीयता** — 95% अंतराल, अनिश्चितता % और प्रति-भविष्यवाणी जोखिम स्कोर (कम/मध्यम/उच्च) के साथ उपज पूर्वानुमान\n\n${F("src/")} की स्क्रिप्ट्स से सब कुछ दोहराया जा सकता है — प्रोसेसिंग, फ़ीचर निर्माण, प्रशिक्षण और मूल्यांकन अलग-अलग चरण हैं।`,
      pa: `### 🔬 ਕਾਰਜ-ਪ੍ਰਣਾਲੀ — ਸ਼ੁਰੂ ਤੋਂ ਅੰਤ ਤੱਕ\n\n1. **ਡੇਟਾ ਇਕੱਠਾ ਕਰਨਾ** — ਹਰ ਜ਼ਿਲ੍ਹਾ-ਰੁੱਤ ਲਈ Sentinel-2 + Landsat ਤਸਵੀਰਾਂ, ERA5 ਮੌਸਮੀ ਵੇਰਵੇ, ਤੇ ਸਰਕਾਰੀ ਜ਼ਿਲ੍ਹਾ ਝਾੜ ਅੰਕੜੇ\n2. **ਫ਼ੀਚਰ ਇੰਜੀਨੀਅਰਿੰਗ** — ਬਨਸਪਤੀ ਸੂਚਕ (NDVI, NDWI, EVI), ਮੀਂਹ, ਤਾਪਮਾਨ, ਮਿੱਟੀ ਦੀ ਨਮੀ, ਜ਼ਿਲ੍ਹਾ ਤੇ ਫ਼ਸਲ ਪਛਾਣ\n3. **ਮਾਡਲ ਸਿਖਲਾਈ** — ਕਈ ਰਿਗਰੈਸਰ ਗਰੁੱਪਡ ਕਰਾਸ-ਵੈਲੀਡੇਸ਼ਨ ਨਾਲ ਤੁਲਨੇ ਜਾਂਦੇ ਹਨ (*"ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?"* ਵੇਖੋ); ਵਧੀਆ ਵੈਲੀਡੇਸ਼ਨ ਸਕੋਰ 'ਤੇ ਚੁਣਿਆ ਜਾਂਦਾ ਹੈ\n4. **ਭਵਿੱਖਬਾਣੀ ਤੇ ਭਰੋਸੇਯੋਗਤਾ** — 95% ਅੰਤਰਾਲ, ਅਨਿਸ਼ਚਿਤਤਾ % ਤੇ ਹਰ ਭਵਿੱਖਬਾਣੀ ਦਾ ਜੋਖਮ ਸਕੋਰ (ਘੱਟ/ਮੱਧਮ/ਉੱਚ)\n\n${F("src/")} ਦੀਆਂ ਸਕ੍ਰਿਪਟਾਂ ਤੋਂ ਸਭ ਦੁਹਰਾਇਆ ਜਾ ਸਕਦਾ ਹੈ — ਪ੍ਰੋਸੈਸਿੰਗ, ਫ਼ੀਚਰ ਨਿਰਮਾਣ, ਸਿਖਲਾਈ ਤੇ ਮੁਲਾਂਕਣ ਵੱਖ-ਵੱਖ ਪੜਾਅ ਹਨ।`,
    },
    followUps: {
      en: ["How was the model trained?", "Which features matter most?", "What are the limitations?"],
      hi: ["मॉडल कैसे प्रशिक्षित हुआ?", "कौन-से फ़ीचर सबसे अहम हैं?", "इसकी सीमाएँ क्या हैं?"],
      pa: ["ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?", "ਕਿਹੜੇ ਫ਼ੀਚਰ ਸਭ ਤੋਂ ਅਹਿਮ ਹਨ?", "ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?"],
    },
  },
  {
    id: "features",
    role: "pipeline",
    keywords: [
      "which features", "feature importance", "what features", "input variables", "model inputs",
      "what does the model take", "फ़ीचर कौन", "फीचर महत्व", "इनपुट वेरिएबल", "ਫ਼ੀਚਰ ਕਿਹੜੇ", "ਇਨਪੁੱਟ",
    ],
    answer: {
      en: `### 🧩 Model features\n\nThe final model consumes per district × crop × year × season:\n\n• **District** and **Crop** identity (categorical)\n• **NDVI**, **NDWI**, **EVI** — vegetation/water indices from Sentinel-2 (Landsat variants used in analysis)\n• **Rainfall_mm**, **Temperature_C** — ERA5 climate\n• **Soil_Moisture** — ERA5-derived\n\nFeature-ablation studies in ${F("src/analysis/")} test how much R² drops when each feature is removed — crop identity and the vegetation indices carry most of the signal, which is also why mixed-crop feature rows are flagged in the data-integrity audit (see limitations).`,
      hi: `### 🧩 मॉडल के फ़ीचर\n\nअंतिम मॉडल प्रति जिला × फसल × वर्ष × मौसम यह लेता है:\n\n• **जिला** और **फसल** पहचान (श्रेणीगत)\n• **NDVI**, **NDWI**, **EVI** — Sentinel-2 से वनस्पति/जल सूचकांक (विश्लेषण में Landsat वेरिएंट भी)\n• **Rainfall_mm**, **Temperature_C** — ERA5 जलवायु\n• **Soil_Moisture** — ERA5-व्युत्पन्न\n\n${F("src/analysis/")} के फ़ीचर-एब्लेशन अध्ययन देखते हैं कि कोई फ़ीचर हटाने पर R² कितना गिरता है — फसल पहचान और वनस्पति सूचकांकों में सबसे ज़्यादा संकेत है, यही कारण है कि डेटा-अखंडता ऑडिट में मिश्रित-फसल पंक्तियाँ चिह्नित हैं (सीमाएँ देखें)।`,
      pa: `### 🧩 ਮਾਡਲ ਦੇ ਫ਼ੀਚਰ\n\nਅੰਤਿਮ ਮਾਡਲ ਹਰ ਜ਼ਿਲ੍ਹਾ × ਫ਼ਸਲ × ਸਾਲ × ਰੁੱਤ ਲਈ ਇਹ ਲੈਂਦਾ ਹੈ:\n\n• **ਜ਼ਿਲ੍ਹਾ** ਤੇ **ਫ਼ਸਲ** ਪਛਾਣ (ਸ਼੍ਰੇਣੀਗਤ)\n• **NDVI**, **NDWI**, **EVI** — Sentinel-2 ਤੋਂ ਬਨਸਪਤੀ/ਪਾਣੀ ਸੂਚਕ (ਵਿਸ਼ਲੇਸ਼ਣ ਵਿੱਚ Landsat ਰੂਪ ਵੀ)\n• **Rainfall_mm**, **Temperature_C** — ERA5 ਮੌਸਮ\n• **Soil_Moisture** — ERA5 ਤੋਂ ਬਣਿਆ\n\n${F("src/analysis/")} ਦੇ ਫ਼ੀਚਰ-ਐਬਲੇਸ਼ਨ ਅਧਿਐਨ ਵੇਖਦੇ ਹਨ ਕਿ ਫ਼ੀਚਰ ਹਟਾਉਣ 'ਤੇ R² ਕਿੰਨਾ ਡਿੱਗਦਾ ਹੈ — ਫ਼ਸਲ ਪਛਾਣ ਤੇ ਬਨਸਪਤੀ ਸੂਚਕਾਂ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਸੰਕੇਤ ਹੈ, ਇਸੇ ਕਰਕੇ ਡੇਟਾ-ਅਖੰਡਤਾ ਆਡਿਟ ਵਿੱਚ ਮਿਸ਼ਰਤ-ਫ਼ਸਲ ਕਤਾਰਾਂ ਨਿਸ਼ਾਨਦੇਹ ਹਨ (ਸੀਮਾਵਾਂ ਵੇਖੋ)।`,
    },
    followUps: {
      en: ["How was the model trained?", "What are the limitations?", "What is EVI?"],
      hi: ["मॉडल कैसे प्रशिक्षित हुआ?", "इसकी सीमाएँ क्या हैं?", "EVI क्या है?"],
      pa: ["ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?", "ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?", "EVI ਕੀ ਹੈ?"],
    },
  },
  {
    id: "training",
    role: "pipeline",
    keywords: [
      "how was the model trained", "model training", "which algorithm", "which model", "gradient boosting",
      "random forest", "ridge", "xgboost", "cross validation", "cross-validation", "groupkfold",
      "algorithm used", "मॉडल कैसे", "प्रशिक्षण", "कौन-सा एल्गोरिद्म", "क्रॉस वैलिडेशन", "मॉडल ਕਿਵੇਂ",
      "ਸਿਖਲਾਈ", "ਐਲਗੋਰਿਥਮ", "ਕਰਾਸ ਵੈਲੀਡੇਸ਼ਨ",
    ],
    answer: {
      en: `### 🧠 How the model was trained\n\n• **Candidates compared:** Ridge (linear baseline), Random Forest (300 trees), Gradient Boosting (200 estimators, learning rate 0.05) — scikit-learn pipelines with median imputation and scaling\n• **Validation:** 5-fold **GroupKFold**, grouped by **district × year** — so the model is always tested on districts-seasons it never saw, preventing leakage\n• **Selection:** the best model is picked from the validation results table; the winner is gradient-boosted regression, state-of-the-art for tabular agricultural data\n• **Targets & metrics:** crop yield in kg/ha, scored with MAE, RMSE and R² on held-out groups\n\nAsk *"how accurate is the model?"* for the live numbers, or open the **Reliability tab** for calibration and uncertainty detail.`,
      hi: `### 🧠 मॉडल कैसे प्रशिक्षित हुआ\n\n• **तुलने गए उम्मीदवार:** Ridge (लीनियर बेसलाइन), Random Forest (300 पेड़), Gradient Boosting (200 estimators, learning rate 0.05) — scikit-learn पाइपलाइन, मीडियन इम्प्यूटेशन और स्केलिंग के साथ\n• **वैलिडेशन:** 5-फोल्ड **GroupKFold**, **जिला × वर्ष** के समूह पर — मॉडल हमेशा उन जिला-मौसमों पर टेस्ट होता है जो उसने कभी देखे ही नहीं, जिससे लीकेज रुकती है\n• **चयन:** वैलिडेशन परिणाम तालिका से सर्वश्रेष्ठ मॉडल चुना जाता है; विजेता ग्रेडिएंट-बूस्टेड रिग्रेशन निकला — टैबुलर कृषि डेटा के लिए सर्वोत्तम\n• **लक्ष्य और मीट्रिक:** kg/ha में उपज, छोड़े गए समूहों पर MAE, RMSE और R² से स्कोर\n\nलाइव आंकड़ों के लिए पूछें *"मॉडल कितना सटीक है?"*, या **Reliability टैब** खोलें।`,
      pa: `### 🧠 ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ\n\n• **ਤੁਲਨੇ ਗਏ ਉਮੀਦਵਾਰ:** Ridge (ਲੀਨੀਅਰ ਬੇਸਲਾਈਨ), Random Forest (300 ਦਰੱਖਤ), Gradient Boosting (200 estimators, learning rate 0.05) — scikit-learn ਪਾਈਪਲਾਈਨ, ਮੀਡੀਅਨ ਇਮਪਿਊਟੇਸ਼ਨ ਤੇ ਸਕੇਲਿੰਗ ਸਮੇਤ\n• **ਵੈਲੀਡੇਸ਼ਨ:** 5-ਫੋਲਡ **GroupKFold**, **ਜ਼ਿਲ੍ਹਾ × ਸਾਲ** ਦੇ ਗਰੁੱਪਾਂ 'ਤੇ — ਮਾਡਲ ਹਮੇਸ਼ਾ ਉਨ੍ਹਾਂ ਜ਼ਿਲ੍ਹਾ-ਰੁੱਤਾਂ 'ਤੇ ਟੈਸਟ ਹੁੰਦਾ ਹੈ ਜਿਹੜੀਆਂ ਉਸਨੇ ਕਦੇ ਨਹੀਂ ਵੇਖੀਆਂ, ਜਿਸ ਨਾਲ ਲੀਕੇਜ ਰੁਕਦੀ ਹੈ\n• **ਚੋਣ:** ਵੈਲੀਡੇਸ਼ਨ ਨਤੀਜਿਆਂ ਦੀ ਸਾਰਣੀ ਤੋਂ ਵਧੀਆ ਮਾਡਲ ਚੁਣਿਆ ਜਾਂਦਾ ਹੈ; ਜੇਤੂ ਗਰੈਡੀਐਂਟ-ਬੂਸਟਿਡ ਰਿਗਰੈਸ਼ਨ ਨਿੱਕਲਿਆ — ਟੇਬੂਲਰ ਖੇਤੀ ਡੇਟਾ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ\n• **ਟੀਚੇ ਤੇ ਮੈਟ੍ਰਿਕ:** kg/ha ਵਿੱਚ ਝਾੜ, ਵੱਖ ਕੀਤੇ ਗਰੁੱਪਾਂ 'ਤੇ MAE, RMSE ਤੇ R²\n\nਲਾਈਵ ਅੰਕੜਿਆਂ ਲਈ ਪੁੱਛੋ *"ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"*, ਜਾਂ **Reliability ਟੈਬ** ਖੋਲ੍ਹੋ।`,
    },
    followUps: {
      en: ["How accurate is the model?", "What is gradient boosting?", "What are the limitations?"],
      hi: ["मॉडल कितना सटीक है?", "ग्रेडिएंट बूस्टिंग क्या है?", "इसकी सीमाएँ क्या हैं?"],
      pa: ["ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਗਰੈਡੀਐਂਟ ਬੂਸਟਿੰਗ ਕੀ ਹੈ?", "ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?"],
    },
  },
  {
    id: "dataMode",
    role: "data",
    keywords: [
      "demo data", "live data", "real data", "synthetic", "fake data", "sample data", "data mode",
      "which data is shown", "is the data real", "डेमो डेटा", "लाइव डेटा", "असली डेटा", "कृत्रिम डेटा",
      "ਡੈਮੋ ਡੇਟਾ", "ਲਾਈਵ ਡੇਟਾ", "ਅਸਲੀ ਡੇਟਾ", "ਨਕਲੀ ਡੇਟਾ",
    ],
    answer: {
      en: `### 📦 Demo data vs live data\n\nThe header badge tells you which mode you're in:\n\n• **LIVE DATA** — the dashboard fetches from the FastAPI backend, which serves the real processed dataset (${F("data/features/ml_features.csv")} — 162 rows, 5 crops, observations through 2022, 22 districts)\n• **DEMO DATA** (current production build) — a deterministic synthetic dataset (15,000 rows, 17 crops, 2021–2025) generated in ${F("web/src/demo.ts")} so the dashboard always has rich, stable data to show\n\n**Why demo?** The real observations stop at 2022 and cover few crops, while satellite features exist for 2021–2025 — production ships the demo set until the label data catches up. Toggling is one env var (${F("VITE_DATA_MODE=live")}), no code change.\n\nNumbers quoted in this chat always describe **the data actually loaded** — whatever mode you're in.`,
      hi: `### 📦 डेमो बनाम लाइव डेटा\n\nहेडर बैज बताता है कि आप किस मोड में हैं:\n\n• **LIVE DATA** — डैशबोर्ड FastAPI बैकएंड से डेटा लेता है, जो असली प्रोसेस्ड डेटासेट देता है (${F("data/features/ml_features.csv")} — 162 पंक्तियाँ, 5 फसलें, 2022 तक अवलोकन, 22 जिले)\n• **DEMO DATA** (मौजूदा प्रोडक्शन बिल्ड) — ${F("web/src/demo.ts")} में बना नियत सिंथेटिक डेटासेट (15,000 पंक्तियाँ, 17 फसलें, 2021–2025), ताकि डैशबोर्ड हमेशा समृद्ध और स्थिर डेटा दिखाए\n\n**डेमो क्यों?** असली अवलोकन 2022 पर रुक जाते हैं और कम फसलों तक सीमित हैं, जबकि सैटेलाइट फ़ीचर 2021–2025 के हैं — लेबल डेटा के पूरा होने तक प्रोडक्शन डेमो सेट दिखाता है। टॉगल सिर्फ एक env वेरिएबल (${F("VITE_DATA_MODE=live")}), कोई कोड बदलाव नहीं।\n\nइस चैट में दिए आंकड़े हमेशा **वास्तव में लोड डेटा** के बारे में हैं — चाहे कोई भी मोड हो।`,
      pa: `### 📦 ਡੈਮੋ ਬਨਾਮ ਲਾਈਵ ਡੇਟਾ\n\nਹੈੱਡਰ ਬੈਜ ਦੱਸਦਾ ਹੈ ਤੁਸੀਂ ਕਿਸ ਮੋਡ ਵਿੱਚ ਹੋ:\n\n• **LIVE DATA** — ਡੈਸ਼ਬੋਰਡ FastAPI ਬੈਕਐਂਡ ਤੋਂ ਡੇਟਾ ਲੈਂਦਾ ਹੈ, ਜੋ ਅਸਲ ਪ੍ਰੋਸੈਸਡ ਡੇਟਾਸੈੱਟ ਦਿੰਦਾ ਹੈ (${F("data/features/ml_features.csv")} — 162 ਕਤਾਰਾਂ, 5 ਫ਼ਸਲਾਂ, 2022 ਤੱਕ ਅਵਲੋਕਨ, 22 ਜ਼ਿਲ੍ਹੇ)\n• **DEMO DATA** (ਮੌਜੂਦਾ ਪ੍ਰੋਡਕਸ਼ਨ ਬਿਲਡ) — ${F("web/src/demo.ts")} ਵਿੱਚ ਬਣਿਆ ਨਿਯਤ ਸਿੰਥੈਟਿਕ ਡੇਟਾਸੈੱਟ (15,000 ਕਤਾਰਾਂ, 17 ਫ਼ਸਲਾਂ, 2021–2025), ਤਾਂ ਜੋ ਡੈਸ਼ਬੋਰਡ ਕੋਲ ਹਮੇਸ਼ਾ ਭਰਪੂਰ ਤੇ ਸਥਿਰ ਡੇਟਾ ਹੋਵੇ\n\n**ਡੈਮੋ ਕਿਉਂ?** ਅਸਲ ਅਵਲੋਕਨ 2022 'ਤੇ ਰੁਕ ਜਾਂਦੇ ਹਨ ਤੇ ਘੱਟ ਫ਼ਸਲਾਂ ਤੱਕ ਸੀਮਿਤ ਹਨ, ਜਦਕਿ ਸੈਟੇਲਾਈਟ ਫ਼ੀਚਰ 2021–2025 ਦੇ ਹਨ — ਲੇਬਲ ਡੇਟਾ ਦੇ ਪੂਰਾ ਹੋਣ ਤੱਕ ਪ੍ਰੋਡਕਸ਼ਨ ਡੈਮੋ ਸੈੱਟ ਵਿਖਾਉਂਦਾ ਹੈ। ਟੌਗਲ ਸਿਰਫ਼ ਇੱਕ env ਵੇਰੀਏਬਲ (${F("VITE_DATA_MODE=live")}), ਕੋਈ ਕੋਡ ਤਬਦੀਲੀ ਨਹੀਂ।\n\nਇਸ ਚੈਟ ਦੇ ਅੰਕੜੇ ਹਮੇਸ਼ਾ **ਅਸਲ ਵਿੱਚ ਲੋਡ ਡੇਟਾ** ਬਾਰੇ ਹਨ — ਕੋਈ ਵੀ ਮੋਡ ਹੋਵੇ।`,
    },
    followUps: {
      en: ["What are the limitations?", "What data sources does it use?", "How accurate is the model?"],
      hi: ["इसकी सीमाएँ क्या हैं?", "इसमें कौन-से डेटा स्रोत हैं?", "मॉडल कितना सटीक है?"],
      pa: ["ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?", "ਇਸ ਵਿੱਚ ਕਿਹੜੇ ਡੇਟਾ ਸਰੋਤ ਹਨ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"],
    },
  },
  {
    id: "limitations",
    role: "data",
    keywords: [
      "limitation", "caveat", "constraint", "weakness", "problem", "issue", "honest", "integrity",
      "audit", "can it be trusted", "सीमा", "कमी", "कमज़ोरी", "समस्या", "भरोसा", "ਸੀਮਾ", "ਕਮੀ",
      "ਸਮੱਸਿਆ", "ਭਰੋਸਾ",
    ],
    answer: {
      en: `### ⚠️ Honest limitations\n\n• **Label sparsity** — real yield observations stop at **2022** and cover only **5 crops** (Bajra, Barley, Potato, Rice, Wheat) in 162 rows; satellite features do exist for 2021–2025\n• **Crop-feature homogeneity** — the integrity audit found that where several crops share a district-year-season, their satellite features are byte-identical (features are aggregated per district, not per field), so remote sensing alone can't separate crops within a group\n• **Heteroscedastic errors** — predictions are less accurate for unusually low or high yields; that's exactly what the uncertainty bands and risk levels flag\n• **Demo caveat** — in DEMO mode the yields are synthetic; the *pipeline* is real, the *labels* are illustrative\n• **Aggregation level** — district-season means, not field-level advice\n\nThese are tracked in ${F("data/analysis/")} audit scripts, not hidden — and they define the roadmap (field-level features, fresher labels).`,
      hi: `### ⚠️ ईमानदार सीमाएँ\n\n• **लेबल की कमी** — असली उपज अवलोकन **2022** पर रुकते हैं और केवल **5 फसलें** (बाजरा, जौ, आलू, धान, गेहूं) की 162 पंक्तियाँ; सैटेलाइट फ़ीचर 2021–2025 के मौजूद हैं\n• **फसल-फ़ीचर समरूपता** — अखंडता ऑडिट में मिला कि जहाँ कई फसलें एक जिला-वर्ष-मौसम साझा करती हैं, उनके सैटेलाइट फ़ीचर बाइट-समान हैं (फ़ीचर प्रति जिला एकत्रित हैं, प्रति खेत नहीं) — यानी केवल रिमोट सेंसिंग समूह के भीतर फसलें अलग नहीं कर सकती\n• **हेटेरोसेडैस्टिक त्रुटियाँ** — असामान्य रूप से कम या ज़्यादा उपज पर भविष्यवाणियाँ कम सटीक; अनिश्चितता बैंड और जोखिम स्तर यही बताते हैं\n• **डेमो चेतावनी** — DEMO मोड में उपज सिंथेटिक है; *पाइपलाइन* असली है, *लेबल* उदाहरण हैं\n• **एकत्रीकरण स्तर** — जिला-मौसम औसत, खेत-स्तरीय सलाह नहीं\n\nये ${F("data/analysis/")} ऑडिट स्क्रिप्ट्स में दर्ज हैं — छिपाए नहीं गए — और यही रोडमैप तय करते हैं (खेत-स्तरीय फ़ीचर, नए लेबल)।`,
      pa: `### ⚠️ ਇਮਾਨਦਾਰ ਸੀਮਾਵਾਂ\n\n• **ਲੇਬਲ ਦੀ ਕਮੀ** — ਅਸਲ ਝਾੜ ਅਵਲੋਕਨ **2022** 'ਤੇ ਰੁਕਦੇ ਹਨ ਤੇ ਸਿਰਫ਼ **5 ਫ਼ਸਲਾਂ** (ਬਾਜਰਾ, ਜੌਂ, ਆਲੂ, ਝੋਨਾ, ਕਣਕ) ਦੀਆਂ 162 ਕਤਾਰਾਂ; ਸੈਟੇਲਾਈਟ ਫ਼ੀਚਰ 2021–2025 ਦੇ ਮੌਜੂਦ ਹਨ\n• **ਫ਼ਸਲ-ਫ਼ੀਚਰ ਇਕਰੂਪਤਾ** — ਅਖੰਡਤਾ ਆਡਿਟ ਨੇ ਲੱਭਿਆ ਕਿ ਜਿੱਥੇ ਕਈ ਫ਼ਸਲਾਂ ਇੱਕ ਜ਼ਿਲ੍ਹਾ-ਸਾਲ-ਰੁੱਤ ਸਾਂਝੀ ਕਰਦੀਆਂ ਹਨ, ਉਨ੍ਹਾਂ ਦੇ ਸੈਟੇਲਾਈਟ ਫ਼ੀਚਰ ਬਾਈਟ-ਬਰਾਬਰ ਹਨ (ਫ਼ੀਚਰ ਹਰ ਜ਼ਿਲ੍ਹੇ ਲਈ ਹਨ, ਹਰ ਖੇਤ ਲਈ ਨਹੀਂ) — ਭਾਵ ਸਿਰਫ਼ ਰਿਮੋਟ ਸੈਂਸਿੰਗ ਗਰੁੱਪ ਅੰਦਰ ਫ਼ਸਲਾਂ ਵੱਖ ਨਹੀਂ ਕਰ ਸਕਦੀ\n• **ਹੈਟੇਰੋਸੈਡੈਸਟਿਕ ਗਲਤੀਆਂ** — ਬਹੁਤ ਘੱਟ ਜਾਂ ਬਹੁਤ ਵੱਧ ਝਾੜ 'ਤੇ ਭਵਿੱਖਬਾਣੀਆਂ ਘੱਟ ਸਹੀ; ਅਨਿਸ਼ਚਿਤਤਾ ਬੈਂਡ ਤੇ ਜੋਖਮ ਪੱਧਰ ਇਹੀ ਦੱਸਦੇ ਹਨ\n• **ਡੈਮੋ ਚੇਤਾਵਨੀ** — DEMO ਮੋਡ ਵਿੱਚ ਝਾੜ ਸਿੰਥੈਟਿਕ ਹਨ; *ਪਾਈਪਲਾਈਨ* ਅਸਲੀ ਹੈ, *ਲੇਬਲ* ਉਦਾਹਰਣ ਹਨ\n• **ਪੱਧਰ** — ਜ਼ਿਲ੍ਹਾ-ਰੁੱਤ ਔਸਤ, ਖੇਤ-ਪੱਧਰੀ ਸਲਾਹ ਨਹੀਂ\n\nਇਹ ${F("data/analysis/")} ਆਡਿਟ ਸਕ੍ਰਿਪਟਾਂ ਵਿੱਚ ਦਰਜ ਹਨ — ਲੁਕਾਏ ਨਹੀਂ — ਤੇ ਇਹੀ ਰੋਡਮੈਪ ਬਣਾਉਂਦੇ ਹਨ (ਖੇਤ-ਪੱਧਰੀ ਫ਼ੀਚਰ, ਤਾਜ਼ੇ ਲੇਬਲ)।`,
    },
    followUps: {
      en: ["Demo data vs live data?", "How accurate is the model?", "What does high risk mean?"],
      hi: ["डेमो बनाम लाइव डेटा?", "मॉडल कितना सटीक है?", "हाई रिस्क का क्या मतलब है?"],
      pa: ["ਡੈਮੋ ਬਨਾਮ ਲਾਈਵ ਡੇਟਾ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਹਾਈ ਰਿਸਕ ਦਾ ਕੀ ਮਤਲਬ ਹੈ?"],
    },
  },
  {
    id: "techStack",
    role: "project",
    keywords: [
      "tech stack", "technology", "framework", "how is the dashboard built", "react", "three.js",
      "vite", "typescript", "frontend", "3d", "टेक स्टैक", "कैसे बना डैशबोर्ड", "ਟੈਕ ਸਟੈਕ",
      "ਕਿਵੇਂ ਬਣਿਆ ਡੈਸ਼ਬੋਰਡ",
    ],
    answer: {
      en: `### 💻 Tech stack\n\n**Frontend**\n• Vite + React 18 + TypeScript (this bundle, ~500 KB)\n• Three.js 3D via ${F("@react-three/fiber")} + ${F("@react-three/drei")} — extruded bar/line/donut/scatter charts and a 3D extruded Punjab district map with hover/click interactions\n• 15 tabs, dark mode, EN/हिन्दी/ਪੰਜਾਬੀ i18n, URL-bookmarkable state\n\n**Backend**\n• FastAPI (Python) serving CSVs of the processed dataset — routes for dataset, predictions, overview, crops, districts, reliability\n• Deployed as two Vercel projects from one repo: dashboard (root ${F("web/")}) and API (repo root)\n\n**ML**\n• Python + pandas + scikit-learn (gradient boosting), Google Earth Engine for imagery`,
      hi: `### 💻 टेक स्टैक\n\n**फ्रंटएंड**\n• Vite + React 18 + TypeScript (यह बंडल, ~500 KB)\n• Three.js 3D — ${F("@react-three/fiber")} + ${F("@react-three/drei")} के ज़रिए — एक्सट्रूडेड बार/लाइन/डोनट/स्कैटर चार्ट और 3D पंजाब जिला मानचित्र, होवर/क्लिक के साथ\n• 15 टैब, डार्क मोड, EN/हिन्दी/ਪੰਜਾਬੀ i18n, URL-बुकमार्क योग्य स्थिति\n\n**बैकएंड**\n• FastAPI (Python) — प्रोसेस्ड डेटासेट की CSV सर्व करता है — dataset, predictions, overview, crops, districts, reliability रूट\n• एक रिपो से दो Vercel प्रोजेक्ट: डैशबोर्ड (रूट ${F("web/")}) और API (रिपो रूट)\n\n**ML**\n• Python + pandas + scikit-learn (gradient boosting), इमेजरी के लिए Google Earth Engine`,
      pa: `### 💻 ਟੈਕ ਸਟੈਕ\n\n**ਫਰੰਟਐਂਡ**\n• Vite + React 18 + TypeScript (ਇਹ ਬੰਡਲ, ~500 KB)\n• Three.js 3D — ${F("@react-three/fiber")} + ${F("@react-three/drei")} ਰਾਹੀਂ — ਐਕਸਟਰੂਡਡ ਬਾਰ/ਲਾਈਨ/ਡੋਨਟ/ਸਕੈਟਰ ਚਾਰਟ ਤੇ 3D ਪੰਜਾਬ ਜ਼ਿਲ੍ਹਾ ਨਕਸ਼ਾ, ਹੋਵਰ/ਕਲਿੱਕ ਸਮੇਤ\n• 15 ਟੈਬ, ਡਾਰਕ ਮੋਡ, EN/ਹਿੰਦੀ/ਪੰਜਾਬੀ i18n, URL-ਬੁੱਕਮਾਰਕ ਯੋਗ ਸਥਿਤੀ\n\n**ਬੈਕਐਂਡ**\n• FastAPI (Python) — ਪ੍ਰੋਸੈਸਡ ਡੇਟਾਸੈੱਟ ਦੀਆਂ CSV ਸਰਵ ਕਰਦਾ ਹੈ — dataset, predictions, overview, crops, districts, reliability ਰੂਟ\n• ਇੱਕ ਰਿਪੋ ਤੋਂ ਦੋ Vercel ਪ੍ਰੋਜੈਕਟ: ਡੈਸ਼ਬੋਰਡ (ਰੂਟ ${F("web/")}) ਤੇ API (ਰਿਪੋ ਰੂਟ)\n\n**ML**\n• Python + pandas + scikit-learn (gradient boosting), ਤਸਵੀਰਾਂ ਲਈ Google Earth Engine`,
    },
    followUps: {
      en: ["How does the API work?", "How was the model trained?", "What is this project?"],
      hi: ["API कैसे काम करता है?", "मॉडल कैसे प्रशिक्षित हुआ?", "यह प्रोजेक्ट क्या है?"],
      pa: ["API ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ?", "ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?", "ਇਹ ਪ੍ਰੋਜੈਕਟ ਕੀ ਹੈ?"],
    },
  },
  {
    id: "api",
    role: "deployment",
    keywords: [
      "api", "backend", "fastapi", "endpoint", "server", "how does the api work", "एपीआई", "बैकएंड",
      "ਐਪੀਆਈ", "ਬੈਕਐਂਡ",
    ],
    answer: {
      en: `### 🔌 The FastAPI backend\n\n• **Routes:** ${F("/api/dataset")}, ${F("/api/predictions")}, ${F("/api/overview")}, ${F("/api/crops")}, ${F("/api/districts")}, ${F("/api/reliability")} (+ ${F("/scores")} and ${F("/risk")}), plus ${F("/health")}\n• **Data:** reads ${F("data/features/ml_features.csv")} and reliability predictions; on serverless it falls back to the 135 KB copies in ${F("api/bundled/")}\n• **Frontend wiring:** ${F("web/vercel.json")} rewrites ${F("/api/*")} to the API deployment, so the browser talks to one origin — no CORS\n• **Live demo:** https://agri-rs-api.vercel.app/api/overview\n\nRun it locally with ${F("uvicorn src.api.main:app --port 8000")} — the Vite dev proxy forwards ${F("/api")} to it and the dashboard switches to LIVE DATA.`,
      hi: `### 🔌 FastAPI बैकएंड\n\n• **रूट:** ${F("/api/dataset")}, ${F("/api/predictions")}, ${F("/api/overview")}, ${F("/api/crops")}, ${F("/api/districts")}, ${F("/api/reliability")} (+ ${F("/scores")} और ${F("/risk")}), और ${F("/health")}\n• **डेटा:** ${F("data/features/ml_features.csv")} और reliability predictions पढ़ता है; सर्वरलेस पर ${F("api/bundled/")} की 135 KB कॉपी पर फॉलबैक\n• **फ्रंटएंड जुड़ाव:** ${F("web/vercel.json")} ${F("/api/*")} को API डिप्लॉयमेंट पर रीराइट करता है — ब्राउज़र एक ही ऑरिजिन से बात करता है, CORS नहीं\n• **लाइव उदाहरण:** https://agri-rs-api.vercel.app/api/overview\n\nलोकल चलाने के लिए ${F("uvicorn src.api.main:app --port 8000")} — Vite डेव प्रॉक्सी ${F("/api")} को इसी पर भेजता है और डैशबोर्ड LIVE DATA दिखाता है।`,
      pa: `### 🔌 FastAPI ਬੈਕਐਂਡ\n\n• **ਰੂਟ:** ${F("/api/dataset")}, ${F("/api/predictions")}, ${F("/api/overview")}, ${F("/api/crops")}, ${F("/api/districts")}, ${F("/api/reliability")} (+ ${F("/scores")} ਤੇ ${F("/risk")}), ਤੇ ${F("/health")}\n• **ਡੇਟਾ:** ${F("data/features/ml_features.csv")} ਤੇ reliability predictions ਪੜ੍ਹਦਾ ਹੈ; ਸਰਵਰਲੈੱਸ 'ਤੇ ${F("api/bundled/")} ਦੀਆਂ 135 KB ਕਾਪੀਆਂ 'ਤੇ ਫਾਲਬੈਕ\n• **ਫਰੰਟਐਂਡ ਜੋੜ:** ${F("web/vercel.json")} ${F("/api/*")} ਨੂੰ API ਡਿਪਲੌਇਮੈਂਟ 'ਤੇ ਰੀਰਾਈਟ ਕਰਦਾ ਹੈ — ਬਰਾਊਜ਼ਰ ਇੱਕੋ ਔਰਿਜਿਨ ਤੋਂ ਗੱਲ ਕਰਦਾ ਹੈ, CORS ਨਹੀਂ\n• **ਲਾਈਵ ਉਦਾਹਰਣ:** https://agri-rs-api.vercel.app/api/overview\n\nਲੋਕਲ ਚਲਾਉਣ ਲਈ ${F("uvicorn src.api.main:app --port 8000")} — Vite ਡਿਵ ਪ੍ਰੌਕਸੀ ${F("/api")} ਨੂੰ ਇਸੇ 'ਤੇ ਭੇਜਦਾ ਹੈ ਤੇ ਡੈਸ਼ਬੋਰਡ LIVE DATA ਵਿਖਾਉਂਦਾ ਹੈ।`,
    },
    followUps: {
      en: ["How is it deployed?", "What is the tech stack?", "Demo data vs live data?"],
      hi: ["यह कैसे डिप्लॉय है?", "टेक स्टैक क्या है?", "डेमो बनाम लाइव डेटा?"],
      pa: ["ਇਹ ਕਿਵੇਂ ਡਿਪਲੌਇ ਹੈ?", "ਟੈਕ ਸਟੈਕ ਕੀ ਹੈ?", "ਡੈਮੋ ਬਨਾਮ ਲਾਈਵ ਡੇਟਾ?"],
    },
  },
  {
    id: "deployment",
    role: "deployment",
    keywords: [
      "deployment", "deployed", "hosting", "hosted", "vercel", "production url", "website link",
      "where is it running", "डिप्लॉय", "होस्टिंग", "वेबसाइट लिंक", "ਡਿਪਲੌਇ", "ਹੋਸਟਿੰਗ", "ਵੈਬਸਾਈਟ ਲਿੰਕ",
    ],
    answer: {
      en: `### 🚀 Deployment\n\nTwo Vercel projects deploy automatically from this one repository on every push to main:\n\n• **agri-rs-dashboard** → https://agri-rs-dashboard.vercel.app (root directory ${F("web/")}) — the React dashboard\n• **agri-rs-api** → https://agri-rs-api.vercel.app (repo root) — the FastAPI backend\n\nThe split matters: each project has its own ${F("vercel.json")} with its own build. The dashboard's config rewrites ${F("/api/*")} to the API so CORS never enters the picture. The ~118 MB ${F("data/")} tree is gitignored and excluded via ${F(".vercelignore")}; the API ships with bundled CSV extracts instead.`,
      hi: `### 🚀 डिप्लॉयमेंट\n\nmain पर हर पुश के साथ एक ही रिपो से दो Vercel प्रोजेक्ट अपने-आप डिप्लॉय होते हैं:\n\n• **agri-rs-dashboard** → https://agri-rs-dashboard.vercel.app (रूट डायरेक्टरी ${F("web/")}) — React डैशबोर्ड\n• **agri-rs-api** → https://agri-rs-api.vercel.app (रिपो रूट) — FastAPI बैकएंड\n\nयह बँटवारा ज़रूरी है: हर प्रोजेक्ट की अपनी ${F("vercel.json")} और अपना बिल्ड है। डैशबोर्ड का कॉन्फ़िग ${F("/api/*")} को API पर रीराइट करता है ताकि CORS कभी बाधा न बने। ~118 MB का ${F("data/")} gitignored है और ${F(".vercelignore")} से बाहर; API बंडल की गई CSV निकासी के साथ चलता है।`,
      pa: `### 🚀 ਡਿਪਲੌਇਮੈਂਟ\n\nmain 'ਤੇ ਹਰ ਪੁਸ਼ ਨਾਲ ਇੱਕੋ ਰਿਪੋ ਤੋਂ ਦੋ Vercel ਪ੍ਰੋਜੈਕਟ ਆਪਣੇ-ਆਪ ਡਿਪਲੌਇ ਹੁੰਦੇ ਹਨ:\n\n• **agri-rs-dashboard** → https://agri-rs-dashboard.vercel.app (ਰੂਟ ਡਾਇਰੈਕਟਰੀ ${F("web/")}) — React ਡੈਸ਼ਬੋਰਡ\n• **agri-rs-api** → https://agri-rs-api.vercel.app (ਰਿਪੋ ਰੂਟ) — FastAPI ਬੈਕਐਂਡ\n\nਇਹ ਵੰਡ ਜ਼ਰੂਰੀ ਹੈ: ਹਰ ਪ੍ਰੋਜੈਕਟ ਦੀ ਆਪਣੀ ${F("vercel.json")} ਤੇ ਆਪਣਾ ਬਿਲਡ ਹੈ। ਡੈਸ਼ਬੋਰਡ ਦਾ ਕੌਨਫਿਗ ${F("/api/*")} ਨੂੰ API 'ਤੇ ਰੀਰਾਈਟ ਕਰਦਾ ਹੈ ਤਾਂ ਜੋ CORS ਕਦੇ ਰੋੜਾ ਨਾ ਬਣੇ। ~118 MB ਦਾ ${F("data/")} gitignored ਹੈ ਤੇ ${F(".vercelignore")} ਰਾਹੀਂ ਬਾਹਰ; API ਬੰਡਲ ਕੀਤੀਆਂ CSV ਨਿਕਾਸੀਆਂ ਨਾਲ ਚੱਲਦਾ ਹੈ।`,
    },
    followUps: {
      en: ["How does the API work?", "What is the tech stack?", "What is this project?"],
      hi: ["API कैसे काम करता है?", "टेक स्टैक क्या है?", "यह प्रोजेक्ट क्या है?"],
      pa: ["API ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ?", "ਟੈਕ ਸਟੈਕ ਕੀ ਹੈ?", "ਇਹ ਪ੍ਰੋਜੈਕਟ ਕੀ ਹੈ?"],
    },
  },
  {
    id: "llmKeys",
    role: "project",
    keywords: [
      "api key", "connect llm", "gemini key", "groq key", "openai key", "enable smarter", "your key",
      "एपीआई कुंजी", "कुंजी कैसे", "ਐਪੀਆਈ ਕੁੰਜੀ", "ਕੁੰਜੀ ਕਿਵੇਂ",
    ],
    answer: {
      en: `### 🔑 Optional: connect an LLM for open-ended chat\n\nThe built-in engine already answers data and project questions without any key. For free-form conversations, plug in a free API key:\n\n1. Grab a key: **Gemini** → aistudio.google.com/apikey (1,500 req/day free) · **Groq** → console.groq.com (fast, free) · **OpenRouter** → openrouter.ai (free models)\n2. Select the provider in the toolbar above and paste the key — it's detected automatically from the prefix and stored only in your browser's localStorage\n3. Your questions and the dataset snapshot are sent to the provider, so its answers stay grounded in real numbers\n\nKeys are never sent to our servers — calls go straight from your browser to the provider.`,
      hi: `### 🔑 वैकल्पिक: खुली चैट के लिए LLM जोड़ें\n\nबिल्ट-इन इंजन बिना कुंजी ही डेटा और प्रोजेक्ट सवालों के जवाब देता है। मुफ़्त-रूप बातचीत के लिए मुफ़्त API कुंजी लगाएँ:\n\n1. कुंजी लें: **Gemini** → aistudio.google.com/apikey (रोज़ 1,500 निःशुल्क) · **Groq** → console.groq.com (तेज़, मुफ़्त) · **OpenRouter** → openrouter.ai (मुफ़्त मॉडल)\n2. ऊपर टूलबार में प्रोवाइडर चुनें और कुंजी पेस्ट करें — प्रीफ़िक्स से अपने-आप पहचान जाती है, केवल आपके ब्राउज़र के localStorage में सुरक्षित\n3. आपके सवाल और डेटासेट स्नैपशॉट प्रोवाइडर को भेजे जाते हैं, इसलिए जवाब असली आंकड़ों पर टिके रहते हैं\n\nकुंजियाँ हमारे सर्वर पर कभी नहीं जातीं — कॉल सीधे आपके ब्राउज़र से प्रोवाइडर तक जाती हैं।`,
      pa: `### 🔑 ਵਿਕਲਪਿਕ: ਖੁੱਲ੍ਹੀ ਚੈਟ ਲਈ LLM ਜੋੜੋ\n\nਬਿਲਟ-ਇਨ ਇੰਜਣ ਬਿਨਾਂ ਕੁੰਜੀ ਹੀ ਡੇਟਾ ਤੇ ਪ੍ਰੋਜੈਕਟ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿੰਦਾ ਹੈ। ਖੁੱਲ੍ਹੀ ਗੱਲਬਾਤ ਲਈ ਮੁਫ਼ਤ API ਕੁੰਜੀ ਲਗਾਓ:\n\n1. ਕੁੰਜੀ ਲਵੋ: **Gemini** → aistudio.google.com/apikey (ਰੋਜ਼ 1,500 ਮੁਫ਼ਤ) · **Groq** → console.groq.com (ਤੇਜ਼, ਮੁਫ਼ਤ) · **OpenRouter** → openrouter.ai (ਮੁਫ਼ਤ ਮਾਡਲ)\n2. ਉੱਤੇ ਟੂਲਬਾਰ ਵਿੱਚ ਪ੍ਰੋਵਾਈਡਰ ਚੁਣੋ ਤੇ ਕੁੰਜੀ ਪੇਸਟ ਕਰੋ — ਪ੍ਰੀਫਿਕਸ ਤੋਂ ਆਪਣੇ-ਆਪ ਪਛਾਣ ਜਾਂਦੀ ਹੈ, ਸਿਰਫ਼ ਤੁਹਾਡੇ ਬਰਾਊਜ਼ਰ ਦੇ localStorage ਵਿੱਚ ਸੁਰੱਖਿਅਤ\n3. ਤੁਹਾਡੇ ਸਵਾਲ ਤੇ ਡੇਟਾਸੈੱਟ ਸਨੈਪਸ਼ਾਟ ਪ੍ਰੋਵਾਈਡਰ ਨੂੰ ਭੇਜੇ ਜਾਂਦੇ ਹਨ, ਇਸ ਲਈ ਜਵਾਬ ਅਸਲ ਅੰਕੜਿਆਂ 'ਤੇ ਟਿਕੇ ਰਹਿੰਦੇ ਹਨ\n\nਕੁੰਜੀਆਂ ਸਾਡੇ ਸਰਵਰ 'ਤੇ ਕਦੇ ਨਹੀਂ ਜਾਂਦੀਆਂ — ਕਾਲਾਂ ਸਿੱਧਾ ਤੁਹਾਡੇ ਬਰਾਊਜ਼ਰ ਤੋਂ ਪ੍ਰੋਵਾਈਡਰ ਤੱਕ ਜਾਂਦੀਆਂ ਹਨ।`,
    },
    followUps: {
      en: ["What is this project?", "How accurate is the model?", "What are the limitations?"],
      hi: ["यह प्रोजेक्ट क्या है?", "मॉडल कितना सटीक है?", "इसकी सीमाएँ क्या हैं?"],
      pa: ["ਇਹ ਪ੍ਰੋਜੈਕਟ ਕੀ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਇਸਦੀਆਂ ਸੀਮਾਵਾਂ ਕੀ ਹਨ?"],
    },
  },
  {
    id: "dashboardHelp",
    role: "project",
    keywords: [
      "how to use", "which tab", "where can i", "how do i use", "dashboard guide", "what can this dashboard",
      "कैसे इस्तेमाल", "कौन सा टैब", "कहाँ देखूँ", "ਕਿਵੇਂ ਵਰਤਣਾ", "ਕਿਹੜਾ ਟੈਬ", "ਕਿੱਥੇ ਵੇਖਾਂ",
    ],
    answer: {
      en: `### 🧭 Dashboard guide — where to find what\n\n• **Overview** — headline stats, model performance, samples per year\n• **Crops / Districts** — searchable profiles with per-year trends and top performers\n• **Predictions** — filter by crop/district/year; actual-vs-predicted scatter with intervals\n• **Maps** — 3D extruded Punjab map in Yield / NDVI / NDWI / EVI / Land Cover modes\n• **Analytics** — yield trends, distribution histogram, district×year 3D surface\n• **Environment** — multi-year climate trends (rain, temperature, indices)\n• **Reliability** — calibration, uncertainty histogram, risk breakdown\n• **Data Explorer** — filterable table + CSV export · **Reports** — six one-click CSV reports\n• **Crop Fit** — enter your own soil/climate readings and rank all crops for your field\n• **Compare** — side-by-side districts or crops · **Glossary** — every technical term defined\n\nShortcut: press ${F("/")} to jump to search, ${F("Ctrl+1…9")} to switch tabs.`,
      hi: `### 🧭 डैशबोर्ड गाइड — क्या कहाँ मिलेगा\n\n• **Overview** — मुख्य आंकड़े, मॉडल प्रदर्शन, वर्ष-दर-वर्ष नमूने\n• **Crops / Districts** — खोजयोग्य प्रोफ़ाइल, वर्ष-वार रुझान और टॉप प्रदर्शन\n• **Predictions** — फसल/जिला/वर्ष फ़िल्टर; अंतरालों के साथ actual-vs-predicted स्कैटर\n• **Maps** — 3D पंजाब नक्शा — Yield / NDVI / NDWI / EVI / Land Cover मोड\n• **Analytics** — उपज रुझान, वितरण हिस्टोग्राम, जिला×वर्ष 3D सतह\n• **Environment** — बहु-वर्षीय जलवायु रुझान (वर्षा, तापमान, सूचकांक)\n• **Reliability** — कैलिब्रेशन, अनिश्चितता हिस्टोग्राम, जोखिम विभाजन\n• **Data Explorer** — फ़िल्टर योग्य तालिका + CSV निर्यात · **Reports** — छह वन-क्लिक CSV रिपोर्ट\n• **Crop Fit** — अपनी मिट्टी/जलवायु रीडिंग डालें और अपने खेत के लिए सभी फसलें रैंक करें\n• **Compare** — जिलों या फसलों की साथ-साथ तुलना · **Glossary** — हर तकनीकी शब्द की परिभाषा\n\nशॉर्टकट: खोज के लिए ${F("/")} दबाएँ, टैब बदलने के लिए ${F("Ctrl+1…9")}।`,
      pa: `### 🧭 ਡੈਸ਼ਬੋਰਡ ਗਾਈਡ — ਕੀ ਕਿੱਥੇ ਮਿਲੇਗਾ\n\n• **Overview** — ਮੁੱਖ ਅੰਕੜੇ, ਮਾਡਲ ਪ੍ਰਦਰਸ਼ਨ, ਸਾਲ-ਦਰ-ਸਾਲ ਨਮੂਨੇ\n• **Crops / Districts** — ਖੋਜਯੋਗ ਪ੍ਰੋਫ਼ਾਈਲ, ਸਾਲ-ਵਾਰ ਰੁਝਾਨ ਤੇ ਟਾਪ ਪ੍ਰਦਰਸ਼ਨ\n• **Predictions** — ਫ਼ਸਲ/ਜ਼ਿਲ੍ਹਾ/ਸਾਲ ਫ਼ਿਲਟਰ; ਅੰਤਰਾਲਾਂ ਸਮੇਤ actual-vs-predicted ਸਕੈਟਰ\n• **Maps** — 3D ਪੰਜਾਬ ਨਕਸ਼ਾ — Yield / NDVI / NDWI / EVI / Land Cover ਮੋਡ\n• **Analytics** — ਝਾੜ ਰੁਝਾਨ, ਵੰਡ ਹਿਸਟੋਗ੍ਰਾਮ, ਜ਼ਿਲ੍ਹਾ×ਸਾਲ 3D ਸਤ੍ਹਾ\n• **Environment** — ਬਹੁ-ਸਾਲੀ ਮੌਸਮੀ ਰੁਝਾਨ (ਮੀਂਹ, ਤਾਪਮਾਨ, ਸੂਚਕ)\n• **Reliability** — ਕੈਲੀਬ੍ਰੇਸ਼ਨ, ਅਨਿਸ਼ਚਿਤਤਾ ਹਿਸਟੋਗ੍ਰਾਮ, ਜੋਖਮ ਵੰਡ\n• **Data Explorer** — ਫ਼ਿਲਟਰਯੋਗ ਸਾਰਣੀ + CSV ਨਿਕਾਸ · **Reports** — ਛੇ ਇੱਕ-ਕਲਿੱਕ CSV ਰਿਪੋਰਟ\n• **Crop Fit** — ਆਪਣੀ ਮਿੱਟੀ/ਮੌਸਮ ਰੀਡਿੰਗ ਪਾਓ ਤੇ ਆਪਣੇ ਖੇਤ ਲਈ ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ ਰੈਂਕ ਕਰੋ\n• **Compare** — ਜ਼ਿਲ੍ਹਿਆਂ ਜਾਂ ਫ਼ਸਲਾਂ ਦੀ ਨਾਲ-ਨਾਲ ਤੁਲਨਾ · **Glossary** — ਹਰ ਤਕਨੀਕੀ ਸ਼ਬਦ ਦੀ ਪਰਿਭਾਸ਼ਾ\n\nਸ਼ਾਰਟਕੱਟ: ਖੋਜ ਲਈ ${F("/")} ਦਬਾਓ, ਟੈਬ ਬਦਲਣ ਲਈ ${F("Ctrl+1…9")}।`,
    },
    followUps: {
      en: ["What is NDVI?", "How accurate is the model?", "Best crop for Ludhiana?"],
      hi: ["NDVI क्या है?", "मॉडल कितना सटीक है?", "लुधियाना के लिए सबसे अच्छी फसल?"],
      pa: ["NDVI ਕੀ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਲੁਧਿਆਣਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?"],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLOSSARY — remote sensing indices
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "g-ndvi",
    role: "glossary",
    keywords: ["ndvi", "vegetation index", "एनडीवीआई", "वनस्पति सूचकांक", "ਐਨਡੀਵੀਆਈ", "ਬਨਸਪਤੀ ਸੂਚਕ"],
    answer: {
      en: `### 🛰️ NDVI — Normalized Difference Vegetation Index\n\n${F("NDVI = (NIR − Red) / (NIR + Red)")}\n\nHealthy vegetation reflects a lot of near-infrared and absorbs red light, so NDVI rises with canopy vigour. Ranges −1 to +1.\n\n• **> 0.5** — healthy, dense canopy\n• **0.2–0.5** — sparse or stressed\n• **< 0.2** — bare soil, water or dead crop\n\nIf a district's NDVI dips below ~0.4 in peak season, check irrigation or pest stress. See it spatially in the **Maps tab** (NDVI mode).`,
      hi: `### 🛰️ NDVI — नॉर्मलाइज़्ड डिफरेंस वेजिटेशन इंडेक्स\n\n${F("NDVI = (NIR − Red) / (NIR + Red)")}\n\nस्वस्थ पौधे बहुत नियर-इन्फ्रारेड परावर्तित करते हैं और लाल प्रकाश सोख लेते हैं, इसलिए NDVI फसल की जीवन-शक्ति के साथ बढ़ता है। सीमा −1 से +1।\n\n• **> 0.5** — स्वस्थ, घनी फसल\n• **0.2–0.5** — विरल या तनावग्रस्त\n• **< 0.2** — नंगी मिट्टी, पानी या मृत फसल\n\nअगर किसी जिले का NDVI पीक सीज़न में ~0.4 से नीचे गिरे, तो सिंचाई या कीट तनाव जाँचें। **Maps टैब** (NDVI मोड) में स्थानिक देखें।`,
      pa: `### 🛰️ NDVI — ਨੌਰਮਲਾਈਜ਼ਡ ਡਿਫਰੈਂਸ ਵੈਜੀਟੇਸ਼ਨ ਇੰਡੈਕਸ\n\n${F("NDVI = (NIR − Red) / (NIR + Red)")}\n\nਸਿਹਤਮਾਨ ਬੂਟੇ ਬਹੁਤ ਨਿਅਰ-ਇਨਫਰਾਰੈੱਡ ਪਰਿਵਰਤਿਤ ਕਰਦੇ ਹਨ ਤੇ ਲਾਲ ਰੋਸ਼ਨੀ ਸੋਖ ਲੈਂਦੇ ਹਨ, ਇਸ ਲਈ NDVI ਫ਼ਸਲ ਦੀ ਸਿਹਤ ਨਾਲ ਵੱਧਦਾ ਹੈ। ਹੱਦ −1 ਤੋਂ +1।\n\n• **> 0.5** — ਸਿਹਤਮਾਨ, ਸੰਘਣੀ ਫ਼ਸਲ\n• **0.2–0.5** — ਵਿਰਲ ਜਾਂ ਤਣਾਅ ਵਿੱਚ\n• **< 0.2** — ਨੰਗੀ ਮਿੱਟੀ, ਪਾਣੀ ਜਾਂ ਮਰੀ ਫ਼ਸਲ\n\nਜੇ ਕਿਸੇ ਜ਼ਿਲ੍ਹੇ ਦਾ NDVI ਸਿਖਰ ਰੁੱਤੇ ~0.4 ਤੋਂ ਹੇਠਾਂ ਜਾਵੇ, ਤਾਂ ਸਿੰਚਾਈ ਜਾਂ ਕੀੜਾ ਤਣਾਅ ਜਾਂਚੋ। **Maps ਟੈਬ** (NDVI ਮੋਡ) ਵਿੱਚ ਥਾਂ-ਥਾਂ ਵੇਖੋ।`,
    },
    followUps: {
      en: ["What does NDWI mean?", "What is EVI?", "Show me the weather pattern"],
      hi: ["NDWI का मतलब?", "EVI क्या है?", "मौसम का पैटर्न दिखाओ"],
      pa: ["NDWI ਦਾ ਮਤਲਬ?", "EVI ਕੀ ਹੈ?", "ਮੌਸਮ ਦਾ ਪੈਟਰਨ ਦਿਖਾਓ"],
    },
  },
  {
    id: "g-ndwi",
    role: "glossary",
    keywords: ["ndwi", "water index", "एनडीडब्ल्यूआई", "जल सूचकांक", "ਐਨਡਬਲਯੂਆਈ", "ਪਾਣੀ ਸੂਚਕ"],
    answer: {
      en: `### 💧 NDWI — Normalized Difference Water Index\n\n${F("NDWI = (Green − NIR) / (Green + NIR)")}\n\nTracks water content in vegetation and soil. Ranges −1 to +1.\n\n• **Positive** — good moisture / water present\n• **0 to 0.2** — moderate\n• **Negative** — dry stress\n\nFarmers can use NDWI dips as an early irrigation signal — it usually falls before visible wilting. View districts in the **Maps tab** (NDWI mode).`,
      hi: `### 💧 NDWI — नॉर्मलाइज़्ड डिफरेंस वाटर इंडेक्स\n\n${F("NDWI = (Green − NIR) / (Green + NIR)")}\n\nपौधों और मिट्टी में पानी की मात्रा मापता है। सीमा −1 से +1।\n\n• **सकारात्मक** — अच्छी नमी / पानी मौजूद\n• **0 से 0.2** — मध्यम\n• **ऋणात्मक** — सूखा तनाव\n\nNDWI का गिरना जल्दी सिंचाई का संकेत हो सकता है — यह आमतौर पर दिखने वाले मुरझाने से पहले गिरता है। **Maps टैब** (NDWI मोड) में जिले देखें।`,
      pa: `### 💧 NDWI — ਨੌਰਮਲਾਈਜ਼ਡ ਡਿਫਰੈਂਸ ਵਾਟਰ ਇੰਡੈਕਸ\n\n${F("NDWI = (Green − NIR) / (Green + NIR)")}\n\nਬੂਟਿਆਂ ਤੇ ਮਿੱਟੀ ਵਿੱਚ ਪਾਣੀ ਦੀ ਮਾਤਰਾ ਮਾਪਦਾ ਹੈ। ਹੱਦ −1 ਤੋਂ +1।\n\n• **ਪਾਜ਼ੇਟਿਵ** — ਵਧੀਆ ਨਮੀ / ਪਾਣੀ ਮੌਜੂਦ\n• **0 ਤੋਂ 0.2** — ਮੱਧਮ\n• **ਨੈਗੇਟਿਵ** — ਸੁੱਕਾ ਤਣਾਅ\n\nNDWI ਦਾ ਡਿੱਗਣਾ ਜਲਦੀ ਸਿੰਚਾਈ ਦਾ ਸੰਕੇਤ ਹੋ ਸਕਦਾ ਹੈ — ਇਹ ਆਮ ਤੌਰ 'ਤੇ ਦਿਖਣਯੋਗ ਮੁਰਝਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਡਿੱਗਦਾ ਹੈ। **Maps ਟੈਬ** (NDWI ਮੋਡ) ਵਿੱਚ ਜ਼ਿਲ੍ਹੇ ਵੇਖੋ।`,
    },
    followUps: {
      en: ["What is NDVI?", "Soil recommendations", "What does the Maps tab show?"],
      hi: ["NDVI क्या है?", "मिट्टी की सिफ़ारिशें", "Maps टैब क्या दिखाता है?"],
      pa: ["NDVI ਕੀ ਹੈ?", "ਮਿੱਟੀ ਦੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ", "Maps ਟੈਬ ਕੀ ਵਿਖਾਉਂਦਾ ਹੈ?"],
    },
  },
  {
    id: "g-evi",
    role: "glossary",
    keywords: ["evi", "enhanced vegetation", "ईवीआई", "एवीआई", "ਈਵੀਆਈ"],
    answer: {
      en: `### 🌿 EVI — Enhanced Vegetation Index\n\n${F("EVI = G × (NIR − Red) / (NIR + C1×Red − C2×Blue + L)")}\n\nAn NDVI improvement that corrects for atmospheric haze and soil background, and **saturates less** over dense canopies — which matters for lush Punjab crops at peak growth where NDVI flattens.\n\nIn this dataset EVI is used alongside NDVI/NDWI as a yield-model feature. Higher EVI in the growing season generally tracks better canopy development.`,
      hi: `### 🌿 EVI — एन्हांस्ड वेजिटेशन इंडेक्स\n\n${F("EVI = G × (NIR − Red) / (NIR + C1×Red − C2×Blue + L)")}\n\nNDVI का सुधरा रूप — वायुमंडलीय धुंध और मिट्टी के पृष्ठभूमि प्रभाव को सुधारता है, और घनी फसलों पर **कम संतृप्त** होता है — जो पंजाब की ऊसर फसलों के पीक ग्रोथ में अहम है जहाँ NDVI सपाट हो जाता है।\n\nइस डेटासेट में EVI, NDVI/NDWI के साथ उपज-मॉडल फ़ीचर के रूप में इस्तेमाल होता है। बढ़ते मौसम में ऊँचा EVI आमतौर पर बेहतर कैनोपी विकास दर्शाता है।`,
      pa: `### 🌿 EVI — ਐਨਹਾਂਸਡ ਵੈਜੀਟੇਸ਼ਨ ਇੰਡੈਕਸ\n\n${F("EVI = G × (NIR − Red) / (NIR + C1×Red − C2×Blue + L)")}\n\nNDVI ਦਾ ਸੁਧਰਿਆ ਰੂਪ — ਮਾਹੌਲੀ ਧੁੰਦ ਤੇ ਮਿੱਟੀ ਦੇ ਪਿਛੋਕੜ ਪ੍ਰਭਾਵ ਨੂੰ ਸੁਧਾਰਦਾ ਹੈ, ਤੇ ਸੰਘਣੀਆਂ ਫ਼ਸਲਾਂ 'ਤੇ **ਘੱਟ ਸੈਚੁਰੇਟ** ਹੁੰਦਾ ਹੈ — ਜੋ ਪੰਜਾਬ ਦੀਆਂ ਘਾਹ ਵਰਗੀਆਂ ਫ਼ਸਲਾਂ ਦੇ ਸਿਖਰ ਵਾਧੇ ਵਿੱਚ ਅਹਿਮ ਹੈ ਜਿੱਥੇ NDVI ਸਮਤਲ ਹੋ ਜਾਂਦਾ ਹੈ।\n\nਇਸ ਡੇਟਾਸੈੱਟ ਵਿੱਚ EVI, NDVI/NDWI ਦੇ ਨਾਲ ਝਾੜ-ਮਾਡਲ ਫ਼ੀਚਰ ਵਜੋਂ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ। ਵਧਦੇ ਮੌਸਮ ਵਿੱਚ ਉੱਚਾ EVI ਆਮ ਤੌਰ 'ਤੇ ਵਧੀਆ ਕੈਨੋਪੀ ਵਿਕਾਸ ਦਰਸਾਉਂਦਾ ਹੈ।`,
    },
    followUps: {
      en: ["What is NDVI?", "Which features matter most?", "What is this project?"],
      hi: ["NDVI क्या है?", "कौन-से फ़ीचर सबसे अहम हैं?", "यह प्रोजेक्ट क्या है?"],
      pa: ["NDVI ਕੀ ਹੈ?", "ਕਿਹੜੇ ਫ਼ੀਚਰ ਸਭ ਤੋਂ ਅਹਿਮ ਹਨ?", "ਇਹ ਪ੍ਰੋਜੈਕਟ ਕੀ ਹੈ?"],
    },
  },
  {
    id: "g-savi",
    role: "glossary",
    keywords: ["savi", "soil adjusted", "सावी", "मिट्टी समायोजित", "ਸਾਵੀ", "ਮਿੱਟੀ ਅਨੁਕੂਲਿਤ"],
    answer: {
      en: `### 🟫 SAVI — Soil Adjusted Vegetation Index\n\n${F("SAVI = ((NIR − Red) / (NIR + Red + L)) × (1 + L)")}\n\nLike NDVI but with a soil-brightness correction factor **L** (usually 0.5), designed for arid/semi-arid areas where bare soil shows between young crop rows — reducing false "stressed" readings early in the season.`,
      hi: `### 🟫 SAVI — सॉइल एडजस्टेड वेजिटेशन इंडेक्स\n\n${F("SAVI = ((NIR − Red) / (NIR + Red + L)) × (1 + L)")}\n\nNDVI जैसा, पर मिट्टी की चमक के लिए सुधार कारक **L** (आमतौर पर 0.5) के साथ — शुष्क/अर्ध-शुष्क क्षेत्रों के लिए जहाँ युवा फसल की कतारों के बीच नंगी मिट्टी दिखती है, जिससे मौसम की शुरुआत में झूठे "तनावग्रस्त" रीडिंग घटते हैं।`,
      pa: `### 🟫 SAVI — ਸੋਇਲ ਐਡਜਸਟਿਡ ਵੈਜੀਟੇਸ਼ਨ ਇੰਡੈਕਸ\n\n${F("SAVI = ((NIR − Red) / (NIR + Red + L)) × (1 + L)")}\n\nNDVI ਵਰਗਾ, ਪਰ ਮਿੱਟੀ ਦੀ ਚਮਕ ਲਈ ਸੁਧਾਰ ਕਾਰਕ **L** (ਆਮ ਤੌਰ 'ਤੇ 0.5) ਸਮੇਤ — ਸੁੱਕੇ/ਅੱਧ-ਸੁੱਕੇ ਇਲਾਕਿਆਂ ਲਈ ਜਿੱਥੇ ਨੌਜਵਾਨ ਫ਼ਸਲ ਦੀਆਂ ਕਤਾਰਾਂ ਵਿਚਕਾਰ ਨੰਗੀ ਮਿੱਟੀ ਦਿਖਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਰੁੱਤ ਦੇ ਸ਼ੁਰੂ ਵਿੱਚ ਝੂਠੇ "ਤਣਾਅ" ਰੀਡਿੰਗ ਘਟਦੀਆਂ ਹਨ।`,
    },
  },
  {
    id: "g-lst",
    role: "glossary",
    keywords: ["lst", "land surface temperature", "सतह तापमान", "ਸਤ੍ਹਾ ਤਾਪਮਾਨ"],
    answer: {
      en: `### 🌡️ LST — Land Surface Temperature\n\nThe radiative temperature of the ground measured from thermal infrared satellite bands (Landsat-8/9 provide it at 30 m). Unlike air temperature, it reflects how hot the actual surface is.\n\nUses: crop heat-stress detection (e.g. terminal heat on wheat in March), drought monitoring, and estimating evapotranspiration for irrigation planning.`,
      hi: `### 🌡️ LST — भू-सतह तापमान\n\nथर्मल इन्फ्रारेड सैटेलाइट बैंड से मापा गया ज़मीन का विकिरण तापमान (Landsat-8/9 इसे 30 मी पर देते हैं)। हवा के तापमान से अलग, यह असली सतह की गर्मी दिखाता है।\n\nउपयोग: फसल का गर्मी-तनाव पता लगाना (जैसे मार्च में गेहूं की झुलस), सूखा निगरानी, और सिंचाई योजना के लिए वाष्पोत्सर्जन अनुमान।`,
      pa: `### 🌡️ LST — ਧਰਤੀ ਸਤ੍ਹਾ ਤਾਪਮਾਨ\n\nਥਰਮਲ ਇਨਫਰਾਰੈੱਡ ਸੈਟੇਲਾਈਟ ਬੈਂਡਾਂ ਤੋਂ ਮਾਪਿਆ ਜ਼ਮੀਨ ਦਾ ਵਿਕਿਰਨ ਤਾਪਮਾਨ (Landsat-8/9 ਇਹ 30 ਮੀ 'ਤੇ ਦਿੰਦੇ ਹਨ)। ਹਵਾ ਦੇ ਤਾਪਮਾਨ ਤੋਂ ਵੱਖ, ਇਹ ਅਸਲ ਸਤ੍ਹਾ ਦੀ ਗਰਮੀ ਦਿਖਾਉਂਦਾ ਹੈ।\n\nਵਰਤੋਂ: ਫ਼ਸਲ ਦੀ ਗਰਮੀ-ਤਣਾਅ ਪਛਾਣ (ਜਿਵੇਂ ਮਾਰਚ ਵਿੱਚ ਕਣਕ ਦੀ ਝੁਲਸ), ਸੋਕਾ ਨਿਗਰਾਨੀ, ਤੇ ਸਿੰਚਾਈ ਯੋਜਨਾ ਲਈ ਭਾਫ਼-ਉਤਸਰਜਨ ਅਨੁਮਾਨ।`,
    },
  },
  {
    id: "g-cwsi",
    role: "glossary",
    keywords: ["cwsi", "water stress index", "जल तनाव सूचकांक", "ਪਾਣੀ ਤਣਾਅ ਸੂਚਕ"],
    answer: {
      en: `### 🥵 CWSI — Crop Water Stress Index\n\nQuantifies plant water stress from **canopy temperature** (stressed plants run hotter because stomata close). Ranges 0 (no stress) to 1 (severe).\n\n• **> 0.6** — irrigate now\n\nIn practice it's derived from thermal imagery (LST) plus weather data — a direct bridge between satellite observation and irrigation decisions.`,
      hi: `### 🥵 CWSI — क्रॉप वाटर स्ट्रेस इंडेक्स\n\n**कैनोपी तापमान** से पौधे के जल-तनाव को मापता है (तनावग्रस्त पौधे गर्म चलते हैं क्योंकि रंध्र बंद हो जाते हैं)। सीमा 0 (कोई तनाव नहीं) से 1 (गंभीर)।\n\n• **> 0.6** — अभी सिंचाई करें\n\nव्यवहार में यह थर्मल इमेजरी (LST) और मौसम डेटा से निकलता है — सैटेलाइट अवलोकन और सिंचाई निर्णय के बीच सीधा पुल।`,
      pa: `### 🥵 CWSI — ਕ੍ਰਾਪ ਵਾਟਰ ਸਟ੍ਰੈੱਸ ਇੰਡੈਕਸ\n\n**ਕੈਨੋਪੀ ਤਾਪਮਾਨ** ਤੋਂ ਬੂਟੇ ਦੇ ਪਾਣੀ-ਤਣਾਅ ਨੂੰ ਮਾਪਦਾ ਹੈ (ਤਣਾਅ ਵਿੱਚ ਬੂਟੇ ਗਰਮ ਚੱਲਦੇ ਹਨ ਕਿਉਂਕਿ ਰੰਧਰ ਬੰਦ ਹੋ ਜਾਂਦੇ ਹਨ)। ਹੱਦ 0 (ਕੋਈ ਤਣਾਅ ਨਹੀਂ) ਤੋਂ 1 (ਗੰਭੀਰ)।\n\n• **> 0.6** — ਹੁਣੇ ਸਿੰਚਾਈ ਕਰੋ\n\nਅਮਲ ਵਿੱਚ ਇਹ ਥਰਮਲ ਤਸਵੀਰਾਂ (LST) ਤੇ ਮੌਸਮ ਡੇਟਾ ਤੋਂ ਨਿਕਲਦਾ ਹੈ — ਸੈਟੇਲਾਈਟ ਅਵਲੋਕਨ ਤੇ ਸਿੰਚਾਈ ਫ਼ੈਸਲੇ ਵਿਚਕਾਰ ਸਿੱਧਾ ਪੁਲ।`,
    },
  },
  {
    id: "g-lai",
    role: "glossary",
    keywords: ["lai", "leaf area index", "पत्ती क्षेत्र", "पत्तियों का क्षेत्र", "ਪੱਤਾ ਖੇਤਰ", "ਪੱਤਿਆਂ ਦਾ ਖੇਤਰ"],
    answer: {
      en: `### 🍃 LAI — Leaf Area Index\n\nThe one-sided green leaf area per unit ground area (m²/m²). Bare soil = 0; dense forest > 6. Crops typically peak at **2–4** during maximum growth.\n\nLAI is the physical quantity vegetation indices like NDVI/EVI correlate with — it drives how much light the canopy intercepts, and therefore photosynthesis and yield.`,
      hi: `### 🍃 LAI — लीफ एरिया इंडेक्स\n\nप्रति इकाई भूमि क्षेत्र में एक-तरफ़ा हरी पत्तियों का क्षेत्र (m²/m²)। नंगी मिट्टी = 0; घना जंगल > 6। फसलें अधिकतम वृद्धि पर आमतौर पर **2–4** पर पहुँचती हैं।\n\nLAI वह भौतिक राशि है जिस से NDVI/EVI जैसे सूचकांक सहसंबंधित होते हैं — यह तय करता है कि कैनोपी कितना प्रकाश पकड़ती है, और इसलिए प्रकाश-संश्लेषण व उपज।`,
      pa: `### 🍃 LAI — ਲੀਫ ਏਰੀਆ ਇੰਡੈਕਸ\n\nਪ੍ਰਤੀ ਇਕਾਈ ਧਰਤੀ ਖੇਤਰ ਵਿੱਚ ਇੱਕ-ਪਾਸੜ ਹਰੇ ਪੱਤਿਆਂ ਦਾ ਖੇਤਰ (m²/m²)। ਨੰਗੀ ਮਿੱਟੀ = 0; ਸੰਘਣਾ ਜੰਗਲ > 6। ਫ਼ਸਲਾਂ ਵੱਧ ਤੋਂ ਵੱਧ ਵਾਧੇ 'ਤੇ ਆਮ ਤੌਰ 'ਤੇ **2–4** 'ਤੇ ਪਹੁੰਚਦੀਆਂ ਹਨ।\n\nLAI ਉਹ ਭੌਤਿਕ ਮਾਤਰਾ ਹੈ ਜਿਸ ਨਾਲ NDVI/EVI ਵਰਗੇ ਸੂਚਕ ਸਬੰਧਤ ਹੁੰਦੇ ਹਨ — ਇਹ ਤੈਅ ਕਰਦਾ ਹੈ ਕਿ ਕੈਨੋਪੀ ਕਿੰਨੀ ਰੋਸ਼ਨੀ ਫੜਦੀ ਹੈ, ਇਸ ਲਈ ਪ੍ਰਕਾਸ਼-ਸੰਸ਼ਲੇਸ਼ਣ ਤੇ ਝਾੜ।`,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLOSSARY — agriculture
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "g-kharif",
    role: "glossary",
    keywords: ["kharif", "monsoon season", "खरीफ", "ਖ਼ਰੀਫ", "ਸਰਦ", "sawni"],
    answer: {
      en: `### 🌧️ Kharif season (Jun–Oct)\nThe monsoon cropping season: sown with the rains (June), harvested in autumn (Oct–Nov). In Punjab the major Kharif crops are **paddy**, cotton, maize, soybean, bajra, moong and urad. The model treats season as a first-class feature because rainfall patterns (and therefore yields) differ sharply between Kharif and Rabi.`,
      hi: `### 🌧️ खरीफ मौसम (जून–अक्टूबर)\nमानसून की फसल-अवधि: बारिश के साथ बोई जाती है (जून), शरद में कटाई (अक्टूबर–नवंबर)। पंजाब की प्रमुख खरीफ फसलें — **धान**, कपास, मक्का, सोयाबीन, बाजरा, मूंग, उड़द। मॉडल मौसम को प्रमुख फ़ीचर मानता है क्योंकि वर्षा पैटर्न (और इसलिए उपज) खरीफ और रबी में बहुत अलग होते हैं।`,
      pa: `### 🌧️ ਖ਼ਰੀਫ ਰੁੱਤ (ਜੂਨ–ਅਕਤੂਬਰ)\nਮੌਨਸੂਨ ਦੀ ਫ਼ਸਲ-ਮਿਆਦ: ਮੀਂਹਾਂ ਨਾਲ ਬੀਜੀ ਜਾਂਦੀ ਹੈ (ਜੂਨ), ਪਤਝੜ ਵਿੱਚ ਵਾਢੀ (ਅਕਤੂਬਰ–ਨਵੰਬਰ)। ਪੰਜਾਬ ਦੀਆਂ ਮੁੱਖ ਖ਼ਰੀਫ ਫ਼ਸਲਾਂ — **ਝੋਨਾ**, ਕਪਾਹ, ਮੱਕੀ, ਸੋਯਾਬੀਨ, ਬਾਜਰਾ, ਮੂੰਗ, ਉੜਦ। ਮਾਡਲ ਰੁੱਤ ਨੂੰ ਮੋਹਰੀ ਫ਼ੀਚਰ ਮੰਨਦਾ ਹੈ ਕਿਉਂਕਿ ਮੀਂਹ ਦੇ ਪੈਟਰਨ (ਤੇ ਇਸ ਲਈ ਝਾੜ) ਖ਼ਰੀਫ ਤੇ ਰੱਬੀ ਵਿੱਚ ਬਹੁਤ ਵੱਖਰੇ ਹੁੰਦੇ ਹਨ।`,
    },
  },
  {
    id: "g-rabi",
    role: "glossary",
    keywords: ["rabi", "winter season", "रबी", "ਰੱਬੀ"],
    answer: {
      en: `### ❄️ Rabi season (Nov–Apr)\nThe winter cropping season: sown after the monsoon (Oct–Nov), harvested in spring (Mar–Apr). Punjab's Rabi backbone is **wheat**, plus mustard, barley, gram, peas, linseed and rapeseed. Rabi crops rely on irrigation rather than rain — terminal heat in March is the classic yield risk.`,
      hi: `### ❄️ रबी मौसम (नवंबर–अप्रैल)\nसर्दियों की फसल-अवधि: मानसून के बाद बोई जाती है (अक्टूबर–नवंबर), वसंत में कटाई (मार्च–अप्रैल)। पंजाब की रबी की रीढ़ **गेहूं** है, साथ में सरसों, जौ, चना, मटर, अलसी और रैपसीड। रबी फसलें बारिश पर नहीं, सिंचाई पर निर्भर हैं — मार्च की झुलसी गर्मी क्लासिक उपज जोखिम है।`,
      pa: `### ❄️ ਰੱਬੀ ਰੁੱਤ (ਨਵੰਬਰ–ਅਪ੍ਰੈਲ)\nਸਰਦੀਆਂ ਦੀ ਫ਼ਸਲ-ਮਿਆਦ: ਮੌਨਸੂਨ ਪਿੱਛੇ ਬੀਜੀ ਜਾਂਦੀ ਹੈ (ਅਕਤੂਬਰ–ਨਵੰਬਰ), ਬਸੰਤ ਵਿੱਚ ਵਾਢੀ (ਮਾਰਚ–ਅਪ੍ਰੈਲ)। ਪੰਜਾਬ ਦੀ ਰੱਬੀ ਦੀ ਰੀੜ੍ਹ **ਕਣਕ** ਹੈ, ਨਾਲ ਸਰ੍ਹੋਂ, ਜੌਂ, ਛੋਲੇ, ਮਟਰ, ਅਲਸੀ ਤੇ ਰੈਪਸੀਡ। ਰੱਬੀ ਫ਼ਸਲਾਂ ਮੀਂਹ 'ਤੇ ਨਹੀਂ, ਸਿੰਚਾਈ 'ਤੇ ਨਿਰਭਰ ਹਨ — ਮਾਰਚ ਦੀ ਝੁਲਸੀ ਗਰਮੀ ਕਲਾਸਿਕ ਝਾੜ ਜੋਖਮ ਹੈ।`,
    },
  },
  {
    id: "g-yield",
    role: "glossary",
    keywords: ["yield", "crop yield", "उपज", "ਝਾੜ"],
    answer: {
      en: `### 🌾 Crop yield\n\n${F("Yield = Total Production / Cultivated Area")}\n\nHarvest output per unit land, measured in **kg/ha** (or tonnes/ha) — the target variable of this project's model. "Production" is total tonnes; "yield" normalizes it per hectare, which is what makes districts and crops comparable.`,
      hi: `### 🌾 फसल उपज\n\n${F("Yield = Total Production / Cultivated Area")}\n\nप्रति इकाई भूमि उपज, **kg/ha** (या टन/हे) में मापी जाती है — इस प्रोजेक्ट के मॉडल का लक्ष्य चर। "उत्पादन" कुल टन है; "उपज" उसे प्रति हेक्टेयर सामान्य करती है, जिससे जिले और फसलें तुलनीय बनते हैं।`,
      pa: `### 🌾 ਫ਼ਸਲ ਝਾੜ\n\n${F("Yield = Total Production / Cultivated Area")}\n\nਪ੍ਰਤੀ ਇਕਾਈ ਜ਼ਮੀਨ ਉਪਜ, **kg/ha** (ਜਾਂ ਟਨ/ਹੈ) ਵਿੱਚ ਮਾਪੀ ਜਾਂਦੀ ਹੈ — ਇਸ ਪ੍ਰੋਜੈਕਟ ਦੇ ਮਾਡਲ ਦਾ ਟੀਚਾ ਵੇਰੀਏਬਲ। "ਪੈਦਾਵਾਰ" ਕੁੱਲ ਟਨ ਹੈ; "ਝਾੜ" ਉਸਨੂੰ ਪ੍ਰਤੀ ਹੈਕਟੇਅਰ ਸਮਾਨ ਕਰਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਜ਼ਿਲ੍ਹੇ ਤੇ ਫ਼ਸਲਾਂ ਤੁਲਨਾਯੋਗ ਬਣਦੇ ਹਨ।`,
    },
  },
  {
    id: "g-rotation",
    role: "glossary",
    keywords: ["rotation", "intercropping", "mixed cropping", "चक्र", "अंतःफसल", "फसल चक्र", "ਚੱਕਰ", "ਵਾਰੀ", "ਮਿਸ਼ਰਤ"],
    answer: {
      en: `### 🔄 Crop rotation & intercropping\n\n**Rotation** — growing different crops on the same land across seasons (Punjab's dominant system: wheat → paddy). It manages soil nutrients and pests, though the wheat–paddy monocycle raises groundwater and stubble concerns.\n\n**Intercropping** — two crops sharing the same field (wheat–moong, cotton–moong, sugarcane–potato) to spread risk and raise land-use efficiency.\n\nThe dataset is district-level, so it can't resolve individual rotation choices — but the Crop Fit tab can rank alternatives to paddy for your conditions.`,
      hi: `### 🔄 फसल चक्र और अंतःफसल\n\n**चक्र** — उसी भूमि पर मौसमों में अलग-अलग फसलें (पंजाब की प्रमुख प्रणाली: गेहूं → धान)। इससे मिट्टी के पोषक और कीट नियंत्रित होते हैं, हालाँकि गेहूं-धान एकचक्र भूजल और पराली की चिंताएँ बढ़ाता है।\n\n**अंतःफसल** — एक ही खेत में दो फसलें (गेहूं-मूंग, कपास-मूंग, गन्ना-आलू) — जोखिम बाँटने और भूमि-उपयोग बढ़ाने के लिए।\n\nडेटासेट जिला-स्तरीय है, इसलिए व्यक्तिगत चक्र विकल्प नहीं दिख सकते — पर **Crop Fit टैब** आपकी परिस्थितियों के लिए धान के विकल्प रैंक कर सकता है।`,
      pa: `### 🔄 ਫ਼ਸਲ ਚੱਕਰ ਤੇ ਵਿਚਕਾਰਲੀ ਫ਼ਸਲ\n\n**ਚੱਕਰ** — ਉਸੇ ਜ਼ਮੀਨ 'ਤੇ ਰੁੱਤਾਂ ਵਿੱਚ ਵੱਖ-ਵੱਖ ਫ਼ਸਲਾਂ (ਪੰਜਾਬ ਦੀ ਮੁੱਖ ਪ੍ਰਣਾਲੀ: ਕਣਕ → ਝੋਨਾ)। ਇਸ ਨਾਲ ਮਿੱਟੀ ਦੇ ਪੋਸ਼ਕ ਤੇ ਕੀੜੇ ਕਾਬੂ ਰਹਿੰਦੇ ਹਨ, ਭਾਵੇਂ ਕਣਕ-ਝੋਨਾ ਇਕ-ਚੱਕਰ ਧਰਤ ਹੇਠਲਾ ਪਾਣੀ ਤੇ ਪਰਾਲੀ ਦੀਆਂ ਚਿੰਤਾਵਾਂ ਵਧਾਉਂਦਾ ਹੈ।\n\n**ਵਿਚਕਾਰਲੀ ਫ਼ਸਲ** — ਇੱਕੋ ਖੇਤ ਵਿੱਚ ਦੋ ਫ਼ਸਲਾਂ (ਕਣਕ-ਮੂੰਗ, ਕਪਾਹ-ਮੂੰਗ, ਗੰਨਾ-ਆਲੂ) — ਜੋਖਮ ਵੰਡਣ ਤੇ ਜ਼ਮੀਨ-ਵਰਤੋਂ ਵਧਾਉਣ ਲਈ।\n\nਡੇਟਾਸੈੱਟ ਜ਼ਿਲ੍ਹਾ-ਪੱਧਰੀ ਹੈ, ਇਸ ਲਈ ਨਿੱਜੀ ਚੱਕਰ ਚੋਣਾਂ ਨਹੀਂ ਦਿਸ ਸਕਦੀਆਂ — ਪਰ **Crop Fit ਟੈਬ** ਤੁਹਾਡੀਆਂ ਹਾਲਤਾਂ ਲਈ ਝੋਨੇ ਦੇ ਬਦਲ ਰੈਂਕ ਕਰ ਸਕਦਾ ਹੈ।`,
    },
  },
  {
    id: "g-et",
    role: "glossary",
    keywords: ["evapotranspiration", "et0", "वाष्पोत्सर्जन", "ਭਾਫ਼", "ਭਾਫ਼-ਉਤਸਰਜਨ"],
    answer: {
      en: `### 💨 Evapotranspiration (ET)\nThe combined water loss from **soil evaporation + plant transpiration** — the total water demand of a crop. Potential ET (PET), computed from weather data, drives irrigation scheduling: when rainfall + soil moisture fall short of PET, it's time to irrigate.`,
      hi: `### 💨 वाष्पोत्सर्जन (ET)\n**मिट्टी से वाष्पीकरण + पौधों से स्वेदन** का संयुक्त जल-हानि — फसल की कुल जल-माँग। मौसम डेटा से निकला संभावित ET (PET) सिंचाई-समय तय करता है: जब वर्षा + मिट्टी नमी PET से कम पड़े, सिंचाई का समय।`,
      pa: `### 💨 ਭਾਫ਼-ਉਤਸਰਜਨ (ET)\n**ਮਿੱਟੀ ਤੋਂ ਭਾਫ਼ + ਬੂਟਿਆਂ ਤੋਂ ਪਸੀਨਾ** ਦਾ ਸੰਯੁਕਤ ਪਾਣੀ-ਘਾਟਾ — ਫ਼ਸਲ ਦੀ ਕੁੱਲ ਪਾਣੀ-ਲੋੜ। ਮੌਸਮ ਡੇਟਾ ਤੋਂ ਬਣਿਆ ਸੰਭਾਵਿਤ ET (PET) ਸਿੰਚਾਈ-ਸਮਾਂ ਤੈਅ ਕਰਦਾ ਹੈ: ਜਦੋਂ ਮੀਂਹ + ਮਿੱਟੀ ਨਮੀ PET ਤੋਂ ਘੱਟ ਹੋਵੇ, ਸਿੰਚਾਈ ਦਾ ਸਮਾਂ।`,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLOSSARY — statistics & ML
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "g-mae",
    role: "glossary",
    keywords: ["mae", "mean absolute error", "औसत त्रुटि", "ਔਸਤ ਗਲਤੀ"],
    answer: {
      en: `### 📏 MAE — Mean Absolute Error\n\n${F("MAE = (1/n) × Σ|predicted − actual|")}\n\nAverage miss size, in the same units as the target (kg/ha). Lower = better; it treats a 1,000 kg/ha over-prediction and under-prediction identically. For the numbers on the currently loaded dataset, ask *"how accurate is the model?"*`,
      hi: `### 📏 MAE — माध्य निरपेक्ष त्रुटि\n\n${F("MAE = (1/n) × Σ|predicted − actual|")}\n\nऔसत चूक का आकार, लक्ष्य की इकाई में (kg/ha)। कम = बेहतर; 1,000 kg/ha की अधिक या कम भविष्यवाणी दोनों बराबर गिनी जाती हैं। मौजूदा डेटासेट के आंकड़ों के लिए पूछें *"मॉडल कितना सटीक है?"*`,
      pa: `### 📏 MAE — ਮੀਨ ਐਬਸੋਲਿਊਟ ਐਰਰ\n\n${F("MAE = (1/n) × Σ|predicted − actual|")}\n\nਔਸਤ ਚੁੱਕ ਦਾ ਆਕਾਰ, ਟੀਚੇ ਦੀ ਇਕਾਈ ਵਿੱਚ (kg/ha)। ਘੱਟ = ਵਧੀਆ; 1,000 kg/ha ਜ਼ਿਆਦਾ ਜਾਂ ਘੱਟ ਭਵਿੱਖਬਾਣੀ ਦੋਵੇਂ ਬਰਾਬਰ ਗਿਣੀਆਂ ਜਾਂਦੀਆਂ ਹਨ। ਮੌਜੂਦਾ ਡੇਟਾਸੈੱਟ ਦੇ ਅੰਕੜਿਆਂ ਲਈ ਪੁੱਛੋ *"ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"*`,
    },
  },
  {
    id: "g-rmse",
    role: "glossary",
    keywords: ["rmse", "root mean square", "वर्ग माध्य", "ਵਰਗ ਮਾਧਿਅਮ"],
    answer: {
      en: `### 📐 RMSE — Root Mean Square Error\n\n${F("RMSE = √((1/n) × Σ(predicted − actual)²)")}\n\nLike MAE but squares errors first, so **big misses dominate**. RMSE is always ≥ MAE; a large gap between them means a few predictions are badly wrong even if typical ones are fine (here: sugarcane's huge yields).`,
      hi: `### 📐 RMSE — वर्ग माध्य मूल त्रुटि\n\n${F("RMSE = √((1/n) × Σ(predicted − actual)²)")}\n\nMAE जैसा, पर पहले त्रुटियों का वर्ग करता है, इसलिए **बड़ी चूकें प्रभावी** होती हैं। RMSE हमेशा ≥ MAE; दोनों में बड़ा अंतर मतलब कुछ भविष्यवाणियाँ बहुत गलत हैं भले ही सामान्य ठीक हों (यहाँ: गन्ने की विशाल उपज)।`,
      pa: `### 📐 RMSE — ਰੂਟ ਮੀਨ ਸਕੁਏਅਰ ਐਰਰ\n\n${F("RMSE = √((1/n) × Σ(predicted − actual)²)")}\n\nMAE ਵਰਗਾ, ਪਰ ਪਹਿਲਾਂ ਗਲਤੀਆਂ ਦਾ ਵਰਗ ਕਰਦਾ ਹੈ, ਇਸ ਲਈ **ਵੱਡੀਆਂ ਚੁੱਕਾਂ ਦਾ ਪ੍ਰਭਾਵ** ਜ਼ਿਆਦਾ ਹੁੰਦਾ ਹੈ। RMSE ਹਮੇਸ਼ਾ ≥ MAE; ਦੋਵਾਂ ਵਿੱਚ ਵੱਡਾ ਫ਼ਰਕ ਮਤਲਬ ਕੁਝ ਭਵਿੱਖਬਾਣੀਆਂ ਬਹੁਤ ਗਲਤ ਹਨ ਭਾਵੇਂ ਆਮ ਠੀਕ ਹੋਣ (ਇੱਥੇ: ਗੰਨੇ ਦਾ ਵੱਡਾ ਝਾੜ)।`,
    },
  },
  {
    id: "g-r2",
    role: "glossary",
    keywords: ["r2", "r²", "r squared", "coefficient of determination", "आर वर्ग", "ਆਰ ਸਕੁਏਅਰ"],
    answer: {
      en: `### 🎯 R² — Coefficient of Determination\n\n${F("R² = 1 − (SS_res / SS_tot)")}\n\nThe share of yield variance the model explains, from 0 to 1. For crop yield, **0.70–0.85 is considered good**; above 0.90 on test data can hint at leakage or overfitting. Ask *"how accurate is the model?"* to see R² for the loaded dataset.`,
      hi: `### 🎯 R² — निर्धारण गुणांक\n\n${F("R² = 1 − (SS_res / SS_tot)")}\n\nमॉडल जितना उपज-विचरण समझाता है, 0 से 1। फसल उपज के लिए **0.70–0.85 अच्छा माना जाता है**; टेस्ट डेटा पर 0.90+ लीकेज या ओवरफ़िटिंग का संकेत हो सकता है। लोड किए डेटासेट का R² देखने के लिए पूछें *"मॉडल कितना सटीक है?"*`,
      pa: `### 🎯 R² — ਨਿਰਧਾਰਨ ਗੁਣਾਂਕ\n\n${F("R² = 1 − (SS_res / SS_tot)")}\n\nਮਾਡਲ ਕਿੰਨਾ ਝਾੜ-ਵਿਭਿੰਨਤਾ ਸਮਝਾਉਂਦਾ ਹੈ, 0 ਤੋਂ 1। ਫ਼ਸਲ ਝਾੜ ਲਈ **0.70–0.85 ਵਧੀਆ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ**; ਟੈਸਟ ਡੇਟਾ 'ਤੇ 0.90+ ਲੀਕੇਜ ਜਾਂ ਓਵਰਫਿੱਟਿੰਗ ਦਾ ਸੰਕੇਤ ਹੋ ਸਕਦਾ ਹੈ। ਲੋਡ ਡੇਟਾਸੈੱਟ ਦਾ R² ਵੇਖਣ ਲਈ ਪੁੱਛੋ *"ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"*`,
    },
  },
  {
    id: "g-interval",
    role: "glossary",
    keywords: ["prediction interval", "confidence interval", "95%", "uncertainty band", "भविष्यवाणी अंतराल", "विश्वास अंतराल", "ਭਵਿੱਖਬਾਣੀ ਅੰਤਰਾਲ", "ਭਰੋਸਾ ਅੰਤਰਾਲ"],
    answer: {
      en: `### 📊 Prediction interval (Lower_95 / Upper_95)\n\nThe range where the true yield is expected to fall 95% of the time. Unlike a confidence interval, it includes **data noise as well as model uncertainty**.\n\nHow to use: a High-risk prediction should be read as "between Lower_95 and Upper_95", not as the point value. Wide intervals = the model is telling you it's unsure. Coverage of the intervals is charted in the **Reliability tab**.`,
      hi: `### 📊 भविष्यवाणी अंतराल (Lower_95 / Upper_95)\n\nवह सीमा जिसमें असली उपज 95% समय रहने की उम्मीद होती है। विश्वास अंतराल से अलग, इसमें **मॉडल अनिश्चितता के साथ डेटा शोर भी** शामिल है।\n\nउपयोग: उच्च-जोखिम भविष्यवाणी को बिंदु नहीं, "Lower_95 से Upper_95 के बीच" के रूप में पढ़ें। चौड़े अंतराल = मॉडल कह रहा है कि उसे यकीन नहीं। अंतराल कवरेज **Reliability टैब** में चार्ट है।`,
      pa: `### 📊 ਭਵਿੱਖਬਾਣੀ ਅੰਤਰਾਲ (Lower_95 / Upper_95)\n\nਉਹ ਹੱਦ ਜਿਸ ਵਿੱਚ ਅਸਲ ਝਾੜ 95% ਸਮੇਂ ਰਹਿਣ ਦੀ ਉਮੀਦ ਹੁੰਦੀ ਹੈ। ਭਰੋਸਾ ਅੰਤਰਾਲ ਤੋਂ ਵੱਖ, ਇਸ ਵਿੱਚ **ਮਾਡਲ ਅਨਿਸ਼ਚਿਤਤਾ ਦੇ ਨਾਲ ਡੇਟਾ ਸ਼ੋਰ ਵੀ** ਸ਼ਾਮਲ ਹੈ।\n\nਵਰਤੋਂ: ਉੱਚ-ਜੋਖਮ ਭਵਿੱਖਬਾਣੀ ਨੂੰ ਬਿੰਦੂ ਨਹੀਂ, "Lower_95 ਤੋਂ Upper_95 ਵਿਚਕਾਰ" ਵਜੋਂ ਪੜ੍ਹੋ। ਚੌੜੇ ਅੰਤਰਾਲ = ਮਾਡਲ ਕਹਿ ਰਿਹਾ ਹੈ ਕਿ ਉਸਨੂੰ ਯਕੀਨ ਨਹੀਂ। ਅੰਤਰਾਲ ਕਵਰੇਜ **Reliability ਟੈਬ** ਵਿੱਚ ਚਾਰਟ ਹੈ।`,
    },
  },
  {
    id: "g-calibration",
    role: "glossary",
    keywords: ["calibration", "calibrated", "well calibrated", "कैलिब्रेशन", "ਕੈਲੀਬ੍ਰੇਸ਼ਨ"],
    answer: {
      en: `### 🎚️ Calibration\n\nA model is **well calibrated** when its stated confidence matches reality — predictions claiming 95% intervals should contain actuals about 95% of the time.\n\nThe **Reliability tab** plots this directly: the reliability diagram compares predicted confidence vs observed accuracy, and the coverage figure tells you if the intervals are honest. Miscalibration cuts both ways — overconfident intervals mislead, overly wide ones are useless.`,
      hi: `### 🎚️ कैलिब्रेशन\n\nमॉडल **सु-कैलिब्रेटेड** है जब उसका कहा विश्वास हकीकत से मेल खाए — 95% अंतराल दावा करने वाली भविष्यवाणियों में असली उपज लगभग 95% बार होनी चाहिए।\n\n**Reliability टैब** इसे सीधे दिखाता है: reliability diagram अनुमानित विश्वास बनाम देखी गई सटीकता दिखाता है, और कवरेज आंकड़ा बताता है कि अंतराल ईमानदार हैं या नहीं। गलत कैलिब्रेशन दोनों ओर बुरा — अति-आत्मविश्वासी अंतराल भ्रमित करते हैं, बहुत चौड़े बेकार हैं।`,
      pa: `### 🎚️ ਕੈਲੀਬ੍ਰੇਸ਼ਨ\n\nਮਾਡਲ **ਚੰਗੀ ਤਰ੍ਹਾਂ ਕੈਲੀਬ੍ਰੇਟਿਡ** ਹੈ ਜਦੋਂ ਉਸਦਾ ਦੱਸਿਆ ਭਰੋਸਾ ਹਕੀਕਤ ਨਾਲ ਮਿਲਦਾ ਹੈ — 95% ਅੰਤਰਾਲ ਦੱਸਣ ਵਾਲੀਆਂ ਭਵਿੱਖਬਾਣੀਆਂ ਵਿੱਚ ਅਸਲ ਝਾੜ ਲਗਭਗ 95% ਵਾਰ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।\n\n**Reliability ਟੈਬ** ਇਹ ਸਿੱਧਾ ਵਿਖਾਉਂਦਾ ਹੈ: reliability diagram ਅਨੁਮਾਨਿਤ ਭਰੋਸਾ ਬਨਾਮ ਦੇਖੀ ਸ਼ੁੱਧਤਾ ਦਿਖਾਉਂਦਾ ਹੈ, ਤੇ ਕਵਰੇਜ ਅੰਕੜਾ ਦੱਸਦਾ ਹੈ ਕਿ ਅੰਤਰਾਲ ਇਮਾਨਦਾਰ ਹਨ ਜਾਂ ਨਹੀਂ। ਗਲਤ ਕੈਲੀਬ੍ਰੇਸ਼ਨ ਦੋਵੇਂ ਪਾਸੇ ਮਾੜਾ — ਵੱਧ-ਆਤਮਵਿਸ਼ਵਾਸੀ ਅੰਤਰਾਲ ਭਰਮਾਉਂਦੇ ਹਨ, ਬਹੁਤ ਚੌੜੇ ਬੇਕਾਰ ਹਨ।`,
    },
  },
  {
    id: "g-gbm",
    role: "glossary",
    keywords: ["gradient boosting", "gbm", "ensemble", "random forest", "boosting", "ग्रेडिएंट बूस्टिंग", "एनसेम्बल", "ਗਰੈਡੀਐਂਟ ਬੂਸਟਿੰਗ", "ਐਨਸੈਂਬਲ"],
    answer: {
      en: `### 🌲 Gradient boosting & ensembles\n\nAn **ensemble** combines many models for better accuracy than any single one. **Gradient boosting** builds trees sequentially — each new tree corrects the residual errors of the previous ones.\n\nIt's the state of the art for tabular data like district-season records. This project compared Ridge, Random Forest and Gradient Boosting under grouped cross-validation and gradient boosting won (see *"how was the model trained?"*).`,
      hi: `### 🌲 ग्रेडिएंट बूस्टिंग और एनसेम्बल\n\n**एनसेम्बल** कई मॉडलों को जोड़कर किसी एक से बेहतर सटीकता देता है। **ग्रेडिएंट बूस्टिंग** पेड़ क्रमवार बनाता है — हर नया पेड़ पिछले की अवशिष्ट त्रुटियाँ सुधारता है।\n\nजिला-मौसम रिकॉर्ड जैसे टैबुलर डेटा के लिए यह अग्रणी तकनीक है। इस प्रोजेक्ट ने Ridge, Random Forest और Gradient Boosting को ग्रुप्ड क्रॉस-वैलिडेशन से तुलना किया और ग्रेडिएंट बूस्टिंग जीता (*"मॉडल कैसे प्रशिक्षित हुआ?"* देखें)।`,
      pa: `### 🌲 ਗਰੈਡੀਐਂਟ ਬੂਸਟਿੰਗ ਤੇ ਐਨਸੈਂਬਲ\n\n**ਐਨਸੈਂਬਲ** ਕਈ ਮਾਡਲਾਂ ਨੂੰ ਜੋੜ ਕੇ ਕਿਸੇ ਇੱਕ ਤੋਂ ਵਧੀਆ ਸ਼ੁੱਧਤਾ ਦਿੰਦਾ ਹੈ। **ਗਰੈਡੀਐਂਟ ਬੂਸਟਿੰਗ** ਦਰੱਖਤ ਲੜੀਵਾਰ ਬਣਾਉਂਦਾ ਹੈ — ਹਰ ਨਵਾਂ ਦਰੱਖਤ ਪਿਛਲੇ ਦੀਆਂ ਬਚੀਆਂ-ਖੁੱਚੀਆਂ ਗਲਤੀਆਂ ਸੁਧਾਰਦਾ ਹੈ।\n\nਜ਼ਿਲ੍ਹਾ-ਰੁੱਤ ਰਿਕਾਰਡ ਵਰਗੇ ਟੇਬੂਲਰ ਡੇਟਾ ਲਈ ਇਹ ਅਗਵਾਨ ਤਕਨੀਕ ਹੈ। ਇਸ ਪ੍ਰੋਜੈਕਟ ਨੇ Ridge, Random Forest ਤੇ Gradient Boosting ਨੂੰ ਗਰੁੱਪਡ ਕਰਾਸ-ਵੈਲੀਡੇਸ਼ਨ ਨਾਲ ਤੁਲਨਾ ਕੀਤੀ ਤੇ ਗਰੈਡੀਐਂਟ ਬੂਸਟਿੰਗ ਜਿੱਤਿਆ (*"ਮਾਡਲ ਕਿਵੇਂ ਸਿਖਾਇਆ ਗਿਆ?"* ਵੇਖੋ)।`,
    },
  },
  {
    id: "g-overfit",
    role: "glossary",
    keywords: ["overfitting", "overfit", "data leakage", "leakage", "ओवरफिटिंग", "लीकेज", "ਓਵਰਫਿੱਟਿੰਗ", "ਲੀਕੇਜ"],
    answer: {
      en: `### 🕳️ Overfitting & data leakage\n\n**Overfitting** — the model memorizes training noise and fails on new data. Red flag: near-perfect training scores with weak test scores.\n\n**Data leakage** — information the model shouldn't legitimately have (e.g. the answer leaking through a feature) inflates metrics. A test R² of exactly 1.00 is a classic symptom.\n\nThis project defends against both: metrics are reported on **held-out groups** (GroupKFold by district × year), never on rows the model saw. An R² of 0.87 on test data indicates a healthy fit — strong but not suspicious.`,
      hi: `### 🕳️ ओवरफिटिंग और डेटा लीकेज\n\n**ओवरफिटिंग** — मॉडल प्रशिक्षण शोर रट लेता है और नए डेटा पर फेल होता है। संकेत: प्रशिक्षण स्कोर लगभग परफ़ेक्ट पर टेस्ट कमज़ोर।\n\n**डेटा लीकेज** — वह जानकारी जो मॉडल को वैध रूप से नहीं मिलनी चाहिए (जैसे फ़ीचर के ज़रिए जवाब का रिसना) मीट्रिक बढ़ा देती है। टेस्ट R² ठीक 1.00 क्लासिक लक्षण है।\n\nयह प्रोजेक्ट दोनों से बचाव करता है: मीट्रिक **छोड़े गए समूहों** पर (जिला × वर्ष से GroupKFold) रिपोर्ट होते हैं, कभी उन पंक्तियों पर नहीं जो मॉडल ने देखीं। टेस्ट R² 0.87 स्वस्थ फ़िट बताता है — मजबूत पर संदिग्ध नहीं।`,
      pa: `### 🕳️ ਓਵਰਫਿੱਟਿੰਗ ਤੇ ਡੇਟਾ ਲੀਕੇਜ\n\n**ਓਵਰਫਿੱਟਿੰਗ** — ਮਾਡਲ ਸਿਖਲਾਈ ਸ਼ੋਰ ਰਟ ਲੈਂਦਾ ਹੈ ਤੇ ਨਵੇਂ ਡੇਟਾ 'ਤੇ ਫੇਲ ਹੁੰਦਾ ਹੈ। ਸੰਕੇਤ: ਸਿਖਲਾਈ ਸਕੋਰ ਲਗਭਗ ਪਰਫੈਕਟ ਪਰ ਟੈਸਟ ਕਮਜ਼ੋਰ।\n\n**ਡੇਟਾ ਲੀਕੇਜ** — ਉਹ ਜਾਣਕਾਰੀ ਜੋ ਮਾਡਲ ਨੂੰ ਵਾਜਿਬ ਤੌਰ 'ਤੇ ਨਹੀਂ ਮਿਲਣੀ ਚਾਹੀਦੀ (ਜਿਵੇਂ ਫ਼ੀਚਰ ਰਾਹੀਂ ਜਵਾਬ ਦਾ ਲਿਹ ਲੱਗਣਾ) ਮੈਟ੍ਰਿਕ ਵਧਾ ਦਿੰਦੀ ਹੈ। ਟੈਸਟ R² ਠੀਕ 1.00 ਕਲਾਸਿਕ ਲੱਛਣ ਹੈ।\n\nਇਹ ਪ੍ਰੋਜੈਕਟ ਦੋਵਾਂ ਤੋਂ ਬਚਾਅ ਰੱਖਦਾ ਹੈ: ਮੈਟ੍ਰਿਕ **ਵੱਖ ਕੀਤੇ ਗਰੁੱਪਾਂ** 'ਤੇ (ਜ਼ਿਲ੍ਹਾ × ਸਾਲ ਤੋਂ GroupKFold) ਰਿਪੋਰਟ ਹੁੰਦੇ ਹਨ, ਕਦੇ ਉਨ੍ਹਾਂ ਕਤਾਰਾਂ 'ਤੇ ਨਹੀਂ ਜਿਹੜੀਆਂ ਮਾਡਲ ਨੇ ਵੇਖੀਆਂ। ਟੈਸਟ R² 0.87 ਸਿਹਤਮਾਨ ਫਿੱਟ ਦਰਸਾਉਂਦਾ ਹੈ — ਮਜ਼ਬੂਤ ਪਰ ਸ਼ੱਕੀ ਨਹੀਂ।`,
    },
  },
  {
    id: "g-hetero",
    role: "glossary",
    keywords: ["heteroscedastic", "heteroscedasticity", "unequal variance", "विषम विचलन", "ਵੱਖ-ਵੱਖ ਵਿਭਿੰਨਤਾ"],
    answer: {
      en: `### 📉 Heteroscedasticity\n\nWhen prediction error size **changes with the value being predicted**. In crop yield: errors are smaller for typical yields and larger at the extremes (a bad drought year, or sugarcane's scale).\n\nYou can see it in the dashboard — the uncertainty histogram and risk levels flag the extreme predictions where the model is least sure. That's why High-risk rows should be read as ranges.`,
      hi: `### 📉 हेटेरोसेडैस्टिसिटी\n\nजब भविष्यवाणी त्रुटि का आकार **भविष्यवाणी किए मान के साथ बदले**। फसल उपज में: सामान्य उपज पर त्रुटियाँ छोटी, चरम पर बड़ी (सूखे का साल, या गन्ने का पैमाना)।\n\nडैशबोर्ड में दिखता है — अनिश्चितता हिस्टोग्राम और जोखिम स्तर वही चरम भविष्यवाणियाँ चिह्नित करते हैं जहाँ मॉडल सबसे कम निश्चित है। इसीलिए उच्च-जोखिम पंक्तियों को सीमा के रूप में पढ़ें।`,
      pa: `### 📉 ਹੈਟੇਰੋਸੈਡੈਸਟਿਸਿਟੀ\n\nਜਦੋਂ ਭਵਿੱਖਬਾਣੀ ਗਲਤੀ ਦਾ ਆਕਾਰ **ਭਵਿੱਖਬਾਣੀ ਕੀਤੇ ਮੁੱਲ ਨਾਲ ਬਦਲੇ**। ਫ਼ਸਲ ਝਾੜ ਵਿੱਚ: ਆਮ ਝਾੜ 'ਤੇ ਗਲਤੀਆਂ ਛੋਟੀਆਂ, ਧਰੁਵੀ 'ਤੇ ਵੱਡੀਆਂ (ਸੋਕੇ ਦਾ ਸਾਲ, ਜਾਂ ਗੰਨੇ ਦਾ ਪੈਮਾਨਾ)।\n\nਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਦਿਖਦਾ ਹੈ — ਅਨਿਸ਼ਚਿਤਤਾ ਹਿਸਟੋਗ੍ਰਾਮ ਤੇ ਜੋਖਮ ਪੱਧਰ ਉਹੀ ਧਰੁਵੀ ਭਵਿੱਖਬਾਣੀਆਂ ਨਿਸ਼ਾਨਦੇਹ ਕਰਦੇ ਹਨ ਜਿੱਥੇ ਮਾਡਲ ਸਭ ਤੋਂ ਘੱਟ ਪੱਕਾ ਹੈ। ਇਸੇ ਕਰਕੇ ਉੱਚ-ਜੋਖਮ ਕਤਾਰਾਂ ਨੂੰ ਹੱਦ ਵਜੋਂ ਪੜ੍ਹੋ।`,
    },
  },
  {
    id: "g-feature",
    role: "glossary",
    keywords: ["feature", "training set", "test set", "train test split", "80/20", "फ़ीचर क्या", "प्रशिक्षण सेट", "ਫ਼ੀਚਰ ਕੀ", "ਸਿਖਲਾਈ ਸੈੱਟ"],
    answer: {
      en: `### 🧱 Features & train/test split\n\n**Feature** — an input variable the model learns from. Here: district, crop, NDVI, NDWI, EVI, rainfall, temperature, soil moisture.\n\n**Train/test split** — the data is divided so the model is evaluated on rows it never saw. This project uses grouped splits (district × year as groups), roughly 80/20 in the crop-wise experiments, with 5-fold GroupKFold for the final model — stricter than a random split because grouped evaluation proves the model generalizes to *new district-seasons*, not just new rows.`,
      hi: `### 🧱 फ़ीचर और train/test विभाजन\n\n**फ़ीचर** — मॉडल जिस इनपुट चर से सीखता है। यहाँ: जिला, फसल, NDVI, NDWI, EVI, वर्षा, तापमान, मिट्टी नमी।\n\n**Train/test विभाजन** — डेटा बाँटा जाता है ताकि मॉडल का मूल्यांकन उन पंक्तियों पर हो जो उसने कभी नहीं देखीं। इस प्रोजेक्ट में ग्रुप्ड विभाजन (जिला × वर्ष समूह), फसल-वार प्रयोगों में लगभग 80/20, और अंतिम मॉडल के लिए 5-फोल्ड GroupKFold — यादृच्छिक विभाजन से कड़ा, क्योंकि ग्रुप्ड मूल्यांकन सिद्ध करता है कि मॉडल *नए जिला-मौसमों* पर भी चलता है, सिर्फ नई पंक्तियों पर नहीं।`,
      pa: `### 🧱 ਫ਼ੀਚਰ ਤੇ train/test ਵੰਡ\n\n**ਫ਼ੀਚਰ** — ਮਾਡਲ ਜਿਸ ਇਨਪੁੱਟ ਵੇਰੀਏਬਲ ਤੋਂ ਸਿੱਖਦਾ ਹੈ। ਇੱਥੇ: ਜ਼ਿਲ੍ਹਾ, ਫ਼ਸਲ, NDVI, NDWI, EVI, ਮੀਂਹ, ਤਾਪਮਾਨ, ਮਿੱਟੀ ਨਮੀ।\n\n**Train/test ਵੰਡ** — ਡੇਟਾ ਵੰਡਿਆ ਜਾਂਦਾ ਹੈ ਤਾਂ ਜੋ ਮਾਡਲ ਦਾ ਮੁਲਾਂਕਣ ਉਨ੍ਹਾਂ ਕਤਾਰਾਂ 'ਤੇ ਹੋਵੇ ਜਿਹੜੀਆਂ ਉਸਨੇ ਕਦੇ ਨਹੀਂ ਵੇਖੀਆਂ। ਇਸ ਪ੍ਰੋਜੈਕਟ ਵਿੱਚ ਗਰੁੱਪਡ ਵੰਡ (ਜ਼ਿਲ੍ਹਾ × ਸਾਲ ਗਰੁੱਪ), ਫ਼ਸਲ-ਵਾਰ ਪ੍ਰਯੋਗਾਂ ਵਿੱਚ ਲਗਭਗ 80/20, ਤੇ ਅੰਤਿਮ ਮਾਡਲ ਲਈ 5-ਫੋਲਡ GroupKFold — ਰਲ਼ਵੀਂ ਵੰਡ ਤੋਂ ਸਖ਼ਤ, ਕਿਉਂਕਿ ਗਰੁੱਪਡ ਮੁਲਾਂਕਣ ਸਾਬਤ ਕਰਦਾ ਹੈ ਕਿ ਮਾਡਲ *ਨਵੇਂ ਜ਼ਿਲ੍ਹਾ-ਰੁੱਤਾਂ* 'ਤੇ ਵੀ ਚੱਲਦਾ ਹੈ, ਸਿਰਫ਼ ਨਵੀਆਂ ਕਤਾਰਾਂ 'ਤੇ ਨਹੀਂ।`,
    },
  },
  {
    id: "g-biasvar",
    role: "glossary",
    keywords: ["bias variance", "bias-variance", "tradeoff", "बायस वेरिएंस", "ਬਾਇਸ ਵੇਰੀਏਂਸ"],
    answer: {
      en: `### ⚖️ Bias–variance tradeoff\n\nThe balance between **underfitting** (too simple — misses real patterns) and **overfitting** (too complex — learns noise). Increasing model complexity lowers bias but raises variance.\n\nA test R² of ~0.87 sits in the sweet spot for agricultural data: complex enough to capture climate-yield relationships, regularized enough (cross-validated selection, median imputation, modest tree depth) to generalize.`,
      hi: `### ⚖️ बायस–वेरिएंस समझौता\n\n**अंडरफिटिंग** (बहुत सरल — असली पैटर्न छूटते हैं) और **ओवरफिटिंग** (बहुत जटिल — शोर रट लेता है) के बीच संतुलन। जटिलता बढ़ाने पर बायस घटता है पर वेरिएंस बढ़ता है।\n\n~0.87 का टेस्ट R² कृषि डेटा के लिए मधुर बिंदु पर है: जलवायु-उपज संबंध पकड़ने लायक जटिल, और सामान्यीकरण योग्य (क्रॉस-वैलिडेटेड चयन, मीडियन इम्प्यूटेशन, संयत ट्री गहराई)।`,
      pa: `### ⚖️ ਬਾਇਸ–ਵੇਰੀਏਂਸ ਸਮਝੌਤਾ\n\n**ਅੰਡਰਫਿੱਟਿੰਗ** (ਬਹੁਤ ਸਰਲ — ਅਸਲ ਪੈਟਰਨ ਛੁੱਟ ਜਾਂਦੇ ਹਨ) ਤੇ **ਓਵਰਫਿੱਟਿੰਗ** (ਬਹੁਤ ਗੁੰਝਲਦਾਰ — ਸ਼ੋਰ ਰਟ ਲੈਂਦਾ ਹੈ) ਵਿਚਕਾਰ ਸੰਤੁਲਨ। ਗੁੰਝਲਦਾਰੀ ਵਧਾਉਣ 'ਤੇ ਬਾਇਸ ਘਟਦਾ ਹੈ ਪਰ ਵੇਰੀਏਂਸ ਵਧਦਾ ਹੈ।\n\n~0.87 ਦਾ ਟੈਸਟ R² ਖੇਤੀ ਡੇਟਾ ਲਈ ਮਿੱਠੇ ਬਿੰਦੂ 'ਤੇ ਹੈ: ਮੌਸਮ-ਝਾੜ ਸਬੰਧ ਫੜਨ ਲਾਇਕ ਗੁੰਝਲਦਾਰ, ਤੇ ਆਮੀਕਰਨ ਯੋਗ (ਕਰਾਸ-ਵੈਲੀਡੇਟਿਡ ਚੋਣ, ਮੀਡੀਅਨ ਇਮਪਿਊਟੇਸ਼ਨ, ਸੰਯਤ ਟਰੀ ਡੂੰਘਾਈ)।`,
    },
  },
];

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** Escape a keyword for safe regex use. */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Score knowledge entries against the user's input.
 * Returns entries sorted by relevance (best first).
 */
export function findKnowledge(input: string): KnowledgeEntry[] {
  const q = input.toLowerCase();
  const scored: Array<{ entry: KnowledgeEntry; score: number }> = [];
  for (const entry of PROJECT_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(kw.toLowerCase())}`, "iu");
      if (re.test(q)) score += kw.includes(" ") ? 3 : 2; // multi-word hits are stronger
    }
    if (score > 0) scored.push({ entry, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.entry);
}

/** True if the question looks definitional ("what is X", "meaning of X", …). */
export function isDefinitional(input: string): boolean {
  return /(what is|what does|whats|define|definition|meaning|means|explain|tell me about|how does.*work|क्या है|का मतलब|मतलब क्या|समझाओ|की परिभाषा|ਕੀ ਹੈ|ਦਾ ਮਤਲਬ|ਮਤਲਬ ਕੀ|ਸਮਝਾਓ|ਦੀ ਪਰਿਭਾਸ਼ਾ)/i.test(input);
}
