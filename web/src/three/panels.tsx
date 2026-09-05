import { useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { colors, DF } from "../theme";
import type { TabDef, TabId } from "../types";
import { useGrowProgress } from "./anim";

const PANEL_DEPTH = 0.4;

/** Rough screen-pixel ↔ world-unit conversion used by DOM overlays (see TableOverlay). */
const PX_PER_UNIT = 30;

interface Panel3DProps {
  position: [number, number, number];
  size: [number, number];
  title?: string;
  subtitle?: string;
  accent?: string;
  tilt?: number;
  /** Stagger in seconds before the panel starts growing in (tab load). */
  growDelay?: number;
  children?: ReactNode;
  overlay?: ReactNode;
  onHover?: (hovered: boolean) => void;
}

/** White floating panel with depth, a colored accent bar, title and 3D content. */
export function Panel3D({
  position,
  size,
  title,
  subtitle,
  accent = colors.accent,
  tilt = 0,
  growDelay = 0,
  children,
  overlay,
  onHover,
}: Panel3DProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(growDelay, 0.5, true);
  const hoverScale = useRef(1);
  useCursor(hovered);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const targetY = position[1] + (hovered ? 0.22 : 0);
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 6, dt);
    hoverScale.current = THREE.MathUtils.damp(hoverScale.current, hovered ? 1.012 : 1, 6, dt);
    // Smooth grow-in on tab load, combined with the hover scale.
    g.scale.setScalar(Math.max(0.0001, grow.current * hoverScale.current));
  });

  const [w, h] = size;

  return (
    <group ref={group} position={position} rotation={[0, tilt, 0]}>
      <RoundedBox
        args={[w, h, PANEL_DEPTH]}
        radius={0.14}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(false);
        }}
      >
        <meshStandardMaterial
          color={hovered ? "#f6fbf8" : colors.panel}
          roughness={0.55}
          metalness={0.04}
        />
      </RoundedBox>
      {/* Accent strip at the top edge */}
      <mesh position={[0, h / 2 - 0.16, PANEL_DEPTH / 2 + 0.005]}>
        <boxGeometry args={[w - 0.6, 0.1, 0.03]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {title && (
        <Html position={[0, h / 2 - 0.52, PANEL_DEPTH / 2 + 0.02]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="panel-heading" style={{ width: `${Math.round(w * PX_PER_UNIT)}px` }}>
            <div className="panel-title">{title}</div>
            {subtitle && <div className="panel-subtitle">{subtitle}</div>}
          </div>
        </Html>
      )}
      {overlay && (
        <Html position={[0, 0, PANEL_DEPTH / 2 + 0.03]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          {overlay}
        </Html>
      )}
      {children}
    </group>
  );
}

interface MetricCard3DProps {
  position: [number, number, number];
  size?: [number, number];
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  accent?: string;
  onClick?: () => void;
  growDelay?: number;
}

/** Floating stat card with a 3D base and a DOM value label. */
export function MetricCard3D({
  position,
  size = [3.4, 2.1],
  label,
  value,
  sub,
  icon,
  accent = colors.accent,
  onClick,
  growDelay = 0.05,
}: MetricCard3DProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(growDelay, 0.5, true);
  useCursor(hovered);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.y = THREE.MathUtils.damp(g.position.y, position[1] + (hovered ? 0.18 : 0), 6, dt);
    g.scale.setScalar(Math.max(0.0001, grow.current));
  });
  const [w, h] = size;
  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <RoundedBox
        args={[w, h, PANEL_DEPTH]}
        radius={0.12}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? "#f2faf5" : colors.panel}
          roughness={0.5}
          metalness={0.05}
        />
      </RoundedBox>
      {/* Left accent edge */}
      <mesh position={[-w / 2 + 0.1, 0, PANEL_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[0.12, h - 0.5, 0.04]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <Html position={[0, 0.28, PANEL_DEPTH / 2 + 0.02]} distanceFactor={DF} center>
        <div
          className="metric-card"
          style={{ width: `${Math.round(w * PX_PER_UNIT)}px` }}
          onClick={onClick}
        >
          {icon && <span className="metric-icon">{icon}</span>}
          <div className="metric-value">{value}</div>
          <div className="metric-label">{label}</div>
          {sub && <div className="metric-sub">{sub}</div>}
        </div>
      </Html>
    </group>
  );
}

interface Sidebar3DProps {
  position: [number, number, number];
  tabs: TabDef[];
  active: TabId;
  onSelect: (id: TabId) => void;
}

/** Dark-green 3D sidebar with tappable nav buttons. */
export function Sidebar3D({ position, tabs, active, onSelect }: Sidebar3DProps) {
  const w = 3.4;
  // Squeeze items slightly when there are many tabs so everything stays on the rail.
  const itemH = tabs.length > 10 ? 0.56 : 0.66;
  const gap = tabs.length > 10 ? 0.08 : 0.12;
  const topY = 8.6;
  const listH = tabs.length * itemH + (tabs.length - 1) * gap;
  const startY = topY - 1.5;

  return (
    <group position={position}>
      <RoundedBox args={[w, 11.2, 0.5]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={colors.sidebar} roughness={0.65} metalness={0.08} />
      </RoundedBox>
      {/* Logo */}
      <Html position={[0, topY, 0.3]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="sidebar-logo">
          <span className="logo-mark">🌾</span> Agri RS
        </div>
      </Html>
      <Html position={[0, topY - 0.85, 0.3]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="sidebar-tagline">Crop Yield Analytics</div>
      </Html>
      {tabs.map((tab, i) => {
        const y = startY - i * (itemH + gap) - itemH / 2;
        const isActive = tab.id === active;
        return (
          <SidebarItem
            key={tab.id}
            tab={tab}
            position={[0, y, 0.3]}
            size={[w - 0.4, itemH]}
            active={isActive}
            onClick={() => onSelect(tab.id)}
          />
        );
      })}
      <Html position={[0, startY - listH - 1.1, 0.3]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="sidebar-foot">© 2024 Agri RS</div>
      </Html>
    </group>
  );
}

function SidebarItem({
  tab,
  position,
  size,
  active,
  onClick,
}: {
  tab: TabDef;
  position: [number, number, number];
  size: [number, number];
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.z = THREE.MathUtils.damp(g.position.z, position[2] + (hovered || active ? 0.14 : 0), 8, dt);
  });
  const [w, h] = size;
  const lit = hovered || active;
  return (
    <group ref={group} position={position} onClick={onClick}>
      <RoundedBox
        args={[w, h, 0.12]}
        radius={0.07}
        smoothness={3}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={lit ? colors.sidebarActive : colors.sidebarLight}
          emissive={lit ? colors.sidebarActive : "#000000"}
          emissiveIntensity={lit ? 0.35 : 0}
          roughness={0.6}
        />
      </RoundedBox>
      <Html position={[0, 0, 0.08]} distanceFactor={DF} center>
        <div
          className={`sidebar-item ${active ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") onClick();
          }}
        >
          <span className="si-icon">{tab.icon}</span>
          <span className="si-label">{tab.label}</span>
        </div>
      </Html>
    </group>
  );
}

interface Header3DProps {
  position: [number, number, number];
  live: boolean;
  tabLabel: string;
  subtitle: string;
}

/** Top banner panel with the dashboard title and live/demo badge. */
export function Header3D({ position, live, tabLabel, subtitle }: Header3DProps) {
  return (
    <group position={position}>
      <RoundedBox args={[33.5, 1.9, 0.42]} radius={0.14} smoothness={4} receiveShadow>
        <meshStandardMaterial color={colors.panel} roughness={0.55} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0, -0.78, 0.22]}>
        <boxGeometry args={[33.5, 0.08, 0.06]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.4} />
      </mesh>
      <Html position={[-6.4, 0.32, 0.26]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="header-block">
          <div className="header-title">CROP YIELD PREDICTION &amp; ANALYTICS</div>
          <div className="header-sub">{subtitle}</div>
        </div>
      </Html>
      <Html position={[14.6, 0.4, 0.26]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className={`status-badge ${live ? "live" : "demo"}`}>
          <span className="status-dot" />
          {live ? "LIVE DATA" : "DEMO DATA"}
        </div>
      </Html>
      <Html position={[14.6, -0.35, 0.26]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
        <div className="header-tab">📌 {tabLabel}</div>
      </Html>
    </group>
  );
}

/** Floating 3D button used for filters / actions. */
export function Button3D({
  position,
  label,
  width = 2.2,
  primary = false,
  onClick,
  growDelay = 0.05,
}: {
  position: [number, number, number];
  label: string;
  width?: number;
  primary?: boolean;
  onClick?: () => void;
  growDelay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(growDelay, 0.45, true);
  useCursor(hovered);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.z = THREE.MathUtils.damp(g.position.z, position[2] + (hovered ? 0.12 : 0), 8, dt);
    g.scale.setScalar(Math.max(0.0001, grow.current));
  });
  return (
    <group ref={group} position={position}>
      <RoundedBox
        args={[width, 0.62, 0.16]}
        radius={0.1}
        smoothness={3}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={primary ? colors.accent : colors.panel}
          emissive={primary ? colors.accent : "#000000"}
          emissiveIntensity={primary ? 0.3 : 0}
          roughness={0.5}
        />
      </RoundedBox>
      <Html position={[0, 0, 0.1]} distanceFactor={DF} center>
        <div className={`btn3d ${primary ? "primary" : ""}`} onClick={onClick}>
          {label}
        </div>
      </Html>
    </group>
  );
}