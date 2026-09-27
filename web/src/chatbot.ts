/**
 * chatbot.ts — Data-grounded, multilingual answer engine for the AI Assistant.
 *
 * PURPOSE:
 *   Unlike the old canned-response chatbot, every answer here is computed from
 *   the ACTUAL dataset loaded in the dashboard (samples + predictions), so the
 *   numbers quoted (yields, MAE, R², rainfall…) always match the other tabs.
 *
 *   Responses are fully localized in English, Hindi (हिन्दी) and Punjabi (ਪੰਜਾਬੀ),
 *   and input detection works across languages too (e.g. "गेहूं का झाड़?" is
 *   understood as a wheat question).
 *
 * PUBLIC API:
 *   • buildDatasetStats(ctx)          → precomputed aggregates (call once per dataset)
 *   • answer(input, ctx, stats, lang) → { topic, markdown, followUps }
 *   • summarizeForLLM(stats)          → compact data snapshot injected into LLM prompts
 */

import { mean, formatNumber } from "./stats";
import { t, type Lang } from "./i18n";
import type { Prediction, Sample } from "./types";

export interface ChatContext {
  samples: Sample[];
  predictions: Prediction[];
}

export type Topic =
  | "greeting" | "gratitude" | "model" | "topCrops" | "topDistricts"
  | "crop" | "district" | "bestForDistrict" | "cropInDistrict"
  | "compare" | "soil" | "weather" | "satellite" | "risk" | "dataset"
  | "missingCrop" | "missingDistrict" | "fallback";

export interface ChatReply {
  topic: Topic;
  markdown: string;
  followUps: string[];
}

export interface CropStat {
  crop: string;
  n: number;
  avg: number;
  seasons: string[];
  districts: string[];
  topDistricts: Array<{ district: string; avg: number }>;
  byYear: Array<{ year: number; avg: number }>;
  trend: number;          // % change first → last year (0 if <2 years)
  mae: number;            // model MAE for this crop (0 if no predictions)
  errPct: number;         // mean Absolute_Error_Percent
}

export interface DistrictStat {
  district: string;
  n: number;
  avg: number;
  crops: string[];
  topCrops: Array<{ crop: string; avg: number }>;
  byYear: Array<{ year: number; avg: number }>;
  bestYear: { year: number; avg: number } | null;
}

export interface DatasetStats {
  samples: number;
  districts: string[];
  crops: string[];
  years: number[];
  seasons: string[];
  avgYield: number;
  medianYield: number;
  mae: number;
  rmse: number;
  r2: number;
  coverage95: number;     // % of actuals inside the 95% interval
  meanUnc: number;        // mean Uncertainty_Percent
  risk: { low: number; medium: number; high: number };
  cropStats: Map<string, CropStat>;
  districtStats: Map<string, DistrictStat>;
  topCrops: CropStat[];
  topDistricts: DistrictStat[];
  seasonAvg: Array<{ season: string; avg: number; rain: number; temp: number; ndvi: number }>;
  yearAvg: Array<{ year: number; avg: number }>;
  avgNdvi: number;
  avgNdwi: number;
  avgSoilMoisture: number;
}

// ---------------------------------------------------------------------------
// Static reference tables (crop/district names in हिन्दी and ਪੰਜਾਬੀ)
// ---------------------------------------------------------------------------

const CROP_LOCAL: Record<string, { hi: string; pa: string }> = {
  Wheat: { hi: "गेहूं", pa: "ਕਣਕ" },
  Paddy: { hi: "धान", pa: "ਝੋਨਾ" },
  Cotton: { hi: "कपास", pa: "ਕਪਾਹ" },
  Maize: { hi: "मक्का", pa: "ਮੱਕੀ" },
  Sugarcane: { hi: "गन्ना", pa: "ਗੰਨਾ" },
  Moong: { hi: "मूंग", pa: "ਮੂੰਗ" },
  Urad: { hi: "उड़द", pa: "ਉੜਦ" },
  "Arhar (Tur)": { hi: "अरहर", pa: "ਅਰਹਰ" },
  Groundnut: { hi: "मूंगफली", pa: "ਮੂੰਗਫਲੀ" },
  Mustard: { hi: "सरसों", pa: "ਸਰ੍ਹੋਂ" },
  Soybean: { hi: "सोयाबीन", pa: "ਸੋਯਾਬੀਨ" },
  Sunflower: { hi: "सूरजमुखी", pa: "ਸੂਰਜਮੁਖੀ" },
  Bajra: { hi: "बाजरा", pa: "ਬਾਜਰਾ" },
  Jowar: { hi: "ज्वार", pa: "ਜੁਆਰ" },
  Barley: { hi: "जौ", pa: "ਜੌਂ" },
  Linseed: { hi: "अलसੀ", pa: "ਅਲਸੀ" },
  Rapeseed: { hi: "रैपसीड", pa: "ਰੈਪਸੀਡ" },
};

/** Localized display name for a crop (English name kept in brackets for cross-reference). */
function cropName(crop: string, lang: Lang): string {
  if (lang === "en") return crop;
  const loc = CROP_LOCAL[crop];
  return loc ? `${loc[lang]} (${crop})` : crop;
}

/** Detection aliases: English + romanized + Devanagari + Gurmukhi. */
const CROP_ALIAS: Record<string, string[]> = {
  Wheat: ["wheat", "gehu", "kanak", "गेहूं", "गेहूँ", "कणक", "ਕਣਕ"],
  Paddy: ["paddy", "rice", "dhaan", "jhona", "धान", "चावल", "ਝੋਨਾ", "ਚੌਲ", "ਚਾਵਲ"],
  Cotton: ["cotton", "kapas", "narma", "कपास", "ਕਪਾਹ", "ਨਰਮਾ"],
  Maize: ["maize", "corn", "makka", "मक्का", "ਮੱਕੀ"],
  Sugarcane: ["sugarcane", "ganna", "kanna", "गन्ना", "ਗੰਨਾ", "ਕੰਨਾ"],
  Moong: ["moong", "मूंग", "ਮੂੰਗ"],
  Urad: ["urad", "mash", "उड़द", "माश", "ਉੜਦ", "ਮਾਸ਼"],
  "Arhar (Tur)": ["arhar", "toor", "अरहर", "ਅਰਹਰ"],
  Groundnut: ["groundnut", "peanut", "moongphali", "मूंगफली", "ਮੂੰਗਫਲੀ"],
  Mustard: ["mustard", "sarson", "सरसों", "ਸਰ੍ਹੋਂ"],
  Soybean: ["soybean", "सोयाबीन", "ਸੋਯਾਬੀਨ"],
  Sunflower: ["sunflower", "सूरजमुखी", "ਸੂਰਜਮੁਖੀ"],
  Bajra: ["bajra", "बाजरा", "ਬਾਜਰਾ"],
  Jowar: ["jowar", "sorghum", "ज्वार", "ਜੁਆਰ"],
  Barley: ["barley", "jau", "जौ", "ਜੌਂ"],
  Linseed: ["linseed", "flax", "alsi", "अलसी", "ਅਲਸੀ"],
  Rapeseed: ["rapeseed", "canola", "रैपसीड", "ਰੈਪਸੀਡ"],
};

const DISTRICT_ALIAS: Record<string, string[]> = {
  Amritsar: ["amritsar", "अमृतसर", "ਅੰਮ੍ਰਿਤਸਰ"],
  Barnala: ["barnala", "बरनाला", "ਬਰਨਾਲਾ"],
  Bathinda: ["bathinda", "bhatinda", "बठिंडा", "भटिंडा", "ਬਠਿੰਡਾ"],
  Faridkot: ["faridkot", "फरीदकोट", "ਫ਼ਰੀਦਕੋਟ"],
  "Fatehgarh Sahib": ["fatehgarh", "फतेहगढ़", "ਫ਼ਤਿਹਗੜ੍ਹ"],
  Fazilka: ["fazilka", "फाजिलका", "ਫ਼ਾਜ਼ਿਲਕਾ"],
  Firozpur: ["firozpur", "ferozepur", "फिरोजपुर", "ਫ਼ਿਰੋਜ਼ਪੁਰ"],
  Gurdaspur: ["gurdaspur", "गुरदासपुर", "ਗੁਰਦਾਸਪੁਰ"],
  Hoshiarpur: ["hoshiarpur", "होशियारपुर", "ਹੁਸ਼ਿਆਰਪੁਰ"],
  Jalandhar: ["jalandhar", "जालंधर", "ਜਲੰਧਰ"],
  Kapurthala: ["kapurthala", "कपूरथला", "ਕਪੂਰਥਲਾ"],
  Ludhiana: ["ludhiana", "लुधियाना", "ਲੁਧਿਆਣਾ"],
  Mansa: ["mansa", "मनसा", "ਮਾਨਸਾ"],
  Moga: ["moga", "मोगा", "ਮੋਗਾ"],
  Muktsar: ["muktsar", "मुक्तसर", "ਮੁਕਤਸਰ"],
  Pathankot: ["pathankot", "पठानकोट", "ਪਠਾਨਕੋਟ"],
  Patiala: ["patiala", "पटियाला", "ਪਟਿਆਲਾ"],
  Rupnagar: ["rupnagar", "ropar", "रूपनगर", "रोपड़", "ਰੂਪਨਗਰ", "ਰੋਪੜ"],
  Sangrur: ["sangrur", "संगरूर", "ਸੰਗਰੂਰ"],
  "Shahid Bhagat Singh Nagar": ["nawanshahr", "shahid bhagat singh", "नवांशहर", "ਨਵਾਂਸ਼ਹਿਰ"],
  "Tarn Taran": ["tarn taran", "तरन तारन", "ਤਰਨ ਤਾਰਨ"],
};

type Region = "Malwa" | "Doaba" | "Majha";

const REGION_OF: Record<string, Region> = {
  Bathinda: "Malwa", Mansa: "Malwa", Muktsar: "Malwa", Fazilka: "Malwa",
  Faridkot: "Malwa", Moga: "Malwa", Firozpur: "Malwa", Barnala: "Malwa",
  Sangrur: "Malwa", Patiala: "Malwa", Ludhiana: "Malwa",
  "Fatehgarh Sahib": "Malwa", Rupnagar: "Malwa",
  Jalandhar: "Doaba", Kapurthala: "Doaba", Hoshiarpur: "Doaba",
  "Shahid Bhagat Singh Nagar": "Doaba",
  Amritsar: "Majha", "Tarn Taran": "Majha", Gurdaspur: "Majha", Pathankot: "Majha",
};

const REGION_LOCAL: Record<Region, { en: string; hi: string; pa: string }> = {
  Malwa: { en: "Malwa", hi: "मालवा", pa: "ਮਾਲਵਾ" },
  Doaba: { en: "Doaba", hi: "दोआबा", pa: "ਦੋਆਬਾ" },
  Majha: { en: "Majha", hi: "माझा", pa: "ਮਾਝਾ" },
};

const REGION_NOTE: Record<Region, { en: string; hi: string; pa: string }> = {
  Malwa: {
    en: "South-west Punjab — the cotton belt on lighter loamy soils, with strong wheat–paddy rotation elsewhere. Canal-irrigated in the west, tubewell-fed in the east.",
    hi: "दक्षिण-पश्चिम पंजाब — हल्की दोमट मिट्टी पर कपास की पट्टी, बाकी इलाकों में गेहूं-धान चक्र। पश्चिम में नहर सिंचाई, पूर्व में ट्यूबवेल।",
    pa: "ਦੱਖਣ-ਪੱਛਮੀ ਪੰਜਾਬ — ਹਲਕੀ ਦੋਮਟ ਮਿੱਟੀ 'ਤੇ ਕਪਾਹ ਦੀ ਪੱਟੀ, ਬਾਕੀ ਥਾਵਾਂ 'ਤੇ ਕਣਕ-ਝੋਨਾ ਚੱਕਰ। ਪੱਛਮ ਵਿੱਚ ਨਹਿਰ ਸਿੰਚਾਈ, ਪੂਰਬ ਵਿੱਚ ਟਿਊਬਵੈੱਲ।",
  },
  Doaba: {
    en: "The land between the Beas and the Sutlej — prime wheat–paddy country, plus potatoes, vegetables and dairy farming.",
    hi: "ब्यास और सतलुज के बीच की भूमि — गेहूं-धान का प्रमुख इलाका, साथ में आलू, सब्ज़ियाँ और डेयरी।",
    pa: "ਬਿਆਸ ਤੇ ਸਤਲੁਜ ਵਿਚਕਾਰ ਦੀ ਧਰਤੀ — ਕਣਕ-ਝੋਨੇ ਦਾ ਮੋਹਰੀ ਇਲਾਕਾ, ਨਾਲ ਆਲੂ, ਸਬਜ਼ੀਆਂ ਤੇ ਡੇਅਰੀ।",
  },
  Majha: {
    en: "North-west Punjab — fertile floodplain along the Ravi and Beas; wheat, paddy and premium basmati.",
    hi: "उत्तर-पश्चिम पंजाब — रावी और ब्यास के किनारे उपजाऊ मैदान; गेहूं, धान और बासमती।",
    pa: "ਉੱਤਰ-ਪੱਛਮੀ ਪੰਜਾਬ — ਰਾਵੀ ਤੇ ਬਿਆਸ ਦੇ ਕੰਢੇ ਉਪਜਾਊ ਮੈਦਾਨ; ਕਣਕ, ਝੋਨਾ ਤੇ ਵਧੀਆ ਬਾਸਮਤੀ।",
  },
};

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export function buildDatasetStats(ctx: ChatContext): DatasetStats {
  const { samples, predictions } = ctx;
  const districts = [...new Set(samples.map((s) => s.District))].sort();
  const crops = [...new Set(samples.map((s) => s.Crop))].sort();
  const years = [...new Set(samples.map((s) => s.Year))].sort((a, b) => a - b);
  const seasons = [...new Set(samples.map((s) => s.Season))].sort();

  // Per-crop aggregates
  const cropStats = new Map<string, CropStat>();
  for (const crop of crops) {
    const rows = samples.filter((s) => s.Crop === crop);
    const cropDistricts = [...new Set(rows.map((s) => s.District))].sort();
    const byDistrict = new Map<string, number[]>();
    for (const r of rows) {
      const arr = byDistrict.get(r.District) ?? [];
      arr.push(r.Yield_kg_ha);
      byDistrict.set(r.District, arr);
    }
    const topDistricts = [...byDistrict.entries()]
      .map(([district, ys]) => ({ district, avg: Math.round(mean(ys)) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
    const byYear = years
      .map((y) => ({ year: y, avg: Math.round(mean(rows.filter((r) => r.Year === y).map((r) => r.Yield_kg_ha))) }))
      .filter((e) => e.avg > 0);
    const trend =
      byYear.length >= 2 && byYear[0].avg > 0
        ? ((byYear[byYear.length - 1].avg - byYear[0].avg) / byYear[0].avg) * 100
        : 0;
    const preds = predictions.filter((p) => p.Crop === crop);
    const mae = preds.length ? Math.round(mean(preds.map((p) => Math.abs(p.Predicted_Yield - p.Actual_Yield)))) : 0;
    const errPct = preds.length ? mean(preds.map((p) => p.Absolute_Error_Percent)) : 0;
    cropStats.set(crop, {
      crop, n: rows.length, avg: Math.round(mean(rows.map((s) => s.Yield_kg_ha))),
      seasons: [...new Set(rows.map((s) => s.Season))].sort(),
      districts: cropDistricts, topDistricts, byYear, trend, mae, errPct,
    });
  }

  // Per-district aggregates
  const districtStats = new Map<string, DistrictStat>();
  for (const district of districts) {
    const rows = samples.filter((s) => s.District === district);
    const byCrop = new Map<string, number[]>();
    for (const r of rows) {
      const arr = byCrop.get(r.Crop) ?? [];
      arr.push(r.Yield_kg_ha);
      byCrop.set(r.Crop, arr);
    }
    const topCrops = [...byCrop.entries()]
      .map(([crop, ys]) => ({ crop, avg: Math.round(mean(ys)) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
    const byYear = years
      .map((y) => ({ year: y, avg: Math.round(mean(rows.filter((r) => r.Year === y).map((r) => r.Yield_kg_ha))) }))
      .filter((e) => e.avg > 0);
    const bestYear = byYear.length ? [...byYear].sort((a, b) => b.avg - a.avg)[0] : null;
    districtStats.set(district, {
      district, n: rows.length, avg: Math.round(mean(rows.map((s) => s.Yield_kg_ha))),
      crops: [...byCrop.keys()].sort(), topCrops, byYear, bestYear,
    });
  }

  const topCrops = [...cropStats.values()].sort((a, b) => b.avg - a.avg);
  const topDistricts = [...districtStats.values()].sort((a, b) => b.avg - a.avg);

  // Season-level environment averages
  const seasonAvg = seasons.map((season) => {
    const rows = samples.filter((s) => s.Season === season);
    return {
      season,
      avg: Math.round(mean(rows.map((s) => s.Yield_kg_ha))),
      rain: Math.round(mean(rows.map((s) => s.Rainfall_mm))),
      temp: Math.round(mean(rows.map((s) => s.Temperature_C)) * 10) / 10,
      ndvi: Math.round(mean(rows.map((s) => s.NDVI)) * 100) / 100,
    };
  });

  const yearAvg = years.map((y) => ({
    year: y,
    avg: Math.round(mean(samples.filter((s) => s.Year === y).map((s) => s.Yield_kg_ha))),
  }));

  // Model quality
  const actuals = predictions.map((p) => p.Actual_Yield);
  const preds = predictions.map((p) => p.Predicted_Yield);
  const absErrors = predictions.map((p) => Math.abs(p.Predicted_Yield - p.Actual_Yield));
  const mae = predictions.length ? mean(absErrors) : 0;
  const rmse = predictions.length ? Math.sqrt(mean(absErrors.map((e) => e * e))) : 0;
  const am = predictions.length ? mean(actuals) : 0;
  const ssRes = predictions.length ? actuals.reduce((acc, a, i) => acc + (a - preds[i]) ** 2, 0) : 0;
  const ssTot = predictions.length ? actuals.reduce((acc, a) => acc + (a - am) ** 2, 0) : 0;
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const inside = predictions.filter(
    (p) => p.Actual_Yield >= p.Lower_95_Interval && p.Actual_Yield <= p.Upper_95_Interval,
  ).length;
  const coverage95 = predictions.length ? (inside / predictions.length) * 100 : 0;
  const meanUnc = predictions.length ? mean(predictions.map((p) => p.Uncertainty_Percent)) : 0;
  const risk = { low: 0, medium: 0, high: 0 };
  for (const p of predictions) {
    const lvl = (p.Reliability_Risk_Level || "").toLowerCase();
    if (lvl.includes("low")) risk.low++;
    else if (lvl.includes("medium")) risk.medium++;
    else if (lvl.includes("high")) risk.high++;
  }

  return {
    samples: samples.length,
    districts, crops, years, seasons,
    avgYield: Math.round(mean(samples.map((s) => s.Yield_kg_ha))),
    medianYield: 0, // filled in withMedian()
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    r2, coverage95, meanUnc, risk,
    cropStats, districtStats, topCrops, topDistricts,
    seasonAvg, yearAvg,
    avgNdvi: Math.round(mean(samples.map((s) => s.NDVI)) * 100) / 100,
    avgNdwi: Math.round(mean(samples.map((s) => s.NDWI)) * 100) / 100,
    avgSoilMoisture: Math.round(mean(samples.map((s) => s.Soil_Moisture)) * 100) / 100,
  };
}
// medianYield is computed in one extra pass so the big object stays readable.
export function withMedian(stats: DatasetStats, samples: Sample[]): DatasetStats {
  const ys = samples.map((s) => s.Yield_kg_ha).sort((a, b) => a - b);
  const mid = Math.floor(ys.length / 2);
  const med = ys.length === 0 ? 0 : ys.length % 2 ? ys[mid] : (ys[mid - 1] + ys[mid]) / 2;
  return { ...stats, medianYield: Math.round(med) };
}

// ---------------------------------------------------------------------------
// Intent detection (multilingual)
// ---------------------------------------------------------------------------

const RX = {
  compare: /(compare|comparison|\bvs\.?\b|versus|तुलना|ਤੁਲਨਾ)/i,
  best: /(best|top|highest|most|leading|recommend|suggest|which|कौन|सबसे|अच्छ|बेहतर|सुझाव|सिफ़ारिश|ਵਧੀਆ|ਸਭ ਤੋਂ|ਸਿਫ਼ਾਰਸ਼|ਕਿਹੜੀ|ਕਿਹੜਾ)/i,
  cropWord: /(crop|crops|फसल|फ़सल|ਫ਼ਸਲ)/i,
  districtWord: /(district|districts|जिल|ज़िल|ਜ਼ਿਲ੍ਹ|ਜਿਲ੍ਹ)/i,
  model: /(model|accuracy|accurate|\bmae\b|\brmse\b|\br2\b|r²|predict|forecast|\bscore\b|मॉडल|सटीक|पूर्वानुमान|भविष्यवाणी|ਮਾਡਲ|ਸ਼ੁੱਧ|ਭਵਿੱਖਬਾਣੀ)/i,
  risk: /(risk|uncertain|reliab|confidence|interval|calibrat|जोखिम|अनिश्चि|विश्वसनी|अंतराल|ਜੋਖਮ|ਅਨਿਸ਼ਚਿ|ਭਰੋਸੇ|ਅੰਤਰਾਲ)/i,
  soil: /(soil|fertil|\bnpk\b|nutrient|\bph\b|manure|compost|मिट्टी|माटी|खाद|उर्वरक|mitti|ਮਿੱਟੀ|ਖਾਦ)/i,
  weather: /(weather|climate|\brain\b|rains|monsoon|temperature|irrigat|water|drought|मौसम|जलवायु|वर्षा|बारिश|मानसून|तापमान|सिंचाई|पानी|ਮੌਸਮ|ਜਲਵਾਯੂ|ਮੀਂਹ|ਬਰਸਾਤ|ਤਾਪਮਾਨ|ਸਿੰਚਾਈ|ਪਾਣੀ)/i,
  satellite: /(ndvi|ndwi|evi|satellite|remote.sensing|imagery|indices|index|उपग्रह|सैटेलाइट|सूचकांक|ਸੈਟੇਲਾਈਟ|ਸੂਚਕ)/i,
  dataset: /(dataset|\bdata\b|samples|rows|records|डेटा|नमून|ਡੇਟਾ|ਨਮੂਨ)/i,
  greeting: /(^|\s)(hi|hello|hey|namaste|namaskar|sat sri akal|नमस्ते|नमस्कार|हैलो|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|ਨਮਸਤੇ|ਹੈਲੋ)(\s|$|[!,.?])/i,
  who: /(who are you|your name|कौन हो|कौन हैं|ਕੌਣ ਹੈਂ|ਕੌਣ ਹੋ)/i,
  thanks: /(thank|thanks|dhanyavad|shukriya|धन्यवाद|शुक्रिया|ਧੰਨਵਾਦ|ਸ਼ੁਕਰੀਆ)/i,
};

function findCrops(text: string, available: string[]): { found: string[]; missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  for (const [crop, aliases] of Object.entries(CROP_ALIAS)) {
    for (const alias of aliases) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${alias}(?![\\p{L}\\p{N}])`, "iu");
      if (re.test(text)) {
        (available.includes(crop) ? found : missing).push(crop);
        break;
      }
    }
  }
  return { found, missing };
}

function findDistricts(text: string, available: string[]): { found: string[]; missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  for (const [district, aliases] of Object.entries(DISTRICT_ALIAS)) {
    for (const alias of aliases) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${alias}(?![\\p{L}\\p{N}])`, "iu");
      if (re.test(text)) {
        (available.includes(district) ? found : missing).push(district);
        break;
      }
    }
  }
  return { found, missing };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmt = formatNumber;
const sign = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;

// ---------------------------------------------------------------------------
// Answer builders — each returns localized markdown + follow-up chips
// ---------------------------------------------------------------------------

function greetingAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const top = s.topCrops[0];
  const mk = (head: string, bullets: string[], ask: string[], tail: string) =>
    `${head}\n\n${bullets.map((b) => `• ${b}`).join("\n")}\n\n${ask.join("\n")}\n\n${tail}`;
  if (lang === "hi") {
    return {
      topic: "greeting",
      markdown: mk(
        "👋 **नमस्ते! मैं किसान AI हूँ** — पंजाब की खेती का आपका सहायक।",
        [
          `📦 **${fmt(s.samples)} नमूने** — ${s.districts.length} जिले × ${s.crops.length} फसलें × ${s.years[0]}–${s.years[s.years.length - 1]}`,
          `🎯 मॉडल: **R² ${s.r2.toFixed(2)}**, MAE **${fmt(s.mae)} kg/ha**`,
          top && `🏆 सबसे ज़्यादा उपज: **${cropName(top.crop, "hi")} (${fmt(top.avg)} kg/ha)**`,
        ].filter(Boolean) as string[],
        [
          '**पूछें जैसे:** "किस जिले की उपज सबसे ज़्यादा है?"',
          '"मॉडल कितना सटीक है?" · "बठिंडा के लिए सबसे अच्छी फसल?" · "NDVI 0.6 का मतलब?"',
        ],
        "💬 ऊपर के बटन से भाषा बदलें — ਮੈਂ ਪੰਜਾਬੀ ਵੀ ਬੋਲਦਾ ਹਾਂ!",
      ),
      followUps: [
        "किस जिले की उपज सबसे ज़्यादा है?",
        "मॉडल कितना सटीक है?",
        "लुधियाना के लिए सबसे अच्छी फसल?",
      ],
    };
  }
  if (lang === "pa") {
    return {
      topic: "greeting",
      markdown: mk(
        "👋 **ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕਿਸਾਨ AI ਹਾਂ** — ਪੰਜਾਬ ਦੀ ਖੇਤੀ ਦਾ ਤੁਹਾਡਾ ਸਹਾਇਕ।",
        [
          `📦 **${fmt(s.samples)} ਨਮੂਨੇ** — ${s.districts.length} ਜ਼ਿਲ੍ਹੇ × ${s.crops.length} ਫ਼ਸਲਾਂ × ${s.years[0]}–${s.years[s.years.length - 1]}`,
          `🎯 ਮਾਡਲ: **R² ${s.r2.toFixed(2)}**, MAE **${fmt(s.mae)} kg/ha**`,
          top && `🏆 ਸਭ ਤੋਂ ਵੱਧ ਝਾੜ: **${cropName(top.crop, "pa")} (${fmt(top.avg)} kg/ha)**`,
        ].filter(Boolean) as string[],
        [
          '**ਪੁੱਛੋ ਜਿਵੇਂ:** "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"',
          '"ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?" · "ਬਠਿੰਡਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?" · "NDVI 0.6 ਦਾ ਕੀ ਮਤਲਬ?"',
        ],
        "💬 ਉੱਤੇ ਦੇ ਬਟਨ ਨਾਲ ਬੋਲੀ ਬਦਲੋ — मैं हिंदी भी बोलता हूँ!",
      ),
      followUps: [
        "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?",
        "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?",
        "ਲੁਧਿਆਣਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?",
      ],
    };
  }
  return {
    topic: "greeting",
    markdown: mk(
      "👋 **Sat Sri Akal! I'm KisanAI** — your farming assistant for Punjab.",
      [
        `📦 **${fmt(s.samples)} samples** — ${s.districts.length} districts × ${s.crops.length} crops × ${s.years[0]}–${s.years[s.years.length - 1]}`,
        `🎯 Model: **R² ${s.r2.toFixed(2)}**, MAE **${fmt(s.mae)} kg/ha**`,
        top && `🏆 Top crop by yield: **${cropName(top.crop, "en")} (${fmt(top.avg)} kg/ha)**`,
      ].filter(Boolean) as string[],
      [
        '**Ask me things like:** "Which district has the highest yield?"',
        '"How accurate is the model?" · "Best crop for Bathinda?" · "What does NDVI 0.6 mean?"',
      ],
      "💬 Switch language with the buttons above — मैं हिंदी बोलता हूँ, ਮੈਂ ਪੰਜਾਬੀ ਵੀ ਬੋਲਦਾ ਹਾਂ!",
    ),
    followUps: [
      "Which district has the highest yield?",
      "How accurate is the model?",
      "Best crop for Ludhiana?",
    ],
  };
}

function gratitudeAnswer(lang: Lang): ChatReply {
  const text =
    lang === "hi" ? "आपका स्वागत है! 🌾 खेती में मदद के लिए कभी भी पूछें — मैं यहीं हूँ।"
    : lang === "pa" ? "ਜੀ ਆਇਆਂ ਨੂੰ! 🌾 ਖੇਤੀ ਬਾਰੇ ਕਿਸੇ ਵੀ ਸਮੇਂ ਪੁੱਛੋ — ਮੈਂ ਇੱਥੇ ਹਾਂ।"
    : "You're welcome! 🌾 Ask me anything about farming, anytime — I'm right here.";
  return { topic: "gratitude", markdown: text, followUps: [] };
}

function modelAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const withErr = s.topCrops.filter((c) => c.errPct > 0);
  const best = withErr.length ? [...withErr].sort((a, b) => a.errPct - b.errPct)[0] : null;
  const worst = withErr.length ? [...withErr].sort((a, b) => b.errPct - a.errPct)[0] : null;
  const tabRel = t("tab.reliability", lang);
  if (lang === "hi") {
    return {
      topic: "model",
      markdown: `### 📊 मॉडल प्रदर्शन (मौजूदा डेटा पर)\n\n• **R² = ${s.r2.toFixed(2)}** — मॉडल उपज के ${(s.r2 * 100).toFixed(0)}% बदलाव की व्याख्या करता है\n• **MAE = ${fmt(s.mae)} kg/ha** — औसत भविष्यवाणी त्रुटि\n• **RMSE = ${fmt(s.rmse)} kg/ha** — बहुत अधिक/कम उपज पर बड़ी त्रुटियाँ\n• **95% अंतराल कवरेज = ${s.coverage95.toFixed(1)}%** — वास्तविक उपज इतनी बार अंतराल के भीतर रही\n• **औसत अनिश्चितता = ${s.meanUnc.toFixed(1)}%**\n\nजोखिम विभाजन: 🟢 कम ${fmt(s.risk.low)} · 🟡 मध्यम ${fmt(s.risk.medium)} · 🔴 उच्च ${fmt(s.risk.high)} भविष्यवाणियाँ।${best && worst ? `\n\nसबसे सटीक: **${cropName(best.crop, "hi")} (${best.errPct.toFixed(1)}% औसत त्रुटि)** · सबसे चुनौतीपूर्ण: **${cropName(worst.crop, "hi")} (${worst.errPct.toFixed(1)}%)**` : ""}\n\n💡 सुझाव: **${tabRel} टैब** में पूरा कैलिब्रेशन देखें, या पूछें *"हाई रिस्क का क्या मतलब है?"*`,
      followUps: [
        "किस जिले की उपज सबसे ज़्यादा है?",
        "हाई रिस्क का क्या मतलब है?",
        "गेहूं और धान की तुलना करें",
      ],
    };
  }
  if (lang === "pa") {
    return {
      topic: "model",
      markdown: `### 📊 ਮਾਡਲ ਪ੍ਰਦਰਸ਼ਨ (ਮੌਜੂਦਾ ਡੇਟਾ 'ਤੇ)\n\n• **R² = ${s.r2.toFixed(2)}** — ਮਾਡਲ ਝਾੜ ਦੇ ${(s.r2 * 100).toFixed(0)}% ਬਦਲਾਵ ਦੀ ਵਿਆਖਿਆ ਕਰਦਾ ਹੈ\n• **MAE = ${fmt(s.mae)} kg/ha** — ਭਵਿੱਖਬਾਣੀ ਦੀ ਔਸਤ ਗਲਤੀ\n• **RMSE = ${fmt(s.rmse)} kg/ha** — ਬਹੁਤ ਜ਼ਿਆਦਾ/ਘੱਟ ਝਾੜ 'ਤੇ ਵੱਡੀਆਂ ਗਲਤੀਆਂ\n• **95% ਅੰਤਰਾਲ ਕਵਰੇਜ = ${s.coverage95.toFixed(1)}%** — ਅਸਲ ਝਾੜ ਇੰਨੀ ਵਾਰ ਅੰਦਰ ਰਿਹਾ\n• **ਔਸਤ ਅਨਿਸ਼ਚਿਤਤਾ = ${s.meanUnc.toFixed(1)}%**\n\nਜੋਖਮ ਵੰਡ: 🟢 ਘੱਟ ${fmt(s.risk.low)} · 🟡 ਮੱਧਮ ${fmt(s.risk.medium)} · 🔴 ਉੱਚ ${fmt(s.risk.high)} ਭਵਿੱਖਬਾਣੀਆਂ।${best && worst ? `\n\nਸਭ ਤੋਂ ਸਹੀ: **${cropName(best.crop, "pa")} (${best.errPct.toFixed(1)}% ਔਸਤ ਗਲਤੀ)** · ਸਭ ਤੋਂ ਔਖੀ: **${cropName(worst.crop, "pa")} (${worst.errPct.toFixed(1)}%)**` : ""}\n\n💡 ਸੁਝਾਅ: **${tabRel} ਟੈਬ** ਵਿੱਚ ਪੂਰਾ ਕੈਲੀਬ੍ਰੇਸ਼ਨ ਵੇਖੋ, ਜਾਂ ਪੁੱਛੋ *"ਹਾਈ ਰਿਸਕ ਦਾ ਕੀ ਮਤਲਬ ਹੈ?"*`,
      followUps: [
        "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?",
        "ਹਾਈ ਰਿਸਕ ਦਾ ਕੀ ਮਤਲਬ ਹੈ?",
        "ਕਣਕ ਤੇ ਝੋਨੇ ਦੀ ਤੁਲਨਾ",
      ],
    };
  }
  return {
    topic: "model",
    markdown: `### 📊 Model performance (current dataset)\n\n• **R² = ${s.r2.toFixed(2)}** — the model explains ${(s.r2 * 100).toFixed(0)}% of yield variance\n• **MAE = ${fmt(s.mae)} kg/ha** — average prediction miss\n• **RMSE = ${fmt(s.rmse)} kg/ha** — larger errors on extreme yields\n• **95% interval coverage = ${s.coverage95.toFixed(1)}%** — the actual yield fell inside the interval this often\n• **Mean uncertainty = ${s.meanUnc.toFixed(1)}%**\n\nRisk split: 🟢 Low ${fmt(s.risk.low)} · 🟡 Medium ${fmt(s.risk.medium)} · 🔴 High ${fmt(s.risk.high)} predictions.${best && worst ? `\n\nMost accurate: **${cropName(best.crop, "en")} (${best.errPct.toFixed(1)}% avg error)** · Toughest: **${cropName(worst.crop, "en")} (${worst.errPct.toFixed(1)}%)**` : ""}\n\n💡 Tip: see the **${tabRel} tab** for the full calibration picture, or ask *"what is high risk?"*`,
    followUps: [
      "Which district has the highest yield?",
      "What is high risk?",
      "Compare wheat and paddy",
    ],
  };
}

function riskAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const tabPred = t("tab.predictions", lang);
  if (lang === "hi") {
    return {
      topic: "risk",
      markdown: `### 🛡️ भविष्यवाणी की विश्वसनीयता\n\n• **95% अंतराल ${s.coverage95.toFixed(1)}%** समय वास्तविक उपज को कवर करते हैं\n• **औसत अनिश्चितता: ${s.meanUnc.toFixed(1)}%**\n• **जोखिम विभाजन:** 🟢 कम ${fmt(s.risk.low)} · 🟡 मध्यम ${fmt(s.risk.medium)} · 🔴 उच्च ${fmt(s.risk.high)}\n\nउच्च-जोखिम वाली भविष्यवाणियाँ आमतौर पर तब आती हैं जब उपज बहुत असामान्य हो, उस फसल-जिला जोड़ी का डेटा कम हो, या मौसम असामान्य रहा हो।\n\n💡 नियम: उच्च-जोखिम भविष्यवाणी को संख्या नहीं, **सीमा** मानें — **${tabPred} टैब** में Lower/Upper सीमाएँ देखें।`,
      followUps: ["मॉडल कितना सटीक है?", "किस जिले की उपज सबसे ज़्यादा है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "risk",
      markdown: `### 🛡️ ਭਵਿੱਖਬਾਣੀ ਦੀ ਭਰੋਸੇਯੋਗਤਾ\n\n• **95% ਅੰਤਰਾਲ ${s.coverage95.toFixed(1)}%** ਸਮੇਂ ਅਸਲ ਝਾੜ ਨੂੰ ਢੱਕਦੇ ਹਨ\n• **ਔਸਤ ਅਨਿਸ਼ਚਿਤਤਾ: ${s.meanUnc.toFixed(1)}%**\n• **ਜੋਖਮ ਵੰਡ:** 🟢 ਘੱਟ ${fmt(s.risk.low)} · 🟡 ਮੱਧਮ ${fmt(s.risk.medium)} · 🔴 ਉੱਚ ${fmt(s.risk.high)}\n\nਉੱਚ-ਜੋਖਮ ਭਵਿੱਖਬਾਣੀਆਂ ਆਮ ਤੌਰ 'ਤੇ ਉਦੋਂ ਆਉਂਦੀਆਂ ਹਨ ਜਦੋਂ ਝਾੜ ਬਹੁਤ ਅਸਧਾਰਨ ਹੋਵੇ, ਉਸ ਫ਼ਸਲ-ਜ਼ਿਲ੍ਹਾ ਜੋੜੀ ਦਾ ਡੇਟਾ ਘੱਟ ਹੋਵੇ, ਜਾਂ ਮੌਸਮ ਅਸਧਾਰਨ ਹੋਵੇ।\n\n💡 ਨਿਯਮ: ਉੱਚ-ਜੋਖਮ ਭਵਿੱਖਬਾਣੀ ਨੂੰ ਸੰਖਿਆ ਨਹੀਂ, **ਸੀਮਾ** ਸਮਝੋ — **${tabPred} ਟੈਬ** ਵਿੱਚ Lower/Upper ਸੀਮਾਵਾਂ ਵੇਖੋ।`,
      followUps: ["ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"],
    };
  }
  return {
    topic: "risk",
    markdown: `### 🛡️ Prediction reliability\n\n• **95% intervals cover the actual yield ${s.coverage95.toFixed(1)}%** of the time\n• **Mean uncertainty: ${s.meanUnc.toFixed(1)}%**\n• **Risk split:** 🟢 Low ${fmt(s.risk.low)} · 🟡 Medium ${fmt(s.risk.medium)} · 🔴 High ${fmt(s.risk.high)}\n\nHigh-risk predictions usually appear when a yield is unusual, the crop–district pair has sparse data, or the weather was off-pattern.\n\n💡 Rule of thumb: treat a High-risk prediction as a **range**, not a number — check the Lower/Upper bounds in the **${tabPred} tab**.`,
    followUps: ["How accurate is the model?", "Which district has the highest yield?"],
  };
}

function topCropsAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const top3 = s.topCrops.slice(0, 3);
  const list = top3
    .map((c, i) => `${i + 1}. **${cropName(c.crop, lang)}** — ${fmt(c.avg)} kg/ha (${fmt(c.n)} ${lang === "hi" ? "नमूने" : lang === "pa" ? "ਨਮੂਨੇ" : "samples"})`)
    .join("\n");
  const tabFit = t("tab.suitability", lang);
  if (lang === "hi") {
    return {
      topic: "topCrops",
      markdown: `### 🏆 डेटासेट में सबसे ज़्यादा उपज वाली फसलें\n\n${list}\n\nगन्ना अनाजों से आगे निकलता है क्योंकि उसे पूरे साल की वृद्धि में मापा जाता है — **अनाज फसलों** में गेहूं और धान पंजाब के लीडर हैं।\n\n🌱 अपने खेत के लिए सिफ़ारिश चाहिए? **${tabFit} टैब** खोलें — मिट्टी का pH, नमी और वर्षा डालें, और अपनी स्थिति के लिए सभी ${s.crops.length} फसलों की रैंकिंग देखें।`,
      followUps: ["गेहूं और धान की तुलना करें", "किस जिले की उपज सबसे ज़्यादा है?", "गेहूं का रुझान कैसा है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "topCrops",
      markdown: `### 🏆 ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਝਾੜ ਵਾਲੀਆਂ ਫ਼ਸਲਾਂ\n\n${list}\n\nਗੰਨਾ ਅਨਾਜਾਂ ਤੋਂ ਅੱਗੇ ਨਿਕਲ ਜਾਂਦਾ ਹੈ ਕਿਉਂਕਿ ਉਸਨੂੰ ਸਾਲ ਭਰ ਦੀ ਵਾਧੇ 'ਚ ਮਾਪਿਆ ਜਾਂਦਾ ਹੈ — **ਅਨਾਜ ਫ਼ਸਲਾਂ** ਵਿੱਚ ਕਣਕ ਤੇ ਝੋਨਾ ਪੰਜਾਬ ਦੇ ਲੀਡਰ ਹਨ।\n\n🌱 ਆਪਣੇ ਖੇਤ ਲਈ ਸਿਫ਼ਾਰਸ਼ ਚਾਹੀਦੀ? **${tabFit} ਟੈਬ** ਖੋਲ੍ਹੋ — ਮਿੱਟੀ ਦਾ pH, ਨਮੀ ਤੇ ਮੀਂਹ ਭਰੋ, ਤੇ ਆਪਣੀ ਹਾਲਤ ਲਈ ਸਾਰੀਆਂ ${s.crops.length} ਫ਼ਸਲਾਂ ਦੀ ਰੈਂਕਿੰਗ ਵੇਖੋ।`,
      followUps: ["ਕਣਕ ਤੇ ਝੋਨੇ ਦੀ ਤੁਲਨਾ", "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "ਕਣਕ ਦਾ ਰੁਝਾਨ ਕਿਵੇਂ ਹੈ?"],
    };
  }
  return {
    topic: "topCrops",
    markdown: `### 🏆 Highest-yielding crops in the dataset\n\n${list}\n\nSugarcane towers over the grains because it's measured over a full year of growth — among **grain crops**, wheat and paddy lead Punjab.\n\n🌱 Want a recommendation for *your* field? Open the **${tabFit} tab**, enter your soil pH, moisture and rainfall, and it ranks all ${s.crops.length} crops for your exact conditions.`,
    followUps: ["Compare wheat and paddy", "Which district has the highest yield?", "How is the wheat trend?"],
  };
}

function topDistrictsAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const top3 = s.topDistricts.slice(0, 3);
  const bottom = s.topDistricts[s.topDistricts.length - 1];
  const list = top3
    .map((d, i) => `${i + 1}. **${d.district}** — ${fmt(d.avg)} kg/ha (${fmt(d.n)} ${lang === "hi" ? "नमूने" : lang === "pa" ? "ਨਮੂਨੇ" : "samples"})`)
    .join("\n");
  const tabDist = t("tab.districts", lang);
  if (lang === "hi") {
    return {
      topic: "topDistricts",
      markdown: `### 🗺️ सबसे ज़्यादा औसत उपज वाले जिले\n\n${list}\n\nसबसे नीचे: **${bottom.district}** (${fmt(bottom.avg)} kg/ha) — यह अक्सर फसल मिश्रण (जैसे कम उपज वाली दलहन) के कारण होता है, बुरी खेती के नहीं।\n\n📊 प्रत्येक जिले की पूरी प्रोफ़ाइल **${tabDist} टैब** में देखें, या पूछें *"लुधियाना के लिए सबसे अच्छी फसल?"*`,
      followUps: ["लुधियाना के लिए सबसे अच्छी फसल?", "मॉडल कितना सटीक है?", "बठिंडा की प्रोफ़ाइल दिखाओ"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "topDistricts",
      markdown: `### 🗺️ ਸਭ ਤੋਂ ਵੱਧ ਔਸਤ ਝਾੜ ਵਾਲੇ ਜ਼ਿਲ੍ਹੇ\n\n${list}\n\nਸਭ ਤੋਂ ਹੇਠਾਂ: **${bottom.district}** (${fmt(bottom.avg)} kg/ha) — ਅਕਸਰ ਇਹ ਫ਼ਸਲ ਮਿਸ਼ਰਣ (ਘੱਟ ਝਾੜ ਵਾਲੀਆਂ ਦਾਲਾਂ ਵਗੈਰਾ) ਕਰਕੇ ਹੁੰਦਾ ਹੈ, ਮਾੜੀ ਖੇਤੀ ਕਰਕੇ ਨਹੀਂ।\n\n📊 ਹਰ ਜ਼ਿਲ੍ਹੇ ਦੀ ਪੂਰੀ ਪ੍ਰੋਫ਼ਾਈਲ **${tabDist} ਟੈਬ** ਵਿੱਚ ਵੇਖੋ, ਜਾਂ ਪੁੱਛੋ *"ਲੁਧਿਆਣਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?"*`,
      followUps: ["ਲੁਧਿਆਣਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਬਠਿੰਡਾ ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ ਦਿਖਾਓ"],
    };
  }
  return {
    topic: "topDistricts",
    markdown: `### 🗺️ Districts with the highest average yield\n\n${list}\n\nAt the bottom: **${bottom.district}** (${fmt(bottom.avg)} kg/ha) — often a mix effect (e.g. more low-yield pulses), not necessarily weaker farming.\n\n📊 Full profiles live in the **${tabDist} tab**, or ask *"best crops for Ludhiana?"*`,
    followUps: ["Best crop for Ludhiana?", "How accurate is the model?", "Show me Bathinda"],
  };
}

function cropAnswer(crop: string, s: DatasetStats, lang: Lang): ChatReply {
  const cs = s.cropStats.get(crop)!;
  const name = cropName(crop, lang);
  const top3 = cs.topDistricts
    .map((d) => `${d.district} (${fmt(d.avg)})`)
    .join(lang === "en" ? ", " : ", ");
  const tabCrops = t("tab.crops", lang);
  const trendLine =
    cs.byYear.length >= 2
      ? (lang === "hi"
          ? `• **रुझान: ${sign(cs.trend)}** (${cs.byYear[0].year} → ${cs.byYear[cs.byYear.length - 1].year})`
          : lang === "pa"
          ? `• **ਰੁਝਾਨ: ${sign(cs.trend)}** (${cs.byYear[0].year} → ${cs.byYear[cs.byYear.length - 1].year})`
          : `• **Trend: ${sign(cs.trend)}** (${cs.byYear[0].year} → ${cs.byYear[cs.byYear.length - 1].year})`)
      : "";
  if (lang === "hi") {
    return {
      topic: "crop",
      markdown: `### 🌾 ${name}\n\n**डेटासेट क्या कहता है:**\n• **औसत उपज: ${fmt(cs.avg)} kg/ha** (${fmt(cs.n)} नमूने, ${s.years[0]}–${s.years[s.years.length - 1]})\n• **मौसम: ${cs.seasons.join(" · ")}** · ${cs.districts.length} जिलों में उगाई जाती है\n${trendLine}\n• **अग्रणी जिले:** ${top3}\n${cs.mae > 0 ? `• **इस फसल के लिए मॉडल त्रुटि: ${fmt(cs.mae)} kg/ha (MAE)**` : ""}\n\n📊 साल-दर-साल चार्ट **${tabCrops} टैब** में देखें, या पूछें *"गेहूं और धान की तुलना करें"*।`,
      followUps: [
        `${name} लुधियाना में कैसी है?`,
        "किस जिले की उपज सबसे ज़्यादा है?",
        "मॉडल कितना सटीक है?",
      ],
    };
  }
  if (lang === "pa") {
    return {
      topic: "crop",
      markdown: `### 🌾 ${name}\n\n**ਡੇਟਾਸੈੱਟ ਕੀ ਦੱਸਦਾ ਹੈ:**\n• **ਔਸਤ ਝਾੜ: ${fmt(cs.avg)} kg/ha** (${fmt(cs.n)} ਨਮੂਨੇ, ${s.years[0]}–${s.years[s.years.length - 1]})\n• **ਰੁੱਤ: ${cs.seasons.join(" · ")}** · ${cs.districts.length} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਉਗਾਈ ਜਾਂਦੀ ਹੈ\n${trendLine}\n• **ਅਗਵਾਨ ਜ਼ਿਲ੍ਹੇ:** ${top3}\n${cs.mae > 0 ? `• **ਇਸ ਫ਼ਸਲ ਲਈ ਮਾਡਲ ਗਲਤੀ: ${fmt(cs.mae)} kg/ha (MAE)**` : ""}\n\n📊 ਸਾਲ-ਦਰ-ਸਾਲ ਚਾਰਟ **${tabCrops} ਟੈਬ** ਵਿੱਚ ਵੇਖੋ, ਜਾਂ ਪੁੱਛੋ *"ਕਣਕ ਤੇ ਝੋਨੇ ਦੀ ਤੁਲਨਾ"*।`,
      followUps: [
        `${name} ਲੁਧਿਆਣਾ ਵਿੱਚ ਕਿਵੇਂ ਹੈ?`,
        "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?",
        "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?",
      ],
    };
  }
  return {
    topic: "crop",
    markdown: `### 🌾 ${name}\n\n**What the dataset shows:**\n• **Average yield: ${fmt(cs.avg)} kg/ha** (${fmt(cs.n)} samples, ${s.years[0]}–${s.years[s.years.length - 1]})\n• **Season: ${cs.seasons.join(" · ")}** · grown in ${cs.districts.length} districts\n${trendLine}\n• **Leading districts:** ${top3}\n${cs.mae > 0 ? `• **Model error for this crop: MAE ${fmt(cs.mae)} kg/ha**` : ""}\n\n📊 Year-wise charts in the **${tabCrops} tab**, or ask *"compare wheat and paddy"*.`,
    followUps: [
      `${name} in Ludhiana?`,
      "Which district has the highest yield?",
      "How accurate is the model?",
    ],
  };
}

function bestForDistrictAnswer(district: string, s: DatasetStats, lang: Lang): ChatReply {
  const ds = s.districtStats.get(district)!;
  const top3 = ds.topCrops
    .map((c) => `${c.crop} (${fmt(c.avg)})`)
    .join(lang === "en" ? ", " : ", ");
  const above = ds.avg - s.avgYield;
  if (lang === "hi") {
    return {
      topic: "bestForDistrict",
      markdown: `### 🌾 **${district}** के लिए सबसे अच्छी फसलें (औसत उपज के अनुसार)\n\n1. **${ds.topCrops[0]?.crop ?? "—"}** — ${fmt(ds.topCrops[0]?.avg ?? 0)} kg/ha\n2. **${ds.topCrops[1]?.crop ?? "—"}** — ${fmt(ds.topCrops[1]?.avg ?? 0)} kg/ha\n3. **${ds.topCrops[2]?.crop ?? "—"}** — ${fmt(ds.topCrops[2]?.avg ?? 0)} kg/ha\n\n${district} का समग्र औसत **${fmt(ds.avg)} kg/ha** है (${fmt(ds.n)} नमूने) — राज्य औसत से ${above >= 0 ? "ऊपर" : "नीचे"} ${fmt(Math.abs(above))} kg/ha।\n\nडेटासेट में ${district} की मुख्य फसलें: ${top3}। पूरी प्रोफ़ाइल **${t("tab.districts", lang)} टैब** में।`,
      followUps: [`${ds.topCrops[0]?.crop ?? "Wheat"} की प्रोफ़ाइल`, "किस जिले की उपज सबसे ज़्यादा है?", "मॉडल कितना सटीक है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "bestForDistrict",
      markdown: `### 🌾 **${district}** ਲਈ ਵਧੀਆ ਫ਼ਸਲਾਂ (ਔਸਤ ਝਾੜ ਮੁਤਾਬਕ)\n\n1. **${ds.topCrops[0]?.crop ?? "—"}** — ${fmt(ds.topCrops[0]?.avg ?? 0)} kg/ha\n2. **${ds.topCrops[1]?.crop ?? "—"}** — ${fmt(ds.topCrops[1]?.avg ?? 0)} kg/ha\n3. **${ds.topCrops[2]?.crop ?? "—"}** — ${fmt(ds.topCrops[2]?.avg ?? 0)} kg/ha\n\n${district} ਦਾ ਕੁੱਲ ਔਸਤ **${fmt(ds.avg)} kg/ha** ਹੈ (${fmt(ds.n)} ਨਮੂਨੇ) — ਸੂਬੇ ਦੇ ਔਸਤ ਤੋਂ ${above >= 0 ? "ਉੱਪਰ" : "ਹੇਠਾਂ"} ${fmt(Math.abs(above))} kg/ha।\n\nਡੇਟਾਸੈੱਟ ਵਿੱਚ ${district} ਦੀਆਂ ਮੁੱਖ ਫ਼ਸਲਾਂ: ${top3}। ਪੂਰੀ ਪ੍ਰੋਫ਼ਾਈਲ **${t("tab.districts", lang)} ਟੈਬ** ਵਿੱਚ।`,
      followUps: [`${ds.topCrops[0]?.crop ?? "Wheat"} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"],
    };
  }
  return {
    topic: "bestForDistrict",
    markdown: `### 🌾 Best crops for **${district}** (by average yield)\n\n1. **${ds.topCrops[0]?.crop ?? "—"}** — ${fmt(ds.topCrops[0]?.avg ?? 0)} kg/ha\n2. **${ds.topCrops[1]?.crop ?? "—"}** — ${fmt(ds.topCrops[1]?.avg ?? 0)} kg/ha\n3. **${ds.topCrops[2]?.crop ?? "—"}** — ${fmt(ds.topCrops[2]?.avg ?? 0)} kg/ha\n\n${district}'s overall average is **${fmt(ds.avg)} kg/ha** (${fmt(ds.n)} samples) — ${above >= 0 ? "above" : "below"} the state average by ${fmt(Math.abs(above))} kg/ha.\n\nIn the dataset, ${district}'s main crops are: ${top3}. Full profile in the **${t("tab.districts", lang)} tab**.`,
    followUps: [`Profile of ${ds.topCrops[0]?.crop ?? "Wheat"}`, "Which district has the highest yield?", "How accurate is the model?"],
  };
}

function districtAnswer(district: string, s: DatasetStats, lang: Lang): ChatReply {
  const ds = s.districtStats.get(district)!;
  const region = REGION_OF[district];
  const note = region ? REGION_NOTE[region][lang] : "";
  const regionLabel = region ? REGION_LOCAL[region][lang] : "";
  const best = ds.bestYear;
  const top3 = ds.topCrops.map((c) => c.crop).join(lang === "en" ? ", " : ", ");
  if (lang === "hi") {
    return {
      topic: "district",
      markdown: `### 🗺️ **${district}** जिला प्रोफ़ाइल${regionLabel ? ` · ${regionLabel} क्षेत्र` : ""}\n\n• **औसत उपज: ${fmt(ds.avg)} kg/ha** (राज्य औसत ${fmt(s.avgYield)}) — ${fmt(ds.n)} नमूने\n• **फसलें: ${ds.crops.length}** — मुख्य: ${top3}\n${best ? `• **सबसे अच्छा वर्ष: ${best.year}** (${fmt(best.avg)} kg/ha)` : ""}\n\n${note}\n\n📊 विवरण **${t("tab.districts", lang)} टैब** में; NDVI मानचित्र **${t("tab.maps", lang)}** में।`,
      followUps: [`${district} के लिए सबसे अच्छी फसल?`, "किस जिले की उपज सबसे ज़्यादा है?", "NDVI का मतलब क्या है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "district",
      markdown: `### 🗺️ **${district}** ਜ਼ਿਲ੍ਹਾ ਪ੍ਰੋਫ਼ਾਈਲ${regionLabel ? ` · ${regionLabel} ਖੇਤਰ` : ""}\n\n• **ਔਸਤ ਝਾੜ: ${fmt(ds.avg)} kg/ha** (ਸੂਬਾ ਔਸਤ ${fmt(s.avgYield)}) — ${fmt(ds.n)} ਨਮੂਨੇ\n• **ਫ਼ਸਲਾਂ: ${ds.crops.length}** — ਮੁੱਖ: ${top3}\n${best ? `• **ਸਭ ਤੋਂ ਵਧੀਆ ਸਾਲ: ${best.year}** (${fmt(best.avg)} kg/ha)` : ""}\n\n${note}\n\n📊 ਵੇਰਵੇ **${t("tab.districts", lang)} ਟੈਬ** ਵਿੱਚ; NDVI ਨਕਸ਼ਾ **${t("tab.maps", lang)}** ਵਿੱਚ।`,
      followUps: [`${district} ਲਈ ਵਧੀਆ ਫ਼ਸਲ?`, "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "NDVI ਦਾ ਕੀ ਮਤਲਬ ਹੈ?"],
    };
  }
  return {
    topic: "district",
    markdown: `### 🗺️ **${district}** district profile${regionLabel ? ` · ${regionLabel} region` : ""}\n\n• **Average yield: ${fmt(ds.avg)} kg/ha** (state avg ${fmt(s.avgYield)}) — ${fmt(ds.n)} samples\n• **Crops grown: ${ds.crops.length}** — top: ${top3}\n${best ? `• **Best year: ${best.year}** (${fmt(best.avg)} kg/ha)` : ""}\n\n${note}\n\n📊 Details in the **${t("tab.districts", lang)} tab**; NDVI map in **${t("tab.maps", lang)}**.`,
    followUps: [`Best crops for ${district}?`, "Which district has the highest yield?", "What does NDVI mean?"],
  };
}

function cropInDistrictAnswer(crop: string, district: string, ctx: ChatContext, s: DatasetStats, lang: Lang): ChatReply {
  const cs = s.cropStats.get(crop)!;
  const rows = ctx.samples.filter((x) => x.Crop === crop && x.District === district);
  const name = cropName(crop, lang);
  if (rows.length === 0) {
    const ds = s.districtStats.get(district)!;
    const grows = ds.topCrops.map((c) => cropName(c.crop, lang)).join(lang === "en" ? ", " : ", ");
    if (lang === "hi") return { topic: "cropInDistrict", markdown: `🤔 **${name}** के लिए **${district}** में कोई रिकॉर्ड डेटासेट में नहीं है।\n\n${district} में जो उगाई जाती है: ${grows}। या पूछें "सभी जिलों में ${name}?"`, followUps: [`${district} के लिए सबसे अच्छी फसल?`, "किस जिले की उपज सबसे ज़्यादा है?"] };
    if (lang === "pa") return { topic: "cropInDistrict", markdown: `🤔 **${name}** ਲਈ **${district}** ਵਿੱਚ ਕੋਈ ਰਿਕਾਰਡ ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਨਹੀਂ ਹੈ।\n\n${district} ਵਿੱਚ ਜੋ ਉਗਾਈ ਜਾਂਦੀ ਹੈ: ${grows}। ਜਾਂ ਪੁੱਛੋ "ਸਾਰੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ${name}?"`, followUps: [`${district} ਲਈ ਵਧੀਆ ਫ਼ਸਲ?`, "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"] };
    return { topic: "cropInDistrict", markdown: `🤔 There's no record of **${name}** in **${district}** in the current dataset.\n\nWhat ${district} does grow: ${grows}. Or ask "which district has the highest yield?"`, followUps: [`Best crops for ${district}?`, "Which district has the highest yield?"] };
  }
  const localAvg = Math.round(mean(rows.map((r) => r.Yield_kg_ha)));
  const diff = ((localAvg - cs.avg) / Math.max(1, cs.avg)) * 100;
  const preds = ctx.predictions.filter((p) => p.Crop === crop && p.District === district);
  const pairMae = preds.length ? Math.round(mean(preds.map((p) => Math.abs(p.Predicted_Yield - p.Actual_Yield)))) : 0;
  const cmp = diff >= 0
    ? (lang === "hi" ? `**${sign(diff)} बेहतर**` : lang === "pa" ? `**${sign(diff)} ਵਧੀਆ**` : `**${sign(diff)} better**`)
    : (lang === "hi" ? `**${sign(diff)} कम**` : lang === "pa" ? `**${sign(diff)} ਘੱਟ**` : `**${sign(diff)} lower**`);
  if (lang === "hi") {
    return {
      topic: "cropInDistrict",
      markdown: `### 🌾 ${name} — ${district} में\n\n• **यहाँ औसत उपज: ${fmt(localAvg)} kg/ha** बनाम राज्यव्यापी ${fmt(cs.avg)} kg/ha → ${cmp}\n• **${fmt(rows.length)} नमूने** (${s.years[0]}–${s.years[s.years.length - 1]})${pairMae > 0 ? `\n• इस जोड़ी के लिए मॉडल त्रुटि: **MAE ${fmt(pairMae)} kg/ha**` : ""}\n\nअन्य जिलों से तुलना **${t("tab.districts", lang)} टैब** में करें।`,
      followUps: [`${district} के लिए सबसे अच्छी फसल?`, `${name} की प्रोफ़ाइल`, "मॉडल कितना सटीक है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "cropInDistrict",
      markdown: `### 🌾 ${name} — ${district} ਵਿੱਚ\n\n• **ਇੱਥੇ ਔਸਤ ਝਾੜ: ${fmt(localAvg)} kg/ha** ਬਨਾਮ ਸੂਬੇ ਭਰ ਵਿੱਚ ${fmt(cs.avg)} kg/ha → ${cmp}\n• **${fmt(rows.length)} ਨਮੂਨੇ** (${s.years[0]}–${s.years[s.years.length - 1]})${pairMae > 0 ? `\n• ਇਸ ਜੋੜੀ ਲਈ ਮਾਡਲ ਗਲਤੀ: **MAE ${fmt(pairMae)} kg/ha**` : ""}\n\nਹੋਰ ਜ਼ਿਲ੍ਹਿਆਂ ਨਾਲ ਤੁਲਨਾ **${t("tab.districts", lang)} ਟੈਬ** ਵਿੱਚ ਕਰੋ।`,
      followUps: [`${district} ਲਈ ਵਧੀਆ ਫ਼ਸਲ?`, `${name} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"],
    };
  }
  return {
    topic: "cropInDistrict",
    markdown: `### 🌾 ${name} in ${district}\n\n• **Average yield here: ${fmt(localAvg)} kg/ha** vs ${fmt(cs.avg)} kg/ha state-wide → ${cmp}\n• **${fmt(rows.length)} samples** (${s.years[0]}–${s.years[s.years.length - 1]})${pairMae > 0 ? `\n• Model error for this pair: **MAE ${fmt(pairMae)} kg/ha**` : ""}\n\nCompare with other districts in the **${t("tab.districts", lang)} tab**.`,
    followUps: [`Best crops for ${district}?`, `Profile of ${name}`, "How accurate is the model?"],
  };
}

function compareAnswer(a: string, b: string, s: DatasetStats, lang: Lang, kind: "crop" | "district"): ChatReply {
  if (kind === "crop") {
    const ca = s.cropStats.get(a)!;
    const cb = s.cropStats.get(b)!;
    const na = cropName(a, lang);
    const nb = cropName(b, lang);
    const winner = ca.avg >= cb.avg ? na : nb;
    const row = (label: string, x: string, y: string) => `• **${label}:** ${x} · ${y}`;
    if (lang === "hi") {
      return {
        topic: "compare",
        markdown: `### ⚖️ ${na} बनाम ${nb}\n\n${row("औसत उपज", `${na} ${fmt(ca.avg)} kg/ha`, `${nb} ${fmt(cb.avg)} kg/ha`)}\n${row("मौसम", ca.seasons.join("/"), cb.seasons.join("/"))}\n${row("अग्रणी जिला", ca.topDistricts[0] ? `${ca.topDistricts[0].district} (${fmt(ca.topDistricts[0].avg)})` : "—", cb.topDistricts[0] ? `${cb.topDistricts[0].district} (${fmt(cb.topDistricts[0].avg)})` : "—")}\n${row("मॉडल MAE", ca.mae ? fmt(ca.mae) : "—", cb.mae ? fmt(cb.mae) : "—")}\n\nउच्च औसत उपज: **${winner}** 🏅\n\n⚖️ दृश्य तुलना **${t("tab.compare", lang)} टैब** में करें।`,
        followUps: [`${na} की प्रोफ़ाइल`, `${nb} की प्रोफ़ाइल`, "किस जिले की उपज सबसे ज़्यादा है?"],
      };
    }
    if (lang === "pa") {
      return {
        topic: "compare",
        markdown: `### ⚖️ ${na} ਬਨਾਮ ${nb}\n\n${row("ਔਸਤ ਝਾੜ", `${na} ${fmt(ca.avg)} kg/ha`, `${nb} ${fmt(cb.avg)} kg/ha`)}\n${row("ਰੁੱਤ", ca.seasons.join("/"), cb.seasons.join("/"))}\n${row("ਅਗਵਾਨ ਜ਼ਿਲ੍ਹਾ", ca.topDistricts[0] ? `${ca.topDistricts[0].district} (${fmt(ca.topDistricts[0].avg)})` : "—", cb.topDistricts[0] ? `${cb.topDistricts[0].district} (${fmt(cb.topDistricts[0].avg)})` : "—")}\n${row("ਮਾਡਲ MAE", ca.mae ? fmt(ca.mae) : "—", cb.mae ? fmt(cb.mae) : "—")}\n\nਵੱਧ ਔਸਤ ਝਾੜ: **${winner}** 🏅\n\n⚖️ ਦ੍ਰਿਸ਼ਟੀ ਤੁਲਨਾ **${t("tab.compare", lang)} ਟੈਬ** ਵਿੱਚ ਕਰੋ।`,
        followUps: [`${na} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, `${nb} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"],
      };
    }
    return {
      topic: "compare",
      markdown: `### ⚖️ ${na} vs ${nb}\n\n${row("Avg yield", `${na} ${fmt(ca.avg)} kg/ha`, `${nb} ${fmt(cb.avg)} kg/ha`)}\n${row("Season", ca.seasons.join("/"), cb.seasons.join("/"))}\n${row("Top district", ca.topDistricts[0] ? `${ca.topDistricts[0].district} (${fmt(ca.topDistricts[0].avg)})` : "—", cb.topDistricts[0] ? `${cb.topDistricts[0].district} (${fmt(cb.topDistricts[0].avg)})` : "—")}\n${row("Model MAE", ca.mae ? fmt(ca.mae) : "—", cb.mae ? fmt(cb.mae) : "—")}\n\nHigher average yield: **${winner}** 🏅\n\n⚖️ Visual side-by-side lives in the **${t("tab.compare", lang)} tab**.`,
      followUps: [`Profile of ${na}`, `Profile of ${nb}`, "Which district has the highest yield?"],
    };
  }
  const da = s.districtStats.get(a)!;
  const db = s.districtStats.get(b)!;
  const winner = da.avg >= db.avg ? a : b;
  const row = (label: string, x: string, y: string) => `• **${label}:** ${x} · ${y}`;
  if (lang === "hi") {
    return {
      topic: "compare",
      markdown: `### ⚖️ ${a} बनाम ${b}\n\n${row("औसत उपज", `${a} ${fmt(da.avg)} kg/ha`, `${b} ${fmt(db.avg)} kg/ha`)}\n${row("नमूने", fmt(da.n), fmt(db.n))}\n${row("मुख्य फसलें", da.topCrops.map((c) => c.crop).slice(0, 2).join(", "), db.topCrops.map((c) => c.crop).slice(0, 2).join(", "))}\n\nउच्च औसत उपज: **${winner}** 🏅`,
      followUps: [`${a} की प्रोफ़ाइल`, `${b} की प्रोफ़ाइल`, "किस जिले की उपज सबसे ज़्यादा है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "compare",
      markdown: `### ⚖️ ${a} ਬਨਾਮ ${b}\n\n${row("ਔਸਤ ਝਾੜ", `${a} ${fmt(da.avg)} kg/ha`, `${b} ${fmt(db.avg)} kg/ha`)}\n${row("ਨਮੂਨੇ", fmt(da.n), fmt(db.n))}\n${row("ਮੁੱਖ ਫ਼ਸਲਾਂ", da.topCrops.map((c) => c.crop).slice(0, 2).join(", "), db.topCrops.map((c) => c.crop).slice(0, 2).join(", "))}\n\nਵੱਧ ਔਸਤ ਝਾੜ: **${winner}** 🏅`,
      followUps: [`${a} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, `${b} ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ`, "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"],
    };
  }
  return {
    topic: "compare",
    markdown: `### ⚖️ ${a} vs ${b}\n\n${row("Avg yield", `${a} ${fmt(da.avg)} kg/ha`, `${b} ${fmt(db.avg)} kg/ha`)}\n${row("Samples", fmt(da.n), fmt(db.n))}\n${row("Main crops", da.topCrops.map((c) => c.crop).slice(0, 2).join(", "), db.topCrops.map((c) => c.crop).slice(0, 2).join(", "))}\n\nHigher average yield: **${winner}** 🏅`,
    followUps: [`Profile of ${a}`, `Profile of ${b}`, "Which district has the highest yield?"],
  };
}

function soilAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const tabMaps = t("tab.maps", lang);
  const tabFit = t("tab.suitability", lang);
  if (lang === "hi") {
    return {
      topic: "soil",
      markdown: `### 🌍 पंजाब की खेती के लिए मिट्टी स्वास्थ्य\n\n**डेटासेट क्या दिखाता है:**\n• औसत मिट्टी की नमी: **${s.avgSoilMoisture}** (आयतनिक)\n• औसत NDWI: **${s.avgNdwi}** — हल्का सकारात्मक = ठीक-ठाक पानी\n• औसत वर्षा: मौसम दर मौसम ${s.seasonAvg.map((se) => `${se.season} ${fmt(se.rain)} mm`).join(" · ")}\n\n**अच्छी प्रथाएँ (पंजाब):**\n• हर 2–3 साल में मिट्टी जाँचें; pH 6.0–7.5 रखें\n• गेहूं: N 120 · P 60 · K 30 kg/ha · धान: 80-40-30\n• गर्मियों की खाली ज़मीन पर हरी खाद (ढेंचा/बरसीं या मूंग) डालें\n• धान के बाद ज़ीरो-टिल गेहूं — नमी और डीज़ल बचत\n\n📡 जिलों की नमी **${tabMaps} टैब** (NDWI मोड) में देखें; अपनी रीडिंग डालकर फसल रैंकिंग **${tabFit}** में पाएँ।`,
      followUps: ["मौसम का पैटर्न कैसा है?", "NDVI कैसे पढ़ें?", "लुधियाना के लिए सबसे अच्छी फसल?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "soil",
      markdown: `### 🌍 ਪੰਜਾਬ ਦੀ ਖੇਤੀ ਲਈ ਮਿੱਟੀ ਦੀ ਸਿਹਤ\n\n**ਡੇਟਾਸੈੱਟ ਕੀ ਦੱਸਦਾ ਹੈ:**\n• ਔਸਤ ਮਿੱਟੀ ਦੀ ਨਮੀ: **${s.avgSoilMoisture}** (ਵੋਲਿਊਮੈਟਰਿਕ)\n• ਔਸਤ NDWI: **${s.avgNdwi}** — ਹਲਕਾ ਪਾਜ਼ੇਟਿਵ = ਠੀਕ-ਠਾਕ ਪਾਣੀ\n• ਔਸਤ ਮੀਂਹ: ਰੁੱਤ ਮੁਤਾਬਕ ${s.seasonAvg.map((se) => `${se.season} ${fmt(se.rain)} mm`).join(" · ")}\n\n**ਚੰਗੀਆਂ ਅਭਿਆਸਾਂ (ਪੰਜਾਬ):**\n• ਹਰ 2–3 ਸਾਲ ਮਿੱਟੀ ਜਾਂਚੋ; pH 6.0–7.5 ਰੱਖੋ\n• ਕਣਕ: N 120 · P 60 · K 30 kg/ha · ਝੋਨਾ: 80-40-30\n• ਗਰਮੀਆਂ ਦੀ ਖਾਲੀ ਜ਼ਮੀਨ 'ਤੇ ਹਰੀ ਖਾਦ (ਧਾਂਚਾ/ਬਰਸੀਂ ਜਾਂ ਮੂੰਗ) ਪਾਓ\n• ਝੋਨੇ ਪਿੱਛੇ ਜ਼ੀਰੋ-ਟਿਲ ਕਣਕ — ਨਮੀ ਤੇ ਡੀਜ਼ਲ ਬਚਤ\n\n📡 ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਨਮੀ **${tabMaps} ਟੈਬ** (NDWI ਮੋਡ) ਵਿੱਚ ਵੇਖੋ; ਆਪਣੀ ਰੀਡਿੰਗ ਪਾ ਕੇ ਫ਼ਸਲ ਰੈਂਕਿੰਗ **${tabFit}** ਵਿੱਚ ਲਵੋ।`,
      followUps: ["ਮੌਸਮ ਦਾ ਪੈਟਰਨ ਕਿਵੇਂ ਹੈ?", "NDVI ਕਿਵੇਂ ਪੜ੍ਹਨਾ ਹੈ?", "ਲੁਧਿਆਣਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?"],
    };
  }
  return {
    topic: "soil",
    markdown: `### 🌍 Soil health for Punjab farming\n\n**What the dataset shows:**\n• Average soil moisture: **${s.avgSoilMoisture}** volumetric\n• Average NDWI: **${s.avgNdwi}** — mildly positive = decent water content\n• Average rainfall by season: ${s.seasonAvg.map((se) => `${se.season} ${fmt(se.rain)} mm`).join(" · ")}\n\n**Good practice (Punjab):**\n• Test soil every 2–3 years; keep pH 6.0–7.5\n• Wheat: N 120 · P 60 · K 30 kg/ha · Paddy: 80-40-30\n• Green-manure the summer fallow (dhaincha/berseem or moong)\n• Zero-till wheat after paddy — saves moisture and diesel\n\n📡 Watch district moisture in the **${tabMaps} tab** (NDWI mode); rank crops for your own readings in **${tabFit}**.`,
    followUps: ["What's the weather pattern?", "How do I read NDVI?", "Best crop for Ludhiana?"],
  };
}

function weatherAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const tabEnv = t("tab.environment", lang);
  const seasons = s.seasonAvg
    .map((se) => `• **${se.season}:** ${fmt(se.rain)} mm · ${se.temp}°C · NDVI ${se.ndvi} · avg yield ${fmt(se.avg)} kg/ha`)
    .join("\n");
  if (lang === "hi") {
    return {
      topic: "weather",
      markdown: `### 🌦️ डेटासेट में मौसम पैटर्न (${s.years[0]}–${s.years[s.years.length - 1]})\n\n${seasons}\n\n**इसका मतलब:**\n• खरीफ फसलें (धान, कपास) मानसून पर चलती हैं — लेकिन वर्षा ~1,200 mm पार करते ही उपज गिरती है (जलभराव)\n• रबी (गेहूं, सरसों) को सिंचाई चाहिए — मार्च की झुलसी गर्मी उपज काट सकती है\n• मॉडल वर्षा + तापमान को भार देता है — साल-दर-साल रुझान **${tabEnv} टैब** में\n\n🌱 सुझाव: खरीफ में ज़्यादा वर्षा वाले सालों में जल-निकासी की योजना पहले बनाएँ।`,
      followUps: ["मिट्टी की सिफ़ारिशें", "मॉडल कितना सटीक है?", "किस जिले की उपज सबसे ज़्यादा है?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "weather",
      markdown: `### 🌦️ ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਮੌਸਮ ਪੈਟਰਨ (${s.years[0]}–${s.years[s.years.length - 1]})\n\n${seasons}\n\n**ਇਸਦਾ ਮਤਲਬ:**\n• ਸਰਦ/ਖ਼ਰੀਫ ਫ਼ਸਲਾਂ (ਝੋਨਾ, ਕਪਾਹ) ਮੌਨਸੂਨ 'ਤੇ ਚੱਲਦੀਆਂ ਹਨ — ਪਰ ਮੀਂਹ ~1,200 mm ਪਾਰ ਕਰਦੇ ਹੀ ਝਾੜ ਡਿੱਗਦਾ ਹੈ (ਪਾਣੀ ਭਰਨਾ)\n• ਰੱਬੀ (ਕਣਕ, ਸਰ੍ਹੋਂ) ਨੂੰ ਸਿੰਚਾਈ ਚਾਹੀਦੀ — ਮਾਰਚ ਦੀ ਝੁਲਸੀ ਗਰਮੀ ਝਾੜ ਕੱਟ ਸਕਦੀ ਹੈ\n• ਮਾਡਲ ਮੀਂਹ + ਤਾਪਮਾਨ ਨੂੰ ਭਾਰ ਦਿੰਦਾ ਹੈ — ਸਾਲ-ਦਰ-ਸਾਲ ਰੁਝਾਨ **${tabEnv} ਟੈਬ** ਵਿੱਚ\n\n🌱 ਸੁਝਾਅ: ਖ਼ਰੀਫ ਵਿੱਚ ਜ਼ਿਆਦਾ ਮੀਂਹ ਵਾਲੇ ਸਾਲਾਂ ਵਿੱਚ ਪਾਣੀ ਨਿਕਾਸੀ ਦੀ ਯੋਜਨਾ ਪਹਿਲਾਂ ਬਣਾਓ।`,
      followUps: ["ਮਿੱਟੀ ਦੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"],
    };
  }
  return {
    topic: "weather",
    markdown: `### 🌦️ Weather patterns in the dataset (${s.years[0]}–${s.years[s.years.length - 1]})\n\n${seasons}\n\n**What it means:**\n• Kharif crops (paddy, cotton) ride the monsoon — but yields drop once rain crosses ~1,200 mm (waterlogging)\n• Rabi (wheat, mustard) needs irrigation support — terminal heat in March can cut yields\n• The model already weights rainfall + temperature — year-wise trends in the **${tabEnv} tab**\n\n🌱 Tip: in high-rainfall Kharif years, plan drainage *before* the season peaks.`,
    followUps: ["Soil recommendations", "How accurate is the model?", "Which district has the highest yield?"],
  };
}

function satelliteAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const tabMaps = t("tab.maps", lang);
  if (lang === "hi") {
    return {
      topic: "satellite",
      markdown: `### 🛰️ सैटेलाइट सूचकांक कैसे पढ़ें\n\n• **NDVI** (पौधे की जीवन-शक्ति): <0.3 तनावग्रस्त · 0.3–0.5 मध्यम · 0.5–0.7 अच्छा · >0.7 घना\n• **NDWI** (पानी की मात्रा): ऋणात्मक = सूखा तनाव · 0–0.2 मध्यम · >0.2 गीला\n• **EVI** — NDVI जैसा, पर घनी फसलों में कम संतृप्त\n\n**इस डेटासेट में:** औसत NDVI **${s.avgNdvi}**, औसत NDWI **${s.avgNdwi}** — कुल मिलाकर स्वस्थ।${s.seasonAvg.length ? `\nसबसे हरा-भरा मौसम: **${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].season}** (NDVI ${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].ndvi})।` : ""}\n\n🗺️ जिलों का स्थानिक पैटर्न **${tabMaps} टैब** (NDVI/NDWI/EVI मोड) में देखें। अगर आपके जिले का NDVI पीक सीज़न में <0.4 हो → सिंचाई/कीट तनाव जाँचें।`,
      followUps: ["मौसम का पैटर्न कैसा है?", "मॉडल कितना सटीक है?", "बठिंडा की प्रोफ़ाइल दिखाओ"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "satellite",
      markdown: `### 🛰️ ਸੈਟੇਲਾਈਟ ਸੂਚਕ ਕਿਵੇਂ ਪੜ੍ਹਨੇ ਹਨ\n\n• **NDVI** (ਬਨਸਪਤੀ ਦੀ ਸਿਹਤ): <0.3 ਤਣਾਅ · 0.3–0.5 ਮੱਧਮ · 0.5–0.7 ਵਧੀਆ · >0.7 ਸੰਘਣਾ\n• **NDWI** (ਪਾਣੀ ਦੀ ਮਾਤਰਾ): ਨੈਗੇਟਿਵ = ਸੁੱਕਾ ਤਣਾਅ · 0–0.2 ਮੱਧਮ · >0.2 ਗਿੱਲਾ\n• **EVI** — NDVI ਵਰਗਾ, ਪਰ ਸੰਘਣੀਆਂ ਫ਼ਸਲਾਂ ਵਿੱਚ ਘੱਟ ਸੈਚੁਰੇਟ\n\n**ਇਸ ਡੇਟਾਸੈੱਟ ਵਿੱਚ:** ਔਸਤ NDVI **${s.avgNdvi}**, ਔਸਤ NDWI **${s.avgNdwi}** — ਕੁੱਲ ਮਿਲਾ ਕੇ ਸਿਹਤਮਾਨ।${s.seasonAvg.length ? `\nਸਭ ਤੋਂ ਹਰਾ-ਭਰਾ ਮੌਸਮ: **${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].season}** (NDVI ${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].ndvi})।` : ""}\n\n🗺️ ਜ਼ਿਲ੍ਹਿਆਂ ਦਾ ਥਾਂ-ਥਾਂ ਪੈਟਰਨ **${tabMaps} ਟੈਬ** (NDVI/NDWI/EVI ਮੋਡ) ਵਿੱਚ ਵੇਖੋ। ਤੁਹਾਡੇ ਜ਼ਿਲ੍ਹੇ ਦਾ NDVI ਸਿਖਰ ਰੁੱਤੇ <0.4 ਹੋਵੇ → ਸਿੰਚਾਈ/ਕੀੜਾ ਤਣਾਅ ਜਾਂਚੋ।`,
      followUps: ["ਮੌਸਮ ਦਾ ਪੈਟਰਨ ਕਿਵੇਂ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਬਠਿੰਡਾ ਦੀ ਪ੍ਰੋਫ਼ਾਈਲ ਦਿਖਾਓ"],
    };
  }
  return {
    topic: "satellite",
    markdown: `### 🛰️ Reading the satellite indices\n\n• **NDVI** (vegetation vigour): <0.3 stressed · 0.3–0.5 moderate · 0.5–0.7 good · >0.7 dense canopy\n• **NDWI** (water content): negative = dry stress · 0–0.2 moderate · >0.2 wet\n• **EVI** — like NDVI but saturates less over dense crops\n\n**In this dataset:** average NDVI **${s.avgNdvi}**, average NDWI **${s.avgNdwi}** — healthy overall.${s.seasonAvg.length ? `\nGreenest season: **${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].season}** (NDVI ${[...s.seasonAvg].sort((a, b) => b.ndvi - a.ndvi)[0].ndvi}).` : ""}\n\n🗺️ See the spatial pattern in the **${tabMaps} tab** (NDVI/NDWI/EVI modes). If your district's NDVI drops below 0.4 in peak season → check irrigation or pest stress.`,
    followUps: ["What's the weather pattern?", "How accurate is the model?", "Show me Bathinda"],
  };
}

function datasetAnswer(s: DatasetStats, lang: Lang): ChatReply {
  const tabData = t("tab.data", lang);
  const top = s.topCrops[0];
  const topD = s.topDistricts[0];
  if (lang === "hi") {
    return {
      topic: "dataset",
      markdown: `### 📦 डेटासेट एक नज़र में\n\n• **${fmt(s.samples)} नमूने** · **${s.districts.length} जिले** · **${s.crops.length} फसलें** · **${s.years[0]}–${s.years[s.years.length - 1]}** · ${s.seasons.join(" + ")}\n• **औसत उपज: ${fmt(s.avgYield)} kg/ha** · माध्यिका ${fmt(s.medianYield)}\n• **शीर्ष फसल:** ${top ? cropName(top.crop, "hi") : "—"} (${top ? fmt(top.avg) : "—"}) · **शीर्ष जिला:** ${topD ? topD.district : "—"}\n• **मॉडल:** R² ${s.r2.toFixed(2)} · MAE ${fmt(s.mae)} kg/ha\n\nखुद रिकॉर्ड छानने के लिए **${tabData}** टैब — फ़िल्टर + CSV डाउनलोड।`,
      followUps: ["किस जिले की उपज सबसे ज़्यादा है?", "मॉडल कितना सटीक है?", "सबसे ज़्यादा उपज वाली फसलें"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "dataset",
      markdown: `### 📦 ਡੇਟਾਸੈੱਟ ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ\n\n• **${fmt(s.samples)} ਨਮੂਨੇ** · **${s.districts.length} ਜ਼ਿਲ੍ਹੇ** · **${s.crops.length} ਫ਼ਸਲਾਂ** · **${s.years[0]}–${s.years[s.years.length - 1]}** · ${s.seasons.join(" + ")}\n• **ਔਸਤ ਝਾੜ: ${fmt(s.avgYield)} kg/ha** · ਮੱਧ ${fmt(s.medianYield)}\n• **ਸਿਖਰ ਫ਼ਸਲ:** ${top ? cropName(top.crop, "pa") : "—"} (${top ? fmt(top.avg) : "—"}) · **ਸਿਖਰ ਜ਼ਿਲ੍ਹਾ:** ${topD ? topD.district : "—"}\n• **ਮਾਡਲ:** R² ${s.r2.toFixed(2)} · MAE ${fmt(s.mae)} kg/ha\n\nਖ਼ੁਦ ਰਿਕਾਰਡ ਛਾਣਨ ਲਈ **${tabData}** ਟੈਬ — ਫ਼ਿਲਟਰ + CSV ਡਾਊਨਲੋਡ।`,
      followUps: ["ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "ਸਭ ਤੋਂ ਵੱਧ ਝਾੜ ਵਾਲੀਆਂ ਫ਼ਸਲਾਂ"],
    };
  }
  return {
    topic: "dataset",
    markdown: `### 📦 Dataset at a glance\n\n• **${fmt(s.samples)} samples** · **${s.districts.length} districts** · **${s.crops.length} crops** · **${s.years[0]}–${s.years[s.years.length - 1]}** · ${s.seasons.join(" + ")}\n• **Avg yield: ${fmt(s.avgYield)} kg/ha** · median ${fmt(s.medianYield)}\n• **Top crop:** ${top ? cropName(top.crop, "en") : "—"} (${top ? fmt(top.avg) : "—"}) · **Top district:** ${topD ? topD.district : "—"}\n• **Model:** R² ${s.r2.toFixed(2)} · MAE ${fmt(s.mae)} kg/ha\n\nBrowse rows yourself in **${tabData}** — filters + CSV download.`,
    followUps: ["Which district has the highest yield?", "How accurate is the model?", "Highest-yielding crops"],
  };
}

function missingAnswer(kind: "crop" | "district", name: string, s: DatasetStats, lang: Lang): ChatReply {
  if (kind === "crop") {
    const avail = s.topCrops.slice(0, 6).map((c) => cropName(c.crop, lang)).join(lang === "en" ? ", " : ", ");
    if (lang === "hi") return { topic: "missingCrop", markdown: `🤔 **${name}** के लिए मौजूदा डेटासेट में कोई रिकॉर्ड नहीं है — इसमें ${s.crops.length} फसलें हैं, जैसे: ${avail}।\n\nइनमें से किसी के बारे में पूछें — मैं सटीक आंकड़े बता दूँगा।`, followUps: ["सबसे ज़्यादा उपज वाली फसलें", "मॉडल कितना सटीक है?"] };
    if (lang === "pa") return { topic: "missingCrop", markdown: `🤔 **${name}** ਲਈ ਮੌਜੂਦਾ ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਕੋਈ ਰਿਕਾਰਡ ਨਹੀਂ — ਇਸ ਵਿੱਚ ${s.crops.length} ਫ਼ਸਲਾਂ ਹਨ, ਜਿਵੇਂ: ${avail}।\n\nਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਸੇ ਬਾਰੇ ਪੁੱਛੋ — ਮੈਂ ਸਹੀ ਅੰਕੜੇ ਦੱਸ ਦਿਆਂਗਾ।`, followUps: ["ਸਭ ਤੋਂ ਵੱਧ ਝਾੜ ਵਾਲੀਆਂ ਫ਼ਸਲਾਂ", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"] };
    return { topic: "missingCrop", markdown: `🤔 I don't have records for **${name}** in the current dataset — it covers ${s.crops.length} crops, e.g.: ${avail}.\n\nAsk me about any of those and I'll give you exact numbers.`, followUps: ["Highest-yielding crops", "How accurate is the model?"] };
  }
  const avail = s.topDistricts.slice(0, 6).map((d) => d.district).join(", ");
  if (lang === "hi") return { topic: "missingDistrict", markdown: `🤔 **${name}** मौजूदा डेटासेट में नहीं है — इसमें ${s.districts.length} जिले हैं, जैसे: ${avail}।\n\nइनमें से किसी के बारे में पूछें!`, followUps: ["किस जिले की उपज सबसे ज़्यादा है?", "मॉडल कितना सटीक है?"] };
  if (lang === "pa") return { topic: "missingDistrict", markdown: `🤔 **${name}** ਮੌਜੂਦਾ ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਨਹੀਂ ਹੈ — ਇਸ ਵਿੱਚ ${s.districts.length} ਜ਼ਿਲ੍ਹੇ ਹਨ, ਜਿਵੇਂ: ${avail}।\n\nਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਸੇ ਬਾਰੇ ਪੁੱਛੋ!`, followUps: ["ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?"] };
  return { topic: "missingDistrict", markdown: `🤔 **${name}** isn't in the current dataset — it covers ${s.districts.length} districts, e.g.: ${avail}.\n\nAsk me about any of those!`, followUps: ["Which district has the highest yield?", "How accurate is the model?"] };
}

function fallbackAnswer(_s: DatasetStats, lang: Lang): ChatReply {
  if (lang === "hi") {
    return {
      topic: "fallback",
      markdown: `मैं निश्चित नहीं कि आपने क्या पूछा 🤔 — मैं **डेटासेट पर आधारित** सवालों में सबसे अच्छा हूँ:\n\n• 🌾 फसलें — "गेहूं कैसा प्रदर्शन करती है?" · "बठिंडा के लिए सबसे अच्छी फसल?"\n• 🗺️ जिले — "किस जिले की उपज सबसे ज़्यादा है?"\n• 🎯 मॉडल — "भविष्यवाणियाँ कितनी सटीक हैं?" · "हाई रिस्क क्या है?"\n• 🛰️ सूचकांक — "NDVI 0.3 का मतलब?"\n• 🌦️ मौसम व मिट्टी — "रबी की वर्षा कैसी रही?"\n\n(API कुंजी — Gemini/Groq — लगाने पर मैं खुले सवाल भी हिंदी में हल करता हूँ।)`,
      followUps: ["किस जिले की उपज सबसे ज़्यादा है?", "मॉडल कितना सटीक है?", "NDVI 0.6 का मतलब?"],
    };
  }
  if (lang === "pa") {
    return {
      topic: "fallback",
      markdown: `ਮੈਨੂੰ ਪੱਕਾ ਨਹੀਂ ਲੱਗਦਾ ਤੁਸੀਂ ਕੀ ਪੁੱਛਿਆ 🤔 — ਮੈਂ **ਡੇਟਾਸੈੱਟ ਅਧਾਰਤ** ਸਵਾਲਾਂ ਵਿੱਚ ਸਭ ਤੋਂ ਵਧੀਆ ਹਾਂ:\n\n• 🌾 ਫ਼ਸਲਾਂ — "ਕਣਕ ਕਿਵੇਂ ਕਰਦੀ ਹੈ?" · "ਬਠਿੰਡਾ ਲਈ ਵਧੀਆ ਫ਼ਸਲ?"\n• 🗺️ ਜ਼ਿਲ੍ਹੇ — "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?"\n• 🎯 ਮਾਡਲ — "ਭਵਿੱਖਬਾਣੀਆਂ ਕਿੰਨੀਆਂ ਸਹੀ ਹਨ?" · "ਹਾਈ ਰਿਸਕ ਕੀ ਹੈ?"\n• 🛰️ ਸੂਚਕ — "NDVI 0.3 ਦਾ ਮਤਲਬ?"\n• 🌦️ ਮੌਸਮ ਤੇ ਮਿੱਟੀ — "ਰੱਬੀ ਦੇ ਮੀਂਹ ਕਿਵੇਂ ਸੀ?"\n\n(API ਕੁੰਜੀ — Gemini/Groq — ਲਗਾਉਣ 'ਤੇ ਮੈਂ ਖੁੱਲ੍ਹੇ ਸਵਾਲ ਵੀ ਪੰਜਾਬੀ ਵਿੱਚ ਹੱਲ ਕਰਦਾ ਹਾਂ।)`,
      followUps: ["ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?", "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?", "NDVI 0.6 ਦਾ ਕੀ ਮਤਲਬ?"],
    };
  }
  return {
    topic: "fallback",
    markdown: `I'm not sure I caught that one 🤔 — I'm best at questions **grounded in the dataset**:\n\n• 🌾 Crops — "How does wheat perform?" · "Best crop for Bathinda?"\n• 🗺️ Districts — "Which district has the highest yield?"\n• 🎯 Model — "How accurate are predictions?" · "What is high risk?"\n• 🛰️ Indices — "What does NDVI 0.3 mean?"\n• 🌦️ Weather & soil — "How was Rabi rainfall?"\n\n(Plug in an API key — Gemini/Groq — and I'll take open-ended questions too.)`,
    followUps: ["Which district has the highest yield?", "How accurate is the model?", "What does NDVI 0.6 mean?"],
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function answer(input: string, ctx: ChatContext, s: DatasetStats, lang: Lang): ChatReply {
  if (!input.trim()) return greetingAnswer(s, lang); // used for the initial greeting
  const crops = findCrops(input, s.crops);
  const districts = findDistricts(input, s.districts);
  const entities = crops.found.length + districts.found.length;

  if (entities >= 2) {
    if (crops.found.length >= 2 && districts.found.length === 0) {
      return compareAnswer(crops.found[0], crops.found[1], s, lang, "crop");
    }
    if (districts.found.length >= 2 && crops.found.length === 0) {
      return compareAnswer(districts.found[0], districts.found[1], s, lang, "district");
    }
    return cropInDistrictAnswer(crops.found[0], districts.found[0], ctx, s, lang);
  }
  if (crops.found.length === 1 && districts.found.length === 1) {
    return cropInDistrictAnswer(crops.found[0], districts.found[0], ctx, s, lang);
  }
  if (crops.missing.length > 0 && crops.found.length === 0) return missingAnswer("crop", cropName(crops.missing[0], lang), s, lang);
  if (districts.missing.length > 0 && districts.found.length === 0) return missingAnswer("district", districts.missing[0], s, lang);

  if (districts.found.length === 1 && RX.best.test(input)) return bestForDistrictAnswer(districts.found[0], s, lang);
  if (districts.found.length === 1) return districtAnswer(districts.found[0], s, lang);
  if (crops.found.length === 1) return cropAnswer(crops.found[0], s, lang);

  if (RX.best.test(input) && RX.districtWord.test(input)) return topDistrictsAnswer(s, lang);
  if (RX.best.test(input) && RX.cropWord.test(input)) return topCropsAnswer(s, lang);
  if (RX.risk.test(input)) return riskAnswer(s, lang);
  if (RX.model.test(input)) return modelAnswer(s, lang);
  if (RX.soil.test(input)) return soilAnswer(s, lang);
  if (RX.satellite.test(input)) return satelliteAnswer(s, lang);
  if (RX.weather.test(input)) return weatherAnswer(s, lang);
  if (RX.dataset.test(input)) return datasetAnswer(s, lang);
  if (RX.who.test(input) || RX.greeting.test(input)) return greetingAnswer(s, lang);
  if (RX.thanks.test(input)) return gratitudeAnswer(lang);
  return fallbackAnswer(s, lang);
}

// ---------------------------------------------------------------------------
// LLM prompt support (when the user plugs in an API key)
// ---------------------------------------------------------------------------

/** Compact, token-cheap snapshot of the dataset for grounding an LLM. */
export function summarizeForLLM(s: DatasetStats): string {
  const crops = s.topCrops
    .slice(0, 6)
    .map((c) => `${c.crop} ${fmt(c.avg)} kg/ha`)
    .join("; ");
  const seasons = s.seasonAvg
    .map((se) => `${se.season}: ${fmt(se.rain)} mm, ${se.temp}°C, NDVI ${se.ndvi}`)
    .join("; ");
  const districts = s.topDistricts
    .slice(0, 5)
    .map((d) => `${d.district} ${fmt(d.avg)}`)
    .join("; ");
  return [
    `Rows: ${fmt(s.samples)}; Districts: ${s.districts.length}; Crops: ${s.crops.length}; Years: ${s.years[0]}–${s.years[s.years.length - 1]}; Seasons: ${s.seasons.join(", ")}.`,
    `Model: R² ${s.r2.toFixed(2)}, MAE ${fmt(s.mae)} kg/ha, 95% interval coverage ${s.coverage95.toFixed(1)}%, mean uncertainty ${s.meanUnc.toFixed(1)}%.`,
    `Avg yield ${fmt(s.avgYield)} kg/ha. Top crops: ${crops}.`,
    `Top districts: ${districts}.`,
    `Season averages: ${seasons}.`,
    `Avg NDVI ${s.avgNdvi}, NDWI ${s.avgNdwi}, soil moisture ${s.avgSoilMoisture}.`,
  ].join("\n");
}

export const AGRI_SYSTEM_PROMPT = `You are KisanAI, a warm, knowledgeable agricultural assistant for the Agri RS Crop Yield Prediction & Analytics dashboard, specializing in Punjab, India.

Your personality:
- Friendly and conversational, like a knowledgeable farming advisor
- Use simple language a farmer can understand
- Be encouraging and practical
- Share relevant data from the dashboard when answering
- Use emojis naturally but don't overdo them
- If unsure, say so honestly rather than making things up

You help with: crop selection, yield prediction interpretation, district advice, remote-sensing indices (NDVI/NDWI/EVI), seasonal planning (Kharif/Rabi), soil health, pest management, and market basics.

Formatting: keep answers concise (max ~200 words). Use **bold** for key figures, "### " headers for sections and "• " for bullets — the UI renders this markdown.
Units are metric (kg/ha, mm, °C). When quoting numbers, ground them in the dataset snapshot provided below.`;
