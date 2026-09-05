/**
 * useWeather.ts — Hook for fetching live weather from Open-Meteo API.
 *
 * PURPOSE:
 *   Provides current weather data (temperature, humidity, rainfall, wind)
 *   for Punjab districts. Open-Meteo is completely free with no API key needed.
 *
 * API: https://api.open-meteo.com/v1/forecast
 * Rate limit: 10,000 requests/day (more than enough)
 */

import { useState, useEffect, useMemo } from "react";

interface DistrictWeather {
  district: string;
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  description: string;
  icon: string;
}

/** Approximate coordinates for Punjab districts. */
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Amritsar": [31.63, 74.87],
  "Barnala": [30.38, 75.55],
  "Bathinda": [30.21, 74.95],
  "Faridkot": [30.67, 74.76],
  "Fatehgarh Sahib": [30.68, 76.30],
  "Fazilka": [30.41, 74.50],
  "Firozpur": [30.92, 74.62],
  "Gurdaspur": [32.04, 75.40],
  "Hoshiarpur": [31.51, 75.91],
  "Jalandhar": [31.33, 75.58],
  "Kapurthala": [31.38, 75.40],
  "Ludhiana": [30.90, 75.86],
  "Mansa": [29.99, 75.40],
  "Moga": [30.82, 75.17],
  "Muktsar": [30.48, 74.52],
  "Pathankot": [32.27, 75.65],
  "Patiala": [30.34, 76.39],
  "Rupnagar": [30.98, 76.53],
  "Sangrur": [30.25, 75.84],
  "Shahid Bhagat Singh Nagar": [31.12, 76.04],
  "Tarn Taran": [31.45, 74.93],
};

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
};

const WMO_ICONS: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "❄️", 73: "❄️", 75: "❄️",
  80: "🌦️", 81: "🌧️", 82: "⛈️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export function useWeather(districts?: string[]) {
  const [weather, setWeather] = useState<Map<string, DistrictWeather>>(new Map());
  const [loading, setLoading] = useState(false);

  const targetDistricts = useMemo(
    () => districts ?? Object.keys(DISTRICT_COORDS).slice(0, 5),
    [districts]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      const results = new Map<string, DistrictWeather>();

      // Batch: fetch all districts in parallel (max 5 to respect rate limits)
      const promises = targetDistricts.map(async (district) => {
        const coords = DISTRICT_COORDS[district];
        if (!coords) return;
        try {
          const [lat, lon] = coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code`
          );
          if (!res.ok) return;
          const data = await res.json();
          const c = data.current;
          const wmoCode = c.weather_code ?? 0;
          results.set(district, {
            district,
            temp: Math.round(c.temperature_2m),
            humidity: Math.round(c.relative_humidity_2m),
            rainfall: Math.round(c.precipitation * 10) / 10,
            windSpeed: Math.round(c.wind_speed_10m),
            description: WMO_DESCRIPTIONS[wmoCode] ?? "Unknown",
            icon: WMO_ICONS[wmoCode] ?? "🌡️",
          });
        } catch { /* skip failed district */ }
      });

      await Promise.allSettled(promises);
      if (!cancelled) {
        setWeather(results);
        setLoading(false);
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, [targetDistricts.join(",")]);

  return { weather, loading };
}
