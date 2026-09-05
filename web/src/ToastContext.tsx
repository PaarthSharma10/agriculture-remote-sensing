/**
 * ToastContext.tsx — Lightweight toast notification system.
 *
 * PURPOSE:
 *   Provides a global toast notification API that any component can use
 *   to show temporary success/error/info messages.
 *
 * USAGE:
 *   const { toast } = useToast();
 *   toast("Export complete!", "success");
 *   toast("Failed to load data", "error");
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, visible: true }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
    timerRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    return () => { timerRef.current.forEach((t) => clearTimeout(t)); };
  }, []);

  const ICONS = { success: "✅", error: "❌", info: "ℹ️" };
  const COLORS = { success: "#059669", error: "#dc2626", info: "#2563eb" };
  const BGS = { success: "#ecfdf5", error: "#fef2f2", info: "#eff6ff" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "10px 16px", borderRadius: 8,
              background: BGS[t.type], color: COLORS[t.type],
              border: `1px solid ${COLORS[t.type]}33`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: 13, fontWeight: 500,
              transform: t.visible ? "translateX(0)" : "translateX(120%)",
              opacity: t.visible ? 1 : 0,
              transition: "all 0.3s ease",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span>{ICONS[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
