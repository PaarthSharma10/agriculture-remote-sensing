import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line, RoundedBox, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { colors, DF, palette, yieldColor } from "../theme";
import { formatCompact, formatNumber } from "../stats";
import { useGrowProgress } from "./anim";

interface Datum {
  label: string;
  value: number;
}

/** Thin base plate with grid lines, shared by the chart components. */
function ChartBase({
  width,
  height,
  gridRows = 4,
}: {
  width: number;
  height: number;
  gridRows?: number;
}) {
  const lines = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= gridRows; i++) {
      const y = (i / gridRows) * height;
      arr.push(-width / 2, y, 0, width / 2, y, 0);
    }
    return arr;
  }, [width, height, gridRows]);
  return (
    <group>
      <mesh position={[0, -0.04, -0.02]} receiveShadow>
        <boxGeometry args={[width + 0.2, 0.08, 0.18]} />
        <meshStandardMaterial color={colors.panelMuted} roughness={0.7} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(lines), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={colors.grid} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

function XLabels({
  labels,
  width,
  y = -0.35,
  showEvery = 1,
}: {
  labels: string[];
  width: number;
  y?: number;
  showEvery?: number;
}) {
  const n = labels.length;
  return (
    <>
      {labels.map((label, i) =>
        i % showEvery === 0 ? (
          <Html key={i} position={[-width / 2 + ((i + 0.5) * width) / n, y, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
            <div className="axis-label">{label}</div>
          </Html>
        ) : null,
      )}
    </>
  );
}

/* ---------------------------------- Bars ---------------------------------- */

export function Bars3D({
  data,
  width = 7,
  height = 3.4,
  unit = "",
  colorMode = "gradient",
}: {
  data: Datum[];
  width?: number;
  height?: number;
  unit?: string;
  colorMode?: "single" | "gradient" | "palette";
}) {
  const n = data.length || 1;
  const spacing = width / n;
  const barW = Math.min(spacing * 0.6, 1.1);
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const showEvery = n > 12 ? 2 : 1;
  return (
    <group>
      <ChartBase width={width} height={height} />
      {data.map((d, i) => {
        const h = (d.value / maxV) * height;
        const x = -width / 2 + (i + 0.5) * spacing;
        const color =
          colorMode === "single"
            ? colors.accent
            : colorMode === "palette"
              ? palette(i)
              : yieldColor(d.value / maxV);
        return (
          <Bar
            key={i}
            position={[x, h / 2, 0]}
            size={[barW, h, barW * 0.8]}
            color={color}
            value={d.value}
            label={d.label}
            unit={unit}
            delay={i * 0.05}
          />
        );
      })}
      <XLabels labels={data.map((d) => d.label)} width={width} showEvery={showEvery} />
    </group>
  );
}

function Bar({
  position,
  size,
  color,
  value,
  label,
  unit,
  delay = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  value: number;
  label: string;
  unit: string;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(delay, 0.5);
  useCursor(hovered);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = hovered ? 1.08 : 1;
    // Grow from the base plate upward, then let hover scale x/z.
    const p = grow.current;
    g.position.y = (bh / 2) * p;
    g.scale.y = Math.max(0.0001, p);
    g.scale.x = THREE.MathUtils.damp(g.scale.x, s, 8, dt);
    g.scale.z = THREE.MathUtils.damp(g.scale.z, s, 8, dt);
  });
  const [bw, bh, bd] = size;
  return (
    <group ref={group} position={position}>
      <RoundedBox
        args={[bw, bh, bd]}
        radius={Math.min(0.06, bw / 4)}
        smoothness={3}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.12}
          roughness={0.5}
        />
      </RoundedBox>
      {hovered && (
        <Html position={[0, bh / 2 + 0.28, 0]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="tooltip">
            <div className="tt-label">{label}</div>
            <div className="tt-value">
              {formatNumber(value)}
              {unit && <span className="tt-unit"> {unit}</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------------------------------- Line ---------------------------------- */

export function LineChart3D({
  data,
  width = 7,
  height = 3.4,
  unit = "",
  color = colors.accent,
}: {
  data: Datum[];
  width?: number;
  height?: number;
  unit?: string;
  color?: string;
}) {
  const n = data.length || 1;
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const minV = Math.min(...data.map((d) => d.value), 0);
  const range = maxV - minV || 1;
  const points: [number, number, number][] = data.map((d, i) => [
    -width / 2 + ((i + 0.5) * width) / n,
    ((d.value - minV) / range) * height * 0.88 + height * 0.04,
    0.06,
  ]);
  const areaPoints: [number, number, number][] = [
    ...points,
    [points[points.length - 1]?.[0] ?? width / 2, 0, 0.05],
    [points[0]?.[0] ?? -width / 2, 0, 0.05],
  ];
  const maxLabel = formatCompact(maxV);
  const showEvery = n > 10 ? 2 : 1;
  return (
    <group>
      <ChartBase width={width} height={height} />
      {/* translucent area fill */}
      <mesh position={[0, 0, 0.04]}>
        <shapeGeometry args={[makeAreaShape(areaPoints)]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={points} color={color} lineWidth={3} />
      {points.map((p, i) => (
        <PointDot key={i} position={p} color={color} label={data[i].label} value={data[i].value} unit={unit} delay={i * 0.04} />
      ))}
      <XLabels labels={data.map((d) => d.label)} width={width} showEvery={showEvery} />
      <Html position={[width / 2 + 0.3, height - 0.3, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">{maxLabel}</div>
      </Html>
    </group>
  );
}

function makeAreaShape(points: [number, number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  return shape;
}

function PointDot({
  position,
  color,
  label,
  value,
  unit,
  delay = 0,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  value: number;
  unit: string;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);
  const grow = useGrowProgress(delay, 0.45);
  useCursor(hovered);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const s = hovered ? 1.6 : 1;
    const k = THREE.MathUtils.damp(m.scale.x, s, 8, dt);
    m.scale.setScalar(Math.max(0.0001, k * grow.current));
  });
  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {hovered && (
        <Html position={[0, 0.32, 0]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="tooltip">
            <div className="tt-label">{label}</div>
            <div className="tt-value">
              {formatNumber(value)}
              {unit && <span className="tt-unit"> {unit}</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* --------------------------------- Donut ---------------------------------- */

export function Donut3D({
  data,
  radius = 1.3,
  tube = 0.34,
  height = 3.4,
}: {
  data: Datum[];
  radius?: number;
  tube?: number;
  height?: number;
}) {
  const total = useMemo(() => data.reduce((a, d) => a + d.value, 0), [data]);
  const segments = useMemo(() => {
    let acc = 0;
    return data.map((d) => {
      const start = acc / total;
      acc += d.value;
      return { ...d, start, frac: d.value / total };
    });
  }, [data, total]);

  return (
    <group position={[0, height / 2, 0.06]}>
      {segments.map((seg, i) => {
        const startAngle = seg.start * Math.PI * 2;
        return (
          <DonutSegment
            key={i}
            radius={radius}
            tube={tube}
            arc={seg.frac * Math.PI * 2}
            startAngle={startAngle}
            color={palette(i)}
            value={seg.value}
            label={seg.label}
            frac={seg.frac}
            delay={i * 0.06}
          />
        );
      })}
      <Html position={[0, 0, 0.05]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="donut-center">
          <div className="dc-total">{formatCompact(total)}</div>
          <div className="dc-label">samples</div>
        </div>
      </Html>
    </group>
  );
}

function DonutSegment({
  radius,
  tube,
  arc,
  startAngle,
  color,
  value,
  label,
  frac,
  delay = 0,
}: {
  radius: number;
  tube: number;
  arc: number;
  startAngle: number;
  color: string;
  value: number;
  label: string;
  frac: number;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(delay, 0.5, true);
  useCursor(hovered);
  const midAngle = startAngle + arc / 2;
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const lift = hovered ? 0.16 : 0;
    const cur = g.position.x;
    g.position.x = THREE.MathUtils.damp(cur, Math.cos(midAngle) * lift, 8, dt);
    const curY = g.position.y;
    g.position.y = THREE.MathUtils.damp(curY, Math.sin(midAngle) * lift, 8, dt);
    g.scale.setScalar(Math.max(0.0001, grow.current));
  });
  const radial = 10;
  const tubular = Math.max(4, Math.ceil(arc / (Math.PI / 24)));
  return (
    <group
      ref={group}
      rotation={[0, 0, startAngle]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <torusGeometry args={[radius, tube, radial, tubular, arc]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.55 : 0.18}
          roughness={0.5}
        />
      </mesh>
      {hovered && (
        <Html position={[0, radius + tube + 0.25, 0]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="tooltip">
            <div className="tt-label">{label}</div>
            <div className="tt-value">
              {formatCompact(value)} · {(frac * 100).toFixed(1)}%
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function DonutLegend({
  data,
  position,
  height = 3.4,
}: {
  data: Datum[];
  position: [number, number, number];
  height?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <group position={position}>
      {data.map((d, i) => (
        <Html key={i} position={[0, height / 2 - 0.4 - i * 0.62, 0.05]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="legend-row">
            <span className="legend-swatch" style={{ background: palette(i) }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-value">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        </Html>
      ))}
    </group>
  );
}

/* -------------------------------- Scatter --------------------------------- */

export function Scatter3D({
  points,
  width = 7,
  height = 3.4,
  unit = "",
}: {
  points: Array<{ actual: number; predicted: number }>;
  width?: number;
  height?: number;
  unit?: string;
}) {
  const maxV = Math.max(...points.map((p) => Math.max(p.actual, p.predicted)), 1);
  const plot = (v: number) => (v / maxV) * height * 0.9 + height * 0.02;
  // Sample points for rendering.
  const sampled = useMemo(() => {
    const max = 350;
    if (points.length <= max) return points;
    const step = Math.ceil(points.length / max);
    return points.filter((_, i) => i % step === 0);
  }, [points]);

  const refLine: [number, number, number][] = [
    [-width / 2, plot(0), 0.03],
    [width / 2, plot(maxV), 0.03],
  ];

  return (
    <group>
      <ChartBase width={width} height={height} gridRows={5} />
      <Line points={refLine} color={colors.textMuted} lineWidth={1.5} dashed dashSize={0.12} gapSize={0.08} />
      {sampled.map((p, i) => {
        const x = -width / 2 + (p.actual / maxV) * width;
        const y = plot(p.predicted);
        const err = Math.abs(p.predicted - p.actual) / Math.max(1, p.actual);
        return (
          <ScatterPoint
            key={i}
            position={[x, y, 0.08]}
            color={err > 0.2 ? colors.danger : err > 0.1 ? colors.warn : colors.accent}
            delay={i * 0.02}
          />
        );
      })}
      <Html position={[-width / 2 - 0.1, height / 2, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">Actual {unit}</div>
      </Html>
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <Html key={i} position={[-width / 2 + f * width, -0.42, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="axis-label">{formatCompact(maxV * f)}</div>
        </Html>
      ))}
      <Html position={[0, height + 0.5, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">Predicted vs Actual</div>
      </Html>
    </group>
  );
}

// Scatter point with grow animation
function ScatterPoint({
  position,
  color,
  delay = 0,
}: {
  position: [number, number, number];
  color: string;
  delay?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const grow = useGrowProgress(delay, 0.4);
  
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    m.scale.setScalar(Math.max(0.0001, grow.current));
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.075, 10, 10]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

/* --------------------------- Reliability diagram --------------------------- */

export function Diagram3D({
  data,
  width = 7,
  height = 3.4,
}: {
  data: Array<{ label: number; value: number }>;
  width?: number;
  height?: number;
}) {
  const plot = (v: number) => (v / 1) * height * 0.9 + height * 0.02;
  const diagLine: [number, number, number][] = [
    [-width / 2, plot(0), 0.03],
    [width / 2, plot(1), 0.03],
  ];
  return (
    <group>
      <ChartBase width={width} height={height} gridRows={5} />
      <Line points={diagLine} color={colors.textMuted} lineWidth={1.5} dashed dashSize={0.12} gapSize={0.08} />
      {data.map((d, i) => {
        const x = -width / 2 + ((i + 0.5) * width) / Math.max(1, data.length);
        const y = plot(Math.max(0, Math.min(1, d.value)));
        return (
          <DiagramPoint
            key={i}
            position={[x, y, 0.08]}
            value={d.value}
            delay={i * 0.05}
          />
        );
      })}
      <Html position={[0, height + 0.5, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">Predicted Confidence vs Observed Frequency</div>
      </Html>
      <Html position={[-width / 2 - 0.1, height / 2, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">Observed</div>
      </Html>
      <Html position={[width / 2, -0.42, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="axis-label strong">Predicted</div>
      </Html>
    </group>
  );
}

// Diagram point with grow animation
function DiagramPoint({
  position,
  value,
  delay = 0,
}: {
  position: [number, number, number];
  value: number;
  delay?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(delay, 0.5, true);
  
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.scale.setScalar(Math.max(0.0001, grow.current));
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 0.22, 0]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="diagram-pt">{(value * 100).toFixed(0)}%</div>
      </Html>
    </group>
  );
}

/* ------------------------------ Big number card ---------------------------- */

export function StatPlate3D({
  position,
  label,
  value,
  color = colors.accent,
  delay = 0.1,
}: {
  position: [number, number, number];
  label: string;
  value: string;
  color?: string;
  delay?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(delay, 0.5, true);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.scale.setScalar(Math.max(0.0001, grow.current));
  });
  return (
    <group ref={group} position={position}>
      <RoundedBox args={[2.9, 1.5, 0.3]} radius={0.1} smoothness={3} receiveShadow>
        <meshStandardMaterial color={colors.panel} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, -0.62, 0.17]}>
        <boxGeometry args={[2.6, 0.06, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html position={[0, 0.15, 0.18]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="stat-plate">
          <div className="sp-value">{value}</div>
          <div className="sp-label">{label}</div>
        </div>
      </Html>
    </group>
  );
}

/* ------------------------------ Multi-line chart --------------------------- */

interface SeriesDef {
  label: string;
  color: string;
  unit?: string;
  data: Datum[];
}

/**
 * Several series overlaid on one shared grid. Every series is normalized to
 * its own 0..1 range so trends across years stay comparable even when the
 * metrics use wildly different units (indices, mm, fractions).
 */
export function MultiLine3D({
  series,
  width = 9,
  height = 3.8,
  legend,
  legendCompact = false,
}: {
  series: SeriesDef[];
  width?: number;
  height?: number;
  legend?: [number, number, number];
  legendCompact?: boolean;
}) {
  const n = Math.max(...series.map((s) => s.data.length), 1);
  const years = series[0]?.data.map((d) => d.label) ?? [];
  const showEvery = n > 10 ? 2 : 1;
  return (
    <group>
      <ChartBase width={width} height={height} />
      {series.map((s) => {
        const values = s.data.map((d) => d.value);
        const minV = Math.min(...values);
        const maxV = Math.max(...values);
        const range = maxV - minV || 1;
        const points: [number, number, number][] = s.data.map((d, i) => [
          -width / 2 + ((i + 0.5) * width) / n,
          ((d.value - minV) / range) * height * 0.86 + height * 0.05,
          0.05,
        ]);
        return (
          <group key={s.label}>
            <Line points={points} color={s.color} lineWidth={2.2} transparent opacity={0.9} />
            {points.map((p, i) => (
              <PointDot
                key={i}
                position={p}
                color={s.color}
                label={`${s.label} · ${s.data[i].label}`}
                value={s.data[i].value}
                unit={s.unit ?? ""}
                delay={i * 0.03}
              />
            ))}
          </group>
        );
      })}
      <XLabels labels={years} width={width} showEvery={showEvery} />
      {legend && (
        <group position={legend}>
          {series.map((s, i) => (
            <Html key={s.label} position={[0, -i * 0.62, 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
              <div className={`legend-row${legendCompact ? " compact" : ""}`}>
                <span className="legend-swatch" style={{ background: s.color }} />
                <span className="legend-label">{s.label}</span>
              </div>
            </Html>
          ))}
        </group>
      )}
    </group>
  );
}