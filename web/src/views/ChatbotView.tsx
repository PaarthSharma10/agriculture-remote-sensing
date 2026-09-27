/**
 * ChatbotView.tsx — AI Assistant: data-grounded, multilingual (EN / हिन्दी / ਪੰਜਾਬੀ).
 *
 * Built-in answers are COMPUTED from the loaded dataset (samples + predictions)
 * via chatbot.ts, so quoted numbers always match the other tabs. Replies render
 * as markdown, UI strings and responses are localized in EN/HI/PA, and input
 * detection understands Devanagari/Gurmukhi queries in any reply language.
 * When the user plugs in an API key (Gemini/Groq/OpenRouter/Grok/OpenAI), a
 * dataset snapshot is injected into the system prompt for grounded LLM answers.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { t, type Lang, LANGUAGES } from "../i18n";
import {
  answer, buildDatasetStats, withMedian, summarizeForLLM, AGRI_SYSTEM_PROMPT,
  type ChatContext, type ChatReply,
} from "../chatbot";
import type { Prediction, Sample } from "../types";

interface Message extends ChatReply {
  role: "user" | "assistant";
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

/** Minimal markdown → JSX: ### headers, **bold**, • bullets, paragraphs. */
function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          return <div key={i} style={{ fontWeight: 700, fontSize: 13, margin: "2px 0" }}>{inlineMd(block.slice(4))}</div>;
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("•"))) {
          return (
            <ul key={i} style={{ margin: "2px 0", paddingLeft: 18 }}>
              {lines.map((l, j) => <li key={j} style={{ margin: "2px 0" }}>{inlineMd(l.trim().slice(1).trim())}</li>)}
            </ul>
          );
        }
        return <p key={i} style={{ margin: "2px 0" }}>{inlineMd(block)}</p>;
      })}
    </>
  );
}

function inlineMd(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4
      ? <b key={i}>{p.slice(2, -2)}</b>
      : p.startsWith("*") && p.endsWith("*") && p.length > 2
      ? <i key={i}>{p.slice(1, -1)}</i>
      : <span key={i}>{p}</span>
  );
}

export function ChatbotView(props: {
  lang: Lang;
  setLang: (l: Lang) => void;
  samples: Sample[];
  predictions: Prediction[];
}) {
  const { lang, setLang, samples, predictions } = props;
  const ctx = useMemo<ChatContext>(() => ({ samples, predictions }), [samples, predictions]);
  const stats = useMemo(
    () => withMedian(buildDatasetStats({ samples, predictions }), samples),
    [samples, predictions],
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("builtin");
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("agri_chat_key") ?? ""; } catch { return ""; }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Greeting follows the selected language (dataset-grounded numbers included).
  useEffect(() => {
    setMessages([{ role: "assistant", content: "", ...answer("", ctx, stats, lang) }]);
  }, [lang, stats, ctx]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

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
    setProvider(detectProvider(newKey));
    try { localStorage.setItem("agri_chat_key", newKey); } catch { /* ignore */ }
  };

  /** Call the selected LLM provider; returns null on failure. */
  const callProvider = async (history: Message[], text: string): Promise<string | null> => {
    const pInfo = PROVIDERS.find((p) => p.id === provider);
    if (!pInfo || !apiKey) return null;
    const system = `${AGRI_SYSTEM_PROMPT}\n\nDATASET SNAPSHOT (ground every number in this):\n${summarizeForLLM(stats)}`;
    const historyMessages = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    try {
      if (provider === "gemini") {
        const contents = [
          ...historyMessages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text }] },
        ];
        const res = await fetch(`${pInfo.url}/models/${pInfo.model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      }
      const res = await fetch(`${pInfo.url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: pInfo.model,
          messages: [{ role: "system", content: system }, ...historyMessages, { role: "user", content: text }],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  };

  const send = async (quickText?: string) => {
    const text = (quickText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text, topic: "fallback", markdown: "", followUps: [] };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    let reply: Message | null = null;
    if (provider !== "builtin" && apiKey) {
      const llmText = await callProvider(messages, text);
      if (llmText) {
        reply = {
          role: "assistant", content: llmText, topic: "fallback", markdown: llmText,
          followUps: [
            lang === "hi" ? "किस जिले की उपज सबसे ज़्यादा है?" : lang === "pa" ? "ਕਿਸ ਜ਼ਿਲ੍ਹੇ ਦਾ ਝਾੜ ਸਭ ਤੋਂ ਵੱਧ ਹੈ?" : "Which district has the highest yield?",
            lang === "hi" ? "मॉडल कितना सटीक है?" : lang === "pa" ? "ਮਾਡਲ ਕਿੰਨਾ ਸਹੀ ਹੈ?" : "How accurate is the model?",
          ],
        };
      }
    }
    if (!reply) reply = { role: "assistant", content: "", ...answer(text, ctx, stats, lang) };
    setMessages([...history, reply]);
    setLoading(false);
  };

  const lastFollowUps = [...messages].reverse().find((m) => m.role === "assistant" && m.followUps.length > 0)?.followUps ?? [];

  const providerBtn = (p: Provider, label: string, color: string, icon: string, free?: boolean) => (
    <button
      key={p}
      onClick={() => setProvider(p)}
      style={{
        padding: "3px 8px", border: `1px solid ${color}`, borderRadius: 4,
        background: provider === p ? color : "transparent",
        color: provider === p ? "#fff" : color,
        fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      {icon} {label}{free ? <span style={{ fontSize: 8, opacity: 0.8 }}> FREE</span> : null}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      {/* Synopsis */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-body" style={{ padding: "8px 14px", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <b>🤖 {t("chat.title", lang)}</b> — {t("chat.about", lang)}
        </div>
      </div>

      {/* Toolbar: language, providers, API key */}
      <div className="filter-bar" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={l.label}
              style={{
                padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 4,
                background: lang === l.code ? "var(--accent)" : "transparent",
                color: lang === l.code ? "#fff" : "var(--text-muted)",
                fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: "var(--border)" }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {providerBtn("builtin", t("chat.builtin", lang), "#6b7280", "📚")}
          {providerBtn("gemini", "Gemini", "#4285f4", "✨", true)}
          {providerBtn("groq", "Groq", "#f55036", "⚡", true)}
          {providerBtn("openrouter", "OpenRouter", "#6366f1", "🔀", true)}
          {providerBtn("grok", "Grok", "#1d9bf0", "🤖")}
          {providerBtn("openai", "OpenAI", "#10a37f", "🧠")}
        </div>
        {provider !== "builtin" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="password"
              placeholder={PROVIDERS.find((p) => p.id === provider)?.free ? t("chat.keyFree", lang) : t("chat.keyAny", lang)}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, width: 200, outline: "none", background: "var(--bg-card)", color: "var(--text)" }}
            />
            {apiKey && <span style={{ fontSize: 10, color: "#22c55e" }}>✓</span>}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} className="scale-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                fontSize: 12.5, lineHeight: 1.65,
                background: msg.role === "user" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "var(--bg-hover)",
                color: msg.role === "user" ? "#fff" : "var(--text)",
                borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                borderBottomLeftRadius: msg.role === "user" ? 12 : 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
                {msg.role === "user" ? msg.content : <MarkdownLite text={msg.markdown} />}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div className="card" style={{ padding: "10px 14px", borderRadius: 12, fontSize: 12, color: "var(--text-dim)", background: "var(--bg-hover)" }}>
                {t("chat.thinking", lang)}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Follow-up chips from the last assistant reply */}
        {lastFollowUps.length > 0 && !loading && (
          <div style={{ padding: "0 14px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lastFollowUps.slice(0, 4).map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                style={{
                  padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 12,
                  background: "var(--bg-card)", color: "var(--text)", fontSize: 11, cursor: "pointer",
                }}
              >
                {chip}
              </button>
            ))}
            <button
              onClick={() => setMessages([{ role: "assistant", content: "", ...answer("", ctx, stats, lang) }])}
              style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-card)", color: "var(--text-dim)", fontSize: 11, cursor: "pointer" }}
            >
              ↺
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <input
            className="filter-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder={t("chat.placeholder", lang)}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? "…" : t("chat.send", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
