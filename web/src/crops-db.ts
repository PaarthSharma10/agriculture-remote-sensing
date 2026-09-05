/**
 * crops-db.ts — Comprehensive crop database for the Suitability model.
 *
 * PURPOSE:
 *   Contains 100 crops with their ideal growing conditions (pH, moisture,
 *   temperature, rainfall, altitude, NPK requirements) and tags for each
 *   crop indicating which Punjab districts are suitable for growing it.
 *
 * DATA SOURCES:
 *   Requirements are based on ICAR (Indian Council of Agricultural Research)
 *   guidelines, FAO crop profiles, and Punjab Agricultural University data.
 *
 * USAGE:
 *   • SuitabilityView uses this to score crops against user site readings
 *   • MapsView can use districtSuitable to show which crops grow where
 */

export interface CropProfile {
  name: string;
  category: string;
  /** Ideal soil pH range [min, max]. */
  ph: [number, number];
  /** Ideal soil moisture percentage [min, max]. */
  moisture: [number, number];
  /** Ideal temperature °C [min, max]. */
  temp: [number, number];
  /** Ideal annual rainfall mm [min, max]. */
  rainfall: [number, number];
  /** Ideal altitude meters [min, max]. */
  altitude: [number, number];
  /** Nitrogen index requirement [min, max]. */
  nitrogen: [number, number];
  /** Phosphorus index requirement [min, max]. */
  phosphorus: [number, number];
  /** Potassium index requirement [min, max]. */
  potassium: [number, number];
  /** Districts in Punjab where this crop is commonly grown. */
  districts: string[];
}

/** All 22 Punjab districts. */
export const PUNJAB_DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
  "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
  "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur",
  "Shahid Bhagat Singh Nagar", "Tarn Taran",
];

/**
 * 100 crops with growing requirements and Punjab district suitability.
 * Categories: CEREAL, PULSE, OILSEED, FIBER, SUGAR, VEGETABLE, FRUIT,
 *             SPICE, MEDICINAL, FORAGE, FLOWER, NUT, PLANTATION, ROOT CROP
 */
export const CROP_DATABASE: CropProfile[] = [
  // ── CEREALS (15) ──
  { name: "Wheat", category: "CEREAL", ph: [6, 7.5], moisture: [40, 70], temp: [10, 25], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [30, 80], phosphorus: [20, 60], potassium: [20, 60], districts: ["Amritsar", "Ludhiana", "Patiala", "Sangrur", "Bathinda", "Moga", "Jalandhar", "Gurdaspur", "Hoshiarpur", "Tarn Taran", "Firozpur", "Mansa", "Faridkot", "Barnala", "Fatehgarh Sahib", "Rupnagar", "Shahid Bhagat Singh Nagar", "Kapurthala"] },
  { name: "Rice (Paddy)", category: "CEREAL", ph: [5.5, 7], moisture: [60, 100], temp: [20, 35], rainfall: [1000, 2000], altitude: [0, 2000], nitrogen: [40, 90], phosphorus: [25, 70], potassium: [25, 70], districts: ["Ludhiana", "Jalandhar", "Kapurthala", "Hoshiarpur", "Gurdaspur", "Amritsar", "Tarn Taran", "Firozpur", "Fazilka", "Moga", "Sangrur", "Patiala"] },
  { name: "Maize", category: "CEREAL", ph: [5.8, 7], moisture: [40, 75], temp: [18, 32], rainfall: [500, 1000], altitude: [0, 2500], nitrogen: [35, 85], phosphorus: [20, 65], potassium: [20, 65], districts: ["Ludhiana", "Patiala", "Sangrur", "Barnala", "Moga", "Jalandhar", "Hoshiarpur", "Rupnagar", "Fatehgarh Sahib"] },
  { name: "Bajra (Pearl Millet)", category: "CEREAL", ph: [6, 8], moisture: [25, 55], temp: [25, 40], rainfall: [250, 600], altitude: [0, 1000], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [10, 45], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot", "Fazilka", "Firozpur", "Moga"] },
  { name: "Jowar (Sorghum)", category: "CEREAL", ph: [6, 8], moisture: [25, 55], temp: [20, 35], rainfall: [300, 700], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [10, 45], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur", "Faridkot"] },
  { name: "Barley", category: "CEREAL", ph: [6, 8], moisture: [30, 55], temp: [8, 22], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Muktsar", "Fazilka", "Sangrur", "Patiala"] },
  { name: "Ragi (Finger Millet)", category: "CEREAL", ph: [5, 7.5], moisture: [40, 70], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 2000], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [15, 55], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Gurdaspur"] },
  { name: "Kodo Millet", category: "CEREAL", ph: [5.5, 7.5], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [15, 45], phosphorus: [10, 35], potassium: [10, 40], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Little Millet", category: "CEREAL", ph: [5.5, 7.5], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [15, 45], phosphorus: [10, 35], potassium: [10, 40], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Gurdaspur"] },
  { name: "Barnyard Millet", category: "CEREAL", ph: [5.5, 7.5], moisture: [30, 65], temp: [20, 35], rainfall: [400, 900], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [10, 45], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Proso Millet", category: "CEREAL", ph: [6, 7.5], moisture: [25, 50], temp: [20, 35], rainfall: [250, 550], altitude: [0, 1000], nitrogen: [12, 40], phosphorus: [8, 35], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot"] },
  { name: "Tritcale", category: "CEREAL", ph: [5.5, 7.5], moisture: [35, 65], temp: [8, 24], rainfall: [350, 700], altitude: [0, 1200], nitrogen: [25, 70], phosphorus: [18, 55], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Sangrur", "Bathinda", "Moga"] },
  { name: "Oats", category: "CEREAL", ph: [5.5, 7.5], moisture: [35, 65], temp: [8, 25], rainfall: [350, 700], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda"] },
  { name: "Canary Grass", category: "CEREAL", ph: [5.5, 7], moisture: [40, 70], temp: [10, 25], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [15, 55], districts: ["Ludhiana", "Jalandhar", "Patiala"] },
  { name: "Buckwheat", category: "CEREAL", ph: [5, 7], moisture: [30, 60], temp: [10, 25], rainfall: [300, 700], altitude: [0, 2000], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [12, 45], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },

  // ── PULSES (12) ──
  { name: "Moong (Green Gram)", category: "PULSE", ph: [6, 7.5], moisture: [30, 55], temp: [25, 35], rainfall: [300, 700], altitude: [0, 1000], nitrogen: [10, 40], phosphorus: [15, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot", "Fazilka", "Firozpur", "Moga", "Sangrur"] },
  { name: "Urad (Black Gram)", category: "PULSE", ph: [6, 7.5], moisture: [30, 55], temp: [25, 35], rainfall: [300, 700], altitude: [0, 1000], nitrogen: [10, 40], phosphorus: [15, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot", "Fazilka", "Moga"] },
  { name: "Arhar (Tur Dal)", category: "PULSE", ph: [6, 8], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [10, 40], phosphorus: [15, 50], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot", "Fazilka", "Firozpur", "Moga", "Sangrur", "Patiala"] },
  { name: "Chana (Chickpea)", category: "PULSE", ph: [6, 8], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [10, 40], phosphorus: [15, 50], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Muktsar", "Fazilka", "Sangrur", "Patiala", "Moga"] },
  { name: "Masoor (Lentil)", category: "PULSE", ph: [6, 8], moisture: [25, 50], temp: [10, 25], rainfall: [250, 550], altitude: [0, 1500], nitrogen: [10, 35], phosphorus: [12, 45], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Faridkot", "Muktsar", "Sangrur", "Patiala"] },
  { name: "Rajma (Kidney Bean)", category: "PULSE", ph: [5.5, 7], moisture: [40, 70], temp: [15, 28], rainfall: [500, 1000], altitude: [0, 2000], nitrogen: [15, 50], phosphorus: [15, 50], potassium: [20, 60], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Gurdaspur", "Jalandhar"] },
  { name: "Lobia (Cowpea)", category: "PULSE", ph: [6, 7.5], moisture: [30, 60], temp: [25, 35], rainfall: [300, 700], altitude: [0, 1200], nitrogen: [10, 40], phosphorus: [12, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur"] },
  { name: "Kulthi (Horse Gram)", category: "PULSE", ph: [6, 8], moisture: [25, 50], temp: [20, 35], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [8, 35], phosphorus: [10, 40], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Hoshiarpur", "Rupnagar"] },
  { name: "Moth Bean", category: "PULSE", ph: [6, 8], moisture: [20, 45], temp: [25, 40], rainfall: [200, 500], altitude: [0, 1000], nitrogen: [8, 30], phosphorus: [8, 35], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka"] },
  { name: "Pigeon Pea", category: "PULSE", ph: [5.5, 7.5], moisture: [35, 65], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [10, 45], phosphorus: [12, 50], potassium: [15, 55], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Gurdaspur", "Jalandhar"] },
  { name: "French Bean", category: "PULSE", ph: [6, 7.5], moisture: [40, 65], temp: [15, 28], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Rupnagar"] },
  { name: "Semi Bean", category: "PULSE", ph: [6, 7.5], moisture: [35, 60], temp: [20, 32], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [12, 45], phosphorus: [12, 45], potassium: [15, 50], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur"] },

  // ── OILSEEDS (10) ──
  { name: "Mustard", category: "OILSEED", ph: [6, 7.5], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Muktsar", "Fazilka", "Sangrur", "Patiala", "Moga"] },
  { name: "Groundnut", category: "OILSEED", ph: [6, 7], moisture: [35, 60], temp: [25, 35], rainfall: [500, 1000], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [10, 45], potassium: [15, 55], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur", "Moga", "Sangrur"] },
  { name: "Soybean", category: "OILSEED", ph: [6, 7.5], moisture: [40, 70], temp: [20, 30], rainfall: [600, 1200], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [15, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Sangrur", "Jalandhar", "Hoshiarpur", "Moga"] },
  { name: "Sunflower", category: "OILSEED", ph: [6, 7.5], moisture: [35, 60], temp: [20, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda"] },
  { name: "Sesame (Til)", category: "OILSEED", ph: [5.5, 8], moisture: [25, 55], temp: [25, 40], rainfall: [300, 700], altitude: [0, 1200], nitrogen: [10, 40], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur"] },
  { name: "Linseed (Flax)", category: "OILSEED", ph: [6, 7.5], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur", "Patiala"] },
  { name: "Rapeseed", category: "OILSEED", ph: [6, 7.5], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Muktsar", "Sangrur", "Patiala"] },
  { name: "Castor", category: "OILSEED", ph: [6, 8], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka"] },
  { name: "Niger", category: "OILSEED", ph: [5.5, 7.5], moisture: [30, 55], temp: [25, 35], rainfall: [350, 700], altitude: [0, 1200], nitrogen: [10, 40], phosphorus: [10, 40], potassium: [12, 45], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Safflower", category: "OILSEED", ph: [6, 8], moisture: [25, 50], temp: [15, 30], rainfall: [250, 600], altitude: [0, 1500], nitrogen: [12, 45], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur"] },

  // ── FIBER (5) ──
  { name: "Cotton", category: "FIBER", ph: [6, 8], moisture: [30, 60], temp: [25, 35], rainfall: [600, 1200], altitude: [0, 1000], nitrogen: [25, 70], phosphorus: [15, 50], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Faridkot", "Fazilka", "Firozpur", "Moga", "Sangrur"] },
  { name: "Jute", category: "FIBER", ph: [5, 7.5], moisture: [60, 100], temp: [20, 35], rainfall: [1000, 2000], altitude: [0, 1000], nitrogen: [30, 80], phosphorus: [20, 60], potassium: [20, 60], districts: ["Ludhiana", "Jalandhar", "Kapurthala", "Hoshiarpur"] },
  { name: "Mesta", category: "FIBER", ph: [5.5, 7], moisture: [50, 85], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1000], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Jalandhar", "Hoshiarpur"] },
  { name: "Ramie", category: "FIBER", ph: [5.5, 7], moisture: [50, 80], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1200], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [18, 55], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Sunn Hemp", category: "FIBER", ph: [6, 8], moisture: [30, 60], temp: [25, 35], rainfall: [400, 800], altitude: [0, 1000], nitrogen: [10, 40], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka"] },

  // ── SUGAR (3) ──
  { name: "Sugarcane", category: "SUGAR", ph: [6, 7.5], moisture: [50, 90], temp: [20, 38], rainfall: [1000, 2500], altitude: [0, 1500], nitrogen: [40, 95], phosphorus: [25, 75], potassium: [30, 80], districts: ["Ludhiana", "Jalandhar", "Kapurthala", "Hoshiarpur", "Gurdaspur", "Amritsar", "Tarn Taran", "Firozpur", "Moga", "Sangrur"] },
  { name: "Sweet Sorghum", category: "SUGAR", ph: [6, 8], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [15, 55], phosphorus: [12, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur"] },
  { name: "Sugar Beet", category: "SUGAR", ph: [6, 8], moisture: [40, 70], temp: [10, 25], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [25, 65], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur", "Patiala"] },

  // ── VEGETABLES (20) ──
  { name: "Potato", category: "VEGETABLE", ph: [5, 6.5], moisture: [40, 70], temp: [15, 25], rainfall: [500, 800], altitude: [0, 3000], nitrogen: [30, 75], phosphorus: [20, 60], potassium: [30, 80], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Tarn Taran", "Sangrur", "Moga", "Kapurthala", "Fatehgarh Sahib", "Rupnagar"] },
  { name: "Tomato", category: "VEGETABLE", ph: [6, 7], moisture: [40, 70], temp: [18, 30], rainfall: [400, 800], altitude: [0, 2000], nitrogen: [30, 70], phosphorus: [20, 60], potassium: [25, 70], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Sangrur", "Rupnagar"] },
  { name: "Onion", category: "VEGETABLE", ph: [6, 7.5], moisture: [35, 65], temp: [13, 28], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar", "Amritsar"] },
  { name: "Cabbage", category: "VEGETABLE", ph: [6, 7.5], moisture: [40, 70], temp: [10, 24], rainfall: [400, 800], altitude: [0, 2000], nitrogen: [30, 70], phosphorus: [20, 55], potassium: [25, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Sangrur"] },
  { name: "Cauliflower", category: "VEGETABLE", ph: [6, 7.5], moisture: [40, 70], temp: [10, 24], rainfall: [400, 800], altitude: [0, 2000], nitrogen: [30, 70], phosphorus: [20, 55], potassium: [25, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Sangrur", "Rupnagar"] },
  { name: "Brinjal (Eggplant)", category: "VEGETABLE", ph: [5.5, 7], moisture: [40, 70], temp: [22, 35], rainfall: [500, 1000], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Capsicum", category: "VEGETABLE", ph: [6, 7], moisture: [40, 70], temp: [18, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar"] },
  { name: "Okra (Bhindi)", category: "VEGETABLE", ph: [6, 7], moisture: [35, 65], temp: [25, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar", "Sangrur"] },
  { name: "Cucumber", category: "VEGETABLE", ph: [5.5, 7], moisture: [40, 70], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar", "Sangrur"] },
  { name: "Bottle Gourd", category: "VEGETABLE", ph: [5.5, 7], moisture: [40, 75], temp: [22, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar", "Sangrur"] },
  { name: "Bitter Gourd", category: "VEGETABLE", ph: [5.5, 7], moisture: [40, 70], temp: [22, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [18, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar"] },
  { name: "Pumpkin", category: "VEGETABLE", ph: [5.5, 7.5], moisture: [40, 75], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1500], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar"] },
  { name: "Peas", category: "VEGETABLE", ph: [6, 7.5], moisture: [40, 70], temp: [8, 22], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [20, 55], phosphorus: [18, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Sangrur", "Rupnagar"] },
  { name: "Carrot", category: "VEGETABLE", ph: [6, 7], moisture: [40, 65], temp: [10, 24], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [25, 65], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar"] },
  { name: "Radish", category: "VEGETABLE", ph: [6, 7.5], moisture: [35, 65], temp: [10, 25], rainfall: [300, 700], altitude: [0, 2000], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar"] },
  { name: "Beetroot", category: "VEGETABLE", ph: [6, 7.5], moisture: [40, 65], temp: [10, 25], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [25, 65], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar"] },
  { name: "Spinach", category: "VEGETABLE", ph: [6, 7.5], moisture: [40, 70], temp: [8, 24], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar"] },
  { name: "Fenugreek", category: "VEGETABLE", ph: [6, 8], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar", "Amritsar"] },
  { name: "Coriander", category: "VEGETABLE", ph: [6, 8], moisture: [30, 55], temp: [10, 30], rainfall: [300, 700], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar", "Amritsar"] },
  { name: "Garlic", category: "VEGETABLE", ph: [6, 8], moisture: [35, 60], temp: [12, 28], rainfall: [350, 700], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar", "Amritsar"] },

  // ── FRUITS (15) ──
  { name: "Mango", category: "FRUIT", ph: [5.5, 7.5], moisture: [35, 65], temp: [24, 38], rainfall: [750, 1500], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [15, 55], potassium: [20, 65], districts: ["Ludhiana", "Patiala", "Sangrur", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar", "Moga", "Rupnagar", "Fatehgarh Sahib", "Barnala"] },
  { name: "Guava", category: "FRUIT", ph: [5, 7], moisture: [35, 65], temp: [20, 35], rainfall: [500, 1200], altitude: [0, 1200], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur", "Rupnagar"] },
  { name: "Lemon", category: "FRUIT", ph: [5.5, 7], moisture: [35, 65], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Rupnagar"] },
  { name: "Sweet Orange", category: "FRUIT", ph: [5.5, 7], moisture: [40, 70], temp: [15, 35], rainfall: [600, 1200], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [22, 65], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Gurdaspur", "Jalandhar"] },
  { name: "Litchi", category: "FRUIT", ph: [5, 6.5], moisture: [50, 80], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1200], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [20, 60], districts: ["Hoshiarpur", "Jalandhar", "Kapurthala", "Gurdaspur", "Pathankot"] },
  { name: "Papaya", category: "FRUIT", ph: [5.5, 7], moisture: [40, 70], temp: [22, 35], rainfall: [600, 1200], altitude: [0, 1000], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [25, 70], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Banana", category: "FRUIT", ph: [5.5, 7], moisture: [50, 85], temp: [25, 35], rainfall: [1200, 2500], altitude: [0, 1200], nitrogen: [40, 90], phosphorus: [20, 65], potassium: [35, 85], districts: ["Ludhiana", "Jalandhar", "Kapurthala", "Hoshiarpur", "Gurdaspur"] },
  { name: "Pineapple", category: "FRUIT", ph: [4.5, 5.5], moisture: [40, 70], temp: [22, 35], rainfall: [1000, 1800], altitude: [0, 1500], nitrogen: [20, 60], phosphorus: [10, 50], potassium: [20, 60], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Pomegranate", category: "FRUIT", ph: [5.5, 7.5], moisture: [30, 55], temp: [20, 38], rainfall: [300, 700], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [18, 55], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Faridkot", "Sangrur"] },
  { name: "Grapes", category: "FRUIT", ph: [5.5, 7], moisture: [30, 55], temp: [15, 35], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar"] },
  { name: "Apple", category: "FRUIT", ph: [5.5, 6.8], moisture: [35, 65], temp: [8, 22], rainfall: [800, 1500], altitude: [800, 3000], nitrogen: [25, 60], phosphorus: [15, 50], potassium: [20, 60], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur", "Rupnagar"] },
  { name: "Pear", category: "FRUIT", ph: [5.5, 7], moisture: [35, 65], temp: [8, 24], rainfall: [600, 1200], altitude: [500, 2500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur", "Rupnagar"] },
  { name: "Peach", category: "FRUIT", ph: [5.5, 7], moisture: [35, 65], temp: [8, 25], rainfall: [600, 1200], altitude: [500, 2000], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur"] },
  { name: "Plum", category: "FRUIT", ph: [5.5, 7], moisture: [35, 65], temp: [8, 25], rainfall: [500, 1000], altitude: [500, 2000], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur", "Rupnagar"] },
  { name: "Dragon Fruit", category: "FRUIT", ph: [5.5, 7], moisture: [30, 60], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1000], nitrogen: [20, 55], phosphorus: [10, 45], potassium: [15, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar"] },

  // ── SPICES (8) ──
  { name: "Turmeric", category: "SPICE", ph: [5, 7.5], moisture: [50, 80], temp: [20, 35], rainfall: [1000, 2000], altitude: [0, 1500], nitrogen: [30, 70], phosphorus: [15, 55], potassium: [25, 70], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Jalandhar"] },
  { name: "Ginger", category: "SPICE", ph: [5, 7], moisture: [50, 85], temp: [20, 35], rainfall: [1000, 2000], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [25, 65], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Jalandhar"] },
  { name: "Chilli", category: "SPICE", ph: [5.5, 7], moisture: [35, 65], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1500], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Cumin", category: "SPICE", ph: [6, 8], moisture: [25, 50], temp: [15, 30], rainfall: [250, 550], altitude: [0, 1200], nitrogen: [12, 40], phosphorus: [10, 40], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur"] },
  { name: "Fennel", category: "SPICE", ph: [6, 8], moisture: [30, 55], temp: [15, 30], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur", "Patiala"] },
  { name: "Fenugreek (Methi)", category: "SPICE", ph: [6, 8], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur", "Patiala", "Moga"] },
  { name: "Ajwain", category: "SPICE", ph: [6, 8], moisture: [25, 50], temp: [20, 35], rainfall: [250, 550], altitude: [0, 1200], nitrogen: [10, 40], phosphorus: [10, 40], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka"] },
  { name: "Dill", category: "SPICE", ph: [5.5, 7.5], moisture: [30, 55], temp: [10, 25], rainfall: [300, 600], altitude: [0, 1500], nitrogen: [12, 45], phosphorus: [10, 40], potassium: [12, 45], districts: ["Ludhiana", "Patiala", "Sangrur", "Jalandhar"] },

  // ── MEDICINAL (10) ──
  { name: "Ashwagandha", category: "MEDICINAL", ph: [6, 8], moisture: [25, 50], temp: [20, 35], rainfall: [300, 700], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [15, 50], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Faridkot", "Sangrur"] },
  { name: "Senna", category: "MEDICINAL", ph: [6, 8], moisture: [25, 50], temp: [25, 40], rainfall: [250, 600], altitude: [0, 1000], nitrogen: [10, 40], phosphorus: [8, 35], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka"] },
  { name: "Isabgol (Psyllium)", category: "MEDICINAL", ph: [6, 8], moisture: [25, 50], temp: [15, 30], rainfall: [250, 550], altitude: [0, 1200], nitrogen: [12, 45], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Faridkot", "Sangrur", "Patiala"] },
  { name: "Aloe Vera", category: "MEDICINAL", ph: [6, 8.5], moisture: [15, 40], temp: [15, 38], rainfall: [200, 500], altitude: [0, 1200], nitrogen: [8, 35], phosphorus: [8, 35], potassium: [10, 40], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Faridkot"] },
  { name: "Stevia", category: "MEDICINAL", ph: [6, 7.5], moisture: [40, 70], temp: [15, 30], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Rupnagar"] },
  { name: "Brahmi", category: "MEDICINAL", ph: [5.5, 7.5], moisture: [50, 80], temp: [20, 35], rainfall: [600, 1200], altitude: [0, 1000], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [15, 50], districts: ["Ludhiana", "Jalandhar", "Hoshiarpur", "Kapurthala"] },
  { name: "Tulsi (Holy Basil)", category: "MEDICINAL", ph: [6, 7.5], moisture: [35, 65], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [15, 50], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Mint", category: "MEDICINAL", ph: [6, 8], moisture: [40, 70], temp: [15, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar"] },
  { name: "Lemongrass", category: "MEDICINAL", ph: [5, 8], moisture: [35, 65], temp: [20, 35], rainfall: [500, 1000], altitude: [0, 1200], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [15, 50], districts: ["Hoshiarpur", "Rupnagar", "Pathankot", "Jalandhar"] },
  { name: "Shatavari", category: "MEDICINAL", ph: [6, 8], moisture: [30, 60], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [12, 45], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Hoshiarpur", "Rupnagar"] },

  // ── FORAGE (5) ──
  { name: "Berseem (Clover)", category: "FORAGE", ph: [6, 8], moisture: [40, 70], temp: [10, 25], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar", "Amritsar", "Gurdaspur", "Hoshiarpur", "Kapurthala"] },
  { name: "Lucerne (Alfalfa)", category: "FORAGE", ph: [6.5, 8], moisture: [35, 65], temp: [10, 30], rainfall: [400, 900], altitude: [0, 1500], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda", "Jalandhar"] },
  { name: "Oat (Forage)", category: "FORAGE", ph: [5.5, 7.5], moisture: [35, 65], temp: [8, 25], rainfall: [350, 700], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Sangrur", "Moga", "Bathinda"] },
  { name: "Maize (Fodder)", category: "FORAGE", ph: [5.8, 7], moisture: [40, 75], temp: [18, 32], rainfall: [500, 1000], altitude: [0, 2000], nitrogen: [30, 80], phosphorus: [20, 60], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Sangrur", "Jalandhar", "Hoshiarpur"] },
  { name: "Sorghum (Fodder)", category: "FORAGE", ph: [6, 8], moisture: [25, 55], temp: [20, 35], rainfall: [300, 700], altitude: [0, 1200], nitrogen: [15, 50], phosphorus: [10, 40], potassium: [12, 45], districts: ["Bathinda", "Mansa", "Muktsar", "Fazilka", "Firozpur"] },

  // ── ROOT CROPS (5) ──
  { name: "Sweet Potato", category: "ROOT CROP", ph: [5.5, 6.8], moisture: [40, 70], temp: [20, 35], rainfall: [600, 1200], altitude: [0, 2000], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [25, 65], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Tapioca (Cassava)", category: "ROOT CROP", ph: [5.5, 7], moisture: [40, 75], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1200], nitrogen: [15, 50], phosphorus: [10, 45], potassium: [20, 60], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Yam", category: "ROOT CROP", ph: [5.5, 7], moisture: [45, 75], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [20, 60], districts: ["Hoshiarpur", "Rupnagar", "Jalandhar"] },
  { name: "Colocasia", category: "ROOT CROP", ph: [5.5, 7], moisture: [50, 85], temp: [20, 35], rainfall: [800, 1500], altitude: [0, 1200], nitrogen: [20, 60], phosphorus: [15, 50], potassium: [20, 60], districts: ["Hoshiarpur", "Jalandhar", "Kapurthala", "Rupnagar"] },
  { name: "Turnip", category: "ROOT CROP", ph: [6, 7.5], moisture: [35, 65], temp: [8, 22], rainfall: [350, 700], altitude: [0, 2000], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Gurdaspur", "Amritsar"] },

  // ── FLOWERS (5) ──
  { name: "Marigold", category: "FLOWER", ph: [6, 7.5], moisture: [35, 65], temp: [15, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Sangrur"] },
  { name: "Chrysanthemum", category: "FLOWER", ph: [6, 7.5], moisture: [40, 70], temp: [10, 25], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar"] },
  { name: "Rose", category: "FLOWER", ph: [6, 7.5], moisture: [40, 70], temp: [15, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [25, 65], phosphorus: [18, 55], potassium: [20, 60], districts: ["Ludhiana", "Patiala", "Jalandhar", "Hoshiarpur", "Amritsar", "Gurdaspur"] },
  { name: "Gladiolus", category: "FLOWER", ph: [6, 7.5], moisture: [35, 65], temp: [15, 30], rainfall: [400, 800], altitude: [0, 1500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar"] },
  { name: "Tuberose", category: "FLOWER", ph: [6, 7.5], moisture: [35, 65], temp: [20, 35], rainfall: [400, 800], altitude: [0, 1200], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Ludhiana", "Patiala", "Jalandhar", "Amritsar"] },

  // ── NUTS (2) ──
  { name: "Almond", category: "NUT", ph: [6, 8], moisture: [25, 50], temp: [10, 30], rainfall: [300, 700], altitude: [300, 2000], nitrogen: [15, 50], phosphorus: [12, 45], potassium: [15, 50], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur", "Rupnagar"] },
  { name: "Walnut", category: "NUT", ph: [5.5, 7.5], moisture: [35, 65], temp: [8, 25], rainfall: [600, 1200], altitude: [500, 2500], nitrogen: [20, 55], phosphorus: [15, 50], potassium: [18, 55], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur"] },

  // ── PLANTATION (2) ──
  { name: "Areca Nut", category: "PLANTATION", ph: [5, 6.5], moisture: [50, 85], temp: [20, 35], rainfall: [1500, 3000], altitude: [0, 1000], nitrogen: [25, 65], phosphorus: [15, 50], potassium: [25, 70], districts: ["Hoshiarpur", "Rupnagar", "Pathankot"] },
  { name: "Coffee", category: "PLANTATION", ph: [5, 6.5], moisture: [50, 80], temp: [15, 28], rainfall: [1200, 2500], altitude: [500, 2000], nitrogen: [20, 55], phosphorus: [10, 45], potassium: [20, 60], districts: ["Pathankot", "Gurdaspur", "Hoshiarpur"] },
];

/** Get unique categories from the crop database. */
export function getCropCategories(): string[] {
  return [...new Set(CROP_DATABASE.map((c) => c.category))].sort();
}

/** Get crops by category. */
export function getCropsByCategory(category: string): CropProfile[] {
  return CROP_DATABASE.filter((c) => c.category === category);
}

/** Check if a crop can be grown in a specific district. */
export function canGrowInDistrict(crop: CropProfile, district: string): boolean {
  return crop.districts.includes(district);
}

/** Get all crops that can grow in a specific district. */
export function getCropsForDistrict(district: string): CropProfile[] {
  return CROP_DATABASE.filter((c) => c.districts.includes(district));
}
