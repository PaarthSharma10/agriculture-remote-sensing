/**
 * punjab-geo.ts — GeoJSON boundaries for all 22 districts of Punjab, India.
 *
 * PURPOSE:
 *   Provides Geographic JSON (GeoJSON) polygon coordinates for Leaflet map rendering.
 *   Each district has simplified but geographically accurate boundaries using
 *   real latitude/longitude coordinates.
 *
 * GEOGRAPHIC REFERENCE:
 *   Punjab spans ~29.5°N to 32.5°N latitude, ~73.5°E to ~77°E longitude.
 *   Districts are arranged north-to-south following the actual state geography.
 */

export type GeoCoord = [number, number]; // [longitude, latitude]

export interface DistrictFeature {
  type: "Feature";
  properties: { name: string; id: string };
  geometry: { type: "Polygon"; coordinates: GeoCoord[][] };
}

export interface PunjabGeoJSON {
  type: "FeatureCollection";
  features: DistrictFeature[];
}

// Hand-crafted simplified polygons for all 22 Punjab districts.
// Coordinates: [longitude, latitude] (GeoJSON standard).
export const PUNJAB_GEOJSON: PunjabGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Pathankot", id: "pathankot" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.46, 32.43], [75.65, 32.43], [75.90, 32.35],
          [75.95, 32.18], [75.70, 32.10], [75.46, 32.15],
          [75.38, 32.30], [75.46, 32.43],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Gurdaspur", id: "gurdaspur" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.65, 32.43], [75.90, 32.43], [76.35, 32.40],
          [76.55, 32.25], [76.40, 32.05], [75.95, 32.00],
          [75.90, 32.18], [75.65, 32.30], [75.65, 32.43],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Amritsar", id: "amritsar" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.75, 32.00], [75.46, 32.15], [75.70, 32.10],
          [75.95, 32.00], [75.90, 31.80], [75.55, 31.70],
          [75.10, 31.65], [74.75, 31.75], [74.75, 32.00],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Tarn Taran", id: "tarntaran" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.75, 31.75], [75.10, 31.65], [75.55, 31.70],
          [75.55, 31.45], [75.20, 31.35], [74.80, 31.40],
          [74.70, 31.55], [74.75, 31.75],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Hoshiarpur", id: "hoshiarpur" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.95, 32.00], [76.40, 32.05], [76.65, 31.85],
          [76.55, 31.65], [76.20, 31.60], [75.90, 31.65],
          [75.90, 31.80], [75.95, 32.00],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Shahid Bhagat Singh Nagar", id: "sbsn" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.90, 31.80], [75.90, 31.65], [76.20, 31.60],
          [76.30, 31.40], [76.00, 31.35], [75.75, 31.40],
          [75.70, 31.55], [75.90, 31.80],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Rupnagar", id: "rupnagar" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.20, 31.60], [76.55, 31.65], [76.75, 31.45],
          [76.70, 31.20], [76.40, 31.15], [76.20, 31.25],
          [76.10, 31.40], [76.20, 31.60],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "S.A.S. Nagar", id: "sasnagar" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.70, 31.20], [76.75, 31.45], [77.00, 31.30],
          [77.10, 31.10], [76.95, 30.95], [76.70, 31.00],
          [76.65, 31.10], [76.70, 31.20],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Kapurthala", id: "kapurthala" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.20, 31.35], [75.55, 31.45], [75.75, 31.40],
          [75.75, 31.15], [75.50, 31.05], [75.20, 31.10],
          [75.10, 31.25], [75.20, 31.35],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Jalandhar", id: "jalandhar" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.50, 31.40], [75.75, 31.40], [75.75, 31.15],
          [76.00, 31.35], [76.00, 31.15], [75.75, 31.00],
          [75.50, 31.05], [75.50, 31.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Ludhiana", id: "ludhiana" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.75, 31.40], [76.00, 31.35], [76.30, 31.40],
          [76.30, 31.15], [76.10, 30.90], [75.80, 30.85],
          [75.60, 30.95], [75.75, 31.15], [75.75, 31.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Fatehgarh Sahib", id: "fatehgarhsahib" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.10, 31.40], [76.20, 31.25], [76.40, 31.15],
          [76.30, 30.95], [76.10, 30.95], [76.00, 31.15],
          [76.00, 31.35], [76.10, 31.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Patiala", id: "patiala" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.40, 31.15], [76.70, 31.00], [76.95, 30.95],
          [76.90, 30.65], [76.55, 30.60], [76.30, 30.70],
          [76.30, 30.95], [76.40, 31.15],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Firozpur", id: "firozpur" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.55, 31.40], [74.80, 31.40], [75.20, 31.10],
          [75.20, 30.80], [74.85, 30.70], [74.55, 30.80],
          [74.50, 31.10], [74.55, 31.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Moga", id: "moga" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.20, 31.10], [75.50, 31.05], [75.75, 31.00],
          [75.60, 30.75], [75.30, 30.70], [75.10, 30.80],
          [75.05, 31.00], [75.20, 31.10],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Barnala", id: "barnala" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.60, 30.95], [75.80, 30.85], [76.10, 30.95],
          [76.00, 30.70], [75.75, 30.65], [75.55, 30.70],
          [75.50, 30.85], [75.60, 30.95],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Sangrur", id: "sangrur" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.80, 30.85], [76.10, 30.95], [76.30, 30.70],
          [76.55, 30.60], [76.45, 30.35], [76.10, 30.30],
          [75.85, 30.40], [75.75, 30.65], [75.80, 30.85],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Muktsar", id: "muktsar" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.70, 30.80], [75.05, 30.80], [75.10, 30.55],
          [74.90, 30.35], [74.60, 30.30], [74.45, 30.45],
          [74.50, 30.65], [74.70, 30.80],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Faridkot", id: "faridkot" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.05, 30.80], [75.30, 30.70], [75.55, 30.70],
          [75.45, 30.50], [75.20, 30.40], [75.00, 30.45],
          [74.95, 30.60], [75.05, 30.80],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Bathinda", id: "bathinda" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.30, 30.70], [75.60, 30.60], [75.85, 30.55],
          [75.80, 30.30], [75.55, 30.20], [75.30, 30.25],
          [75.20, 30.40], [75.30, 30.70],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Mansa", id: "mansa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.85, 30.55], [76.10, 30.50], [76.35, 30.40],
          [76.25, 30.15], [76.00, 30.10], [75.80, 30.20],
          [75.80, 30.35], [75.85, 30.55],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Fazilka", id: "fazilka" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.55, 30.80], [74.85, 30.70], [74.90, 30.50],
          [74.75, 30.25], [74.50, 30.20], [74.35, 30.35],
          [74.40, 30.55], [74.55, 30.80],
        ]],
      },
    },
  ],
};
