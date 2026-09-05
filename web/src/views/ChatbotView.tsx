/**
 * ChatbotView.tsx — AI agricultural assistant with multiple free API providers.
 *
 * PURPOSE:
 *   Provides a conversational AI interface for farmers and researchers to ask
 *   questions about crops, yields, soil, climate, and farming practices.
 *
 * API SUPPORT (5 providers):
 *   1. Google Gemini — FREE tier (1,500 req/day). Key starts with "AI" from ai.google.dev
 *   2. Groq — FREE tier (fast inference). Key starts with "gsk_" from console.groq.com
 *   3. OpenRouter — FREE models available. Key starts with "sk-or-" from openrouter.ai
 *   4. xAI Grok — Paid. Key starts with "xai-" from console.x.ai
 *   5. OpenAI — Paid. Key starts with "sk-" from platform.openai.com
 *   6. Built-in knowledge — Fallback when no API key is provided
 *
 * DESIGN:
 *   • Natural, conversational tone (not mechanical)
 *   • Context-aware responses referencing dashboard data
 *   • Quick-action chips for common questions
 *   • Message history with smooth scrolling
 */

import { useState, useRef, useEffect } from "react";
import { type Lang } from "../i18n";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

type Provider = "gemini" | "groq" | "openrouter" | "grok" | "openai" | "builtin";

interface ProviderInfo {
  id: Provider;
  name: string;
  icon: string;
  color: string;
  free: boolean;
  url: string;
  model: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: "gemini", name: "Google Gemini", icon: "✨", color: "#4285f4", free: true, url: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.0-flash" },
  { id: "groq", name: "Groq", icon: "⚡", color: "#f55036", free: true, url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "openrouter", name: "OpenRouter", icon: "🔀", color: "#6366f1", free: true, url: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { id: "grok", name: "xAI Grok", icon: "🤖", color: "#1d9bf0", free: false, url: "https://api.x.ai/v1", model: "grok-3" },
  { id: "openai", name: "OpenAI", icon: "🧠", color: "#10a37f", free: false, url: "https://api.openai.com/v1", model: "gpt-3.5-turbo" },
];

const AGRI_SYSTEM = `You are KisanAI, a warm, knowledgeable agricultural assistant for the Agri RS Crop Yield Prediction & Analytics dashboard, specializing in Punjab, India.

Your personality:
- Friendly and conversational, like a knowledgeable farming advisor
- Use simple language a farmer can understand
- Be encouraging and practical
- Share relevant data from the dashboard when answering
- Use emojis naturally but don't overdo them
- If unsure, say so honestly rather than making things up

You help with:
- 🌾 Crop selection based on soil, climate, and conditions (100+ crops in database)
- 📊 Yield prediction interpretation (model R²=0.87, MAE ~1979 kg/ha)
- 🗺️ Punjab district-specific advice (22 districts, diverse agro-climatic zones)
- 🛰️ Remote sensing indices (NDVI, NDWI, EVI) interpretation
- 🌦️ Seasonal planning (Kharif Jun-Oct, Rabi Nov-Apr)
- 🧪 Soil health, NPK fertilization, and irrigation
- 🐛 Disease/pest management for Punjab crops
- 💰 Market trends and crop economics
- 🌱 Sustainability and conservation agriculture

Keep responses concise (3-5 paragraphs max), practical, and grounded in Indian agriculture.
Use metric units (kg/ha, mm, °C).
When giving numbers, reference the actual dashboard data when possible.`;

/** Expanded built-in knowledge with conversational tone. */
const KNOWLEDGE: Record<string, string> = {
  default: "Hey there! 👋 I'm KisanAI, your farming companion for Punjab agriculture.\n\nI can help you with:\n• 🌾 Which crops to grow and where\n• 📊 Understanding yield data and predictions\n• 🛰️ Reading satellite imagery (NDVI/NDWI/EVI)\n• 🌍 Soil health and fertilization tips\n• 🗺️ District-specific farming advice\n\nJust ask me anything — whether it's about wheat sowing, paddy water management, or which district grows the best cotton!",
  yield: "Great question! Let me break down our model's performance for you 📊\n\nWe trained on **15,000 samples** from 2021–2025 across all 22 Punjab districts. Here's how the model performs:\n\n• **R² = 0.87** — This means we explain 87% of yield variation, which is pretty solid for agricultural data\n• **MAE ≈ 1,979 kg/ha** — On average, predictions are off by about 2 tonnes per hectare\n• **RMSE ≈ 6,870 kg/ha** — Some larger errors exist, mainly for high-yield crops like sugarcane\n\n**Average yields by major crop:**\n🌾 Wheat: ~4,400 kg/ha | 🍚 Paddy: ~4,300 kg/ha\n🌱 Cotton: ~2,100 kg/ha | 🎋 Sugarcane: ~72,000 kg/ha\n\nHead over to the **Predictions tab** to filter by crop, district, or year — you'll see the actual vs predicted scatter plot!",
  crop: "🌾 Choosing the right crop depends on your location, season, and soil! Here's a quick guide for Punjab:\n\n**Kharif (Jun–Oct) season:**\nPaddy 🍚, Cotton 👕, Maize 🌽, Soybean, Bajra, Moong, Urad\n\n**Rabi (Nov–Apr) season:**\nWheat 🌾, Mustard 🟡, Barley, Chana, Peas, Linseed\n\n**Cash crops:**\nSugarcane 🎋 (high yield ~72,000 kg/ha), Cotton\n\n💡 **Pro tip:** Check the **Crop Fit tab** — enter your soil pH, moisture, temperature, and rainfall, and it'll rank 100+ crops by suitability for your exact location!\n\nAlso, crop rotation is key. Wheat → Moong → Cotton is a popular 3-year rotation in Punjab.",
  soil: "🌍 Soil health is the foundation of good farming! Here's what you need to know for Punjab:\n\n**Ideal pH range:** 6.0–7.5 for most crops\n**NPK balance:**\n• Nitrogen (N): 60–80 kg/ha for wheat\n• Phosphorus (P): 20–40 kg/ha\n• Potassium (K): 20–40 kg/ha\n\n**Soil moisture:** Our dataset shows Punjab soils typically range from 0.12 to 0.47 volumetric moisture.\n\n**Best practices:**\n🌱 Use green manuring (Berseem or Moong) between seasons\n🔄 Rotate Kharif/Rabi crops to prevent nutrient depletion\n🧪 Test soil every 2–3 years\n📡 Use the **Maps tab** — switch to NDWI mode to monitor soil moisture across districts!\n\nFor the **Crop Fit tab**, enter your actual soil readings and it'll recommend the best crops.",
  weather: "🌦️ Punjab's weather shapes the entire farming calendar! Here's the breakdown:\n\n**Kharif season (Jun–Oct) — Monsoon:**\n• Rainfall: 600–1,200 mm\n• Temperature: 25–35°C\n• Perfect for: Paddy, Cotton, Maize\n\n**Rabi season (Nov–Apr) — Winter:**\n• Rainfall: 200–400 mm\n• Temperature: 10–25°C\n• Perfect for: Wheat, Mustard, Peas\n\n**Annual rainfall:** ~650 mm average\n**Temperature range:** 18–32°C across the year\n\n📊 Check the **Environment tab** for multi-year climate trends with NDVI, NDWI, EVI, rainfall, and soil moisture charts!\n\n🌧️ Tip: Too much rain (>1,200mm) during Kharif can actually hurt yields. Our model captures this — the rain penalty kicks in above 1,200mm.",
  ndvi: "🛰️ Satellite indices are like a health check-up for your crops! Here's how to read them:\n\n**NDVI (Vegetation Health):**\n• > 0.6 = Healthy, dense crops 💚\n• 0.4–0.6 = Good condition\n• 0.2–0.4 = Stressed or sparse 🟡\n• < 0.2 = Bare soil or dead crops 🔴\n\n**NDWI (Water Content):**\n• Positive = Good moisture 💧\n• Negative = Dry stress\n\n**EVI (Enhanced Vegetation):**\n• Better than NDVI for dense canopies\n• Less affected by soil and atmosphere\n\n🗺️ Open the **Maps tab**, select 'NDVI' mode, and you'll see a color-coded map of all 22 Punjab districts! Click any district for detailed stats.\n\nIf NDVI drops below 0.4 in your area during peak season, it's time to check irrigation!",
  districts: "🗺️ Punjab has **22 districts** across 3 main regions, each with unique farming characteristics:\n\n**Malwa region (South Punjab):**\nBathinda, Mansa, Muktsar, Fazilka, Faridkot, Moga, Firozpur\n→ Known for: Cotton, wheat, and increasingly medicinal crops\n\n**Doaba region (Central-East):**\nJalandhar, Kapurthala, Hoshiarpur, Shahid Bhagat Singh Nagar\n→ Known for: Rice, wheat, vegetables, and dairy farming\n\n**Majha region (North Punjab):**\nAmritsar, Tarn Taran, Gurdaspur, Pathankot\n→ Known for: Wheat, rice, and cross-border trade crops\n\n**Central Punjab:**\nLudhiana, Patiala, Sangrur, Barnala, Fatehgarh Sahib, Rupnagar, S.A.S. Nagar\n→ The breadbasket — highest wheat and rice production\n\n📊 Use the **Districts tab** to compare stats across districts!",
  wheat: "🌾 **Wheat — Punjab's Rabi King!**\n\n**Growing season:** November → April (Rabi)\n**Sowing:** Mid-November to mid-December\n**Harvest:** March–April\n\n**Ideal conditions:**\n🌡️ Temp: 10–25°C\n💧 Water: 400–800mm total\n🌍 pH: 6.0–7.5\n🧪 NPK: 60-30-30 kg/ha\n\n**Top districts:** Ludhiana 🥇, Patiala, Sangrur, Amritsar\n**Average yield:** ~4,400 kg/ha\n\n**Improved varieties:** HD-3226, PBW-723, WH-1270\n\n💡 **Tips:**\n• Sow before Dec 15 for best yields\n• Use zero-till sowing to save time and moisture\n• Apply second irrigation at crown root initiation stage\n• Our model shows wheat yields improving ~1.5% year over year!",
  rice: "🌾 **Rice (Paddy) — Punjab's Kharif Staple!**\n\n**Growing season:** June → October (Kharif)\n**Sowing:** Mid-June (with monsoon)\n**Harvest:** October–November\n\n**Ideal conditions:**\n🌡️ Temp: 20–35°C\n💧 Water: 1,000–2,000mm (water-intensive!)\n🌍 pH: 5.5–7.0\n🧪 NPK: 40-25-25 kg/ha\n\n**Top districts:** Ludhiana 🥇, Jalandhar, Kapurthala, Gurdaspur\n**Average yield:** ~4,300 kg/ha\n\n⚠️ **Important:** Rice is water-intensive and depletes Punjab's groundwater. The government promotes:\n• **Direct Seeded Rice (DSR)** — saves 20-25% water\n• **Basmati varieties** — higher value, lower water\n• **Paddy straw management** — burning is banned\n\nOur model shows paddy yields stable at ~4,300 kg/ha with slight year-over-year improvement.",
};

/** Match user input to best built-in response. */
function findResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/\b(yield|production|mae|r2|rmse|score|accuracy|model)\b/)) return KNOWLEDGE.yield;
  if (lower.match(/\b(crop|grow|plant|which crop|sow|kharif|rabi|seed)\b/)) return KNOWLEDGE.crop;
  if (lower.match(/\b(soil|fertiliz|nutrient|npk|ph|manure|compost)\b/)) return KNOWLEDGE.soil;
  if (lower.match(/\b(rain|weather|climate|temperature|monsoon|irrigat|water)\b/)) return KNOWLEDGE.weather;
  if (lower.match(/\b(ndvi|ndwi|evi|vegetation|satellite|remote|imagery|index)\b/)) return KNOWLEDGE.ndvi;
  if (lower.match(/\b(district|region|malwa|doaba|majha|ludhiana|amritsar|patiala)\b/)) return KNOWLEDGE.districts;
  if (lower.match(/\b(wheat|gehu|kanak)\b/)) return KNOWLEDGE.wheat;
  if (lower.match(/\b(rice|paddy|dhaan|chaawal)\b/)) return KNOWLEDGE.rice;
  return KNOWLEDGE.default;
}

const QUICK_CHIPS = [
  "Which crop is best for Ludhiana?",
  "What does NDVI > 0.6 mean?",
  "Compare wheat and rice yields",
  "Soil tips for Bathinda",
];

export function ChatbotView(_props: { lang: Lang }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey there! 👋 I'm **KisanAI**, your AI farming companion for Punjab agriculture.\n\nI can help you with:\n• 🌾 Choosing the right crop for your area\n• 📊 Understanding yield predictions & model data\n• 🛰️ Reading satellite imagery (NDVI/NDWI/EVI)\n• 🌍 Soil health & fertilization advice\n• 🗺️ District-specific farming tips\n\nAsk me anything! I work with built-in knowledge, or connect a **free API key** for even smarter answers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("builtin");
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("agri_chat_key") ?? ""; } catch { return ""; }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /** Auto-detect provider from key prefix. */
  const detectProvider = (key: string): Provider => {
    if (!key) return "builtin";
    if (key.startsWith("AI")) return "gemini";
    if (key.startsWith("gsk_")) return "groq";
    if (key.startsWith("sk-or-")) return "openrouter";
    if (key.startsWith("xai-")) return "grok";
    if (key.startsWith("sk-")) return "openai";
    return provider === "builtin" ? "gemini" : provider;
  };

  const handleKeyChange = (newKey: string) => {
    setApiKey(newKey);
    const detected = detectProvider(newKey);
    setProvider(detected);
    try { localStorage.setItem("agri_chat_key", newKey); } catch {}
  };

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    if (p !== "builtin" && !apiKey) {
      // Don't clear, just set mode
    }
  };

  /** Send message to the selected API or built-in knowledge. */
  const send = async (quickText?: string) => {
    const text = (quickText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const activeProvider = detectProvider(apiKey);
      const pInfo = PROVIDERS.find((p) => p.id === activeProvider);

      if (pInfo && apiKey) {
        let reply: string | null = null;

        if (activeProvider === "gemini") {
          // Google Gemini uses different API format
          const contents = [
            ...messages.slice(-10).map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            { role: "user", parts: [{ text }] },
          ];
          const res = await fetch(
            `${pInfo.url}/models/${pInfo.model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: AGRI_SYSTEM }] },
                contents,
                generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          }
        } else {
          // OpenAI-compatible providers (Groq, OpenRouter, Grok, OpenAI)
          const res = await fetch(`${pInfo.url}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: pInfo.model,
              messages: [
                { role: "system", content: AGRI_SYSTEM },
                ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
                userMsg,
              ],
              max_tokens: 600,
              temperature: 0.7,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.choices?.[0]?.message?.content ?? null;
          }
        }

        if (reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: reply! }]);
          setLoading(false);
          return;
        }
      }

      // Fallback to built-in knowledge
      setMessages((prev) => [...prev, { role: "assistant", content: findResponse(text) }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: findResponse(text) }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      {/* Synopsis */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #bbf7d0", marginBottom: 10 }}>
        <div className="card-body" style={{ padding: "8px 14px", fontSize: 11, color: "#166534", lineHeight: 1.6 }}>
          <b>🤖 KisanAI</b> — Conversational AI assistant for Punjab agriculture. Supports 5 providers including
          <span style={{ color: "#4285f4", fontWeight: 600 }}> Google Gemini (free)</span>,
          <span style={{ color: "#f55036", fontWeight: 600 }}> Groq (free)</span>, and
          <span style={{ color: "#6366f1", fontWeight: 600 }}> OpenRouter (free models)</span>.
          Get a free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: "#4285f4" }}>ai.google.dev</a> or <a href="https://console.groq.com" target="_blank" rel="noopener" style={{ color: "#f55036" }}>console.groq.com</a>.
        </div>
      </div>

      {/* Provider selector + API key */}
      <div className="filter-bar" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              style={{
                padding: "3px 8px", border: `1px solid ${p.color}`, borderRadius: 4,
                background: provider === p.id ? p.color : "transparent",
                color: provider === p.id ? "#fff" : p.color,
                fontSize: 10, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              {p.icon} {p.name} {p.free && <span style={{ fontSize: 8, opacity: 0.8 }}>FREE</span>}
            </button>
          ))}
          {provider === "builtin" && (
            <button
              onClick={() => setProvider("builtin")}
              style={{
                padding: "3px 8px", border: "1px solid #9ca3af", borderRadius: 4,
                background: provider === "builtin" ? "#6b7280" : "transparent",
                color: provider === "builtin" ? "#fff" : "#6b7280",
                fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}
            >
              📚 Built-in
            </button>
          )}
        </div>
        <div style={{ flex: 1 }} />
        {provider !== "builtin" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="password"
              placeholder={PROVIDERS.find((p) => p.id === provider)?.free ? "Paste free API key..." : "API key..."}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              style={{
                padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 4,
                fontSize: 11, width: 200, outline: "none",
              }}
            />
            {apiKey && <span style={{ fontSize: 10, color: "#22c55e" }}>✓</span>}
          </div>
        )}
        {provider === "builtin" && (
          <span style={{ fontSize: 10, color: "#9ca3af" }}>No API key needed — uses built-in knowledge</span>
        )}
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} className="scale-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap",
                background: msg.role === "user" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#f3f4f6",
                color: msg.role === "user" ? "#fff" : "#374151",
                borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                borderBottomLeftRadius: msg.role === "user" ? 12 : 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "10px 14px", borderRadius: 12, background: "#f3f4f6",
                fontSize: 12, color: "#9ca3af",
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                {provider !== "builtin" ? `${PROVIDERS.find((p) => p.id === detectProvider(apiKey))?.name ?? "AI"} is thinking...` : "Thinking..."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips (show if only 1-2 messages) */}
        {messages.length <= 2 && (
          <div style={{ padding: "0 14px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                style={{
                  padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 12,
                  background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#22c55e"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 10, borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
          <input
            className="filter-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Ask about crops, yields, soil, weather..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
