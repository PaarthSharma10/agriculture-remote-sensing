/**
 * Skeleton.tsx — Loading skeleton placeholders for dashboard views.
 *
 * PURPOSE:
 *   Shows animated shimmer placeholders matching each tab's layout
 *   while data loads. Feels faster than a spinner.
 *
 * USAGE:
 *   <SkeletonCards count={4} />
 *   <SkeletonTable rows={5} cols={4} />
 *   <SkeletonChart height={200} />
 */

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer" style={{
          height: 100, borderRadius: 10, background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%", animation: `shimmer 1.5s infinite ${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="shimmer" style={{
              flex: j === 0 ? 2 : 1, height: 28, borderRadius: 4,
              background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%", animation: `shimmer 1.5s infinite ${(i * cols + j) * 0.05}s`,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="shimmer" style={{
      height, borderRadius: 10,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
    }} />
  );
}
