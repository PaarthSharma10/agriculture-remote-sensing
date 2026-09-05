import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { colors, DF, yieldColor } from "../theme";
import type { DistrictYield } from "../stats";
import { useGrowProgress } from "./anim";

interface GeoFeature {
  type: "Feature";
  properties: { shapeName?: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface PreparedDistrict {
  name: string;
  rings: number[][][];
  centroid: [number, number];
}

const NAME_ALIASES: Record<string, string> = {
  Firozpur: "Firozpur",
  "Sahibzada Ajit Singh Nagar": "Fatehgarh Sahib",
};

function matchDistrict(name: string, list: string[]): string | undefined {
  const direct = list.find((d) => d.toLowerCase() === name.toLowerCase());
  if (direct) return direct;
  const alias = NAME_ALIASES[name];
  if (alias) return list.find((d) => d.toLowerCase() === alias.toLowerCase());
  return list.find((d) => d.toLowerCase().includes(name.toLowerCase()));
}

export function useDistrictsGeo(): PreparedDistrict[] | undefined {
  const [geo, setGeo] = useState<PreparedDistrict[] | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetch("/punjab_districts.geojson")
      .then((r) => r.json())
      .then((raw: GeoCollection) => {
        if (cancelled) return;
        const districts: PreparedDistrict[] = [];
        for (const f of raw.features ?? []) {
          const name = f.properties.shapeName ?? "Unknown";
          let rings: number[][][] = [];
          if (f.geometry.type === "Polygon") {
            rings = f.geometry.coordinates as number[][][];
          } else if (f.geometry.type === "MultiPolygon") {
            rings = (f.geometry.coordinates as number[][][][])[0] ?? [];
          }
          let cx = 0;
          let cy = 0;
          let count = 0;
          for (const r of rings[0] ?? []) {
            cx += r[0];
            cy += r[1];
            count++;
          }
          if (count > 0) {
            districts.push({
              name,
              rings,
              centroid: [cx / count, cy / count],
            });
          }
        }
        setGeo(districts);
      })
      .catch(() => setGeo(undefined));
    return () => {
      cancelled = true;
    };
  }, []);
  return geo;
}

export function TerrainMap3D({
  position,
  size,
  yields,
  heightScale = 1.4,
  noteMap,
  colorOverride,
  onSelectDistrict,
  selectedName,
  flat = false,
}: {
  position: [number, number, number];
  size: [number, number];
  yields: DistrictYield[];
  heightScale?: number;
  noteMap?: Record<string, string>;
  colorOverride?: Record<string, string>;
  /** Called when a district block is clicked, with the district name. */
  onSelectDistrict?: (name: string) => void;
  selectedName?: string | null;
  /** Use flat 2D rendering instead of 3D extrusion */
  flat?: boolean;
}) {
  const geo = useDistrictsGeo();
  const bounds = useMemo(() => {
    if (!geo) return null;
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const d of geo) {
      for (const r of d.rings) {
        for (const [lon, lat] of r) {
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
    return { minLon, maxLon, minLat, maxLat };
  }, [geo]);

  const prepared = useMemo(() => {
    if (!geo || !bounds) return null;
    const width = size[0];
    const height = size[1];
    const lonRange = bounds.maxLon - bounds.minLon || 1;
    const latRange = bounds.maxLat - bounds.minLat || 1;
    const scale = Math.min(width / lonRange, height / latRange);
    const offsetX = (width - lonRange * scale) / 2;
    const offsetY = (height - latRange * scale) / 2;
    const project = (lon: number, lat: number): [number, number] => [
      (lon - bounds.minLon) * scale - width / 2 + offsetX,
      (lat - bounds.minLat) * scale - height / 2 + offsetY,
    ];
    const yieldMin = Math.min(...yields.map((y) => y.yield), 1);
    const yieldMax = Math.max(...yields.map((y) => y.yield), 1);
    return geo.map((d) => {
      const matched = matchDistrict(d.name, yields.map((y) => y.district));
      const yieldVal = matched ? yields.find((y) => y.district === matched)!.yield : null;
      const depth =
        flat
          ? 0.05
          : yieldVal == null
            ? 0.25
            : 0.25 + ((yieldVal - yieldMin) / (yieldMax - yieldMin || 1)) * heightScale;
      const t = yieldVal == null ? 0 : (yieldVal - yieldMin) / (yieldMax - yieldMin || 1);
      const rings = d.rings.map((ring) => ring.map(([lon, lat]) => project(lon, lat)));
      const centroid = project(d.centroid[0], d.centroid[1]);
      const matchedName = matchDistrict(d.name, yields.map((y) => y.district));
      const color = colorOverride?.[matchedName ?? d.name] ?? yieldColor(t);
      const note = noteMap?.[matchedName ?? d.name];
      return { name: d.name, rings, centroid, depth, color, yieldVal, note };
    });
  }, [geo, bounds, size, yields, heightScale, noteMap, colorOverride, flat]);

  if (!prepared || !bounds) {
    return (
      <group position={position}>
        <RoundedBox args={[size[0], size[1], 0.2]} radius={0.1} smoothness={3}>
          <meshStandardMaterial color={colors.panelMuted} />
        </RoundedBox>
        <Html position={[0, 0, 0.2]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="map-loading">Loading district boundaries…</div>
        </Html>
      </group>
    );
  }

  return (
    <group position={position}>
      {/* base platform */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[size[0] + 0.9, 0.14, size[1] + 0.9]} />
        <meshStandardMaterial color="#0d3b2b" roughness={0.8} />
      </mesh>
      {!flat && (
        <mesh position={[0, -0.24, 0]} receiveShadow>
          <boxGeometry args={[size[0] + 1.3, 0.12, size[1] + 1.3]} />
          <meshStandardMaterial color="#0a2e22" roughness={0.9} />
        </mesh>
      )}
      {prepared.map((d, i) => (
        <DistrictBlock
          key={d.name}
          rings={d.rings}
          depth={d.depth}
          color={d.color}
          name={d.name}
          centroid={d.centroid}
          yieldVal={d.yieldVal}
          note={d.note}
          selected={selectedName != null && d.name === selectedName}
          growDelay={i * 0.04}
          onClick={() => onSelectDistrict?.(d.name)}
          flat={flat}
        />
      ))}
    </group>
  );
}

function DistrictBlock({
  rings,
  depth,
  color,
  name,
  centroid,
  yieldVal,
  note,
  selected,
  growDelay = 0,
  onClick,
  flat = false,
}: {
  rings: number[][][];
  depth: number;
  color: string;
  name: string;
  centroid: [number, number];
  yieldVal: number | null;
  note?: string;
  selected?: boolean;
  growDelay?: number;
  onClick?: () => void;
  flat?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const grow = useGrowProgress(growDelay, 0.5);
  useCursor(hovered);
  const geometry = useMemo(() => {
    const group = new THREE.Group();
    for (const ring of rings) {
      if (ring.length < 3) continue;
      const shape = new THREE.Shape();
      shape.moveTo(ring[0][0], ring[0][1]);
      for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1]);
      
      if (flat) {
        // 2D flat rendering with slight offset for visibility
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ 
          color,
          side: THREE.DoubleSide,
          depthWrite: false,
        }));
        mesh.position.z = 0.01;
        mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);
        
        // Add border for better visibility
        const borderGeo = new THREE.EdgesGeometry(geo);
        const borderMat = new THREE.LineBasicMaterial({ color: "#0d3b2b", linewidth: 2 });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        border.position.z = 0.02;
        border.rotation.x = -Math.PI / 2;
        group.add(border);
      } else {
        // 3D extrusion
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelSegments: 2,
        });
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
        group.add(mesh);
      }
    }
    return group;
  }, [rings, depth, color, flat]);

  // Highlight the selected district (brighten its extruded faces).
  useEffect(() => {
    geometry.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color(selected ? "#ffffff" : "#000000");
      mat.emissiveIntensity = selected ? 0.4 : 0;
    });
  }, [geometry, selected]);

  // Animate the district block growing up from the map base.
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const targetY = selected ? 0.18 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 8, dt);
    g.scale.y = Math.max(0.0001, grow.current);
  });

  const showMarker = hovered || selected;

  return (
    <group
      ref={group}
      position={[0, 0, 0]}
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
      <primitive object={geometry} />
      {showMarker && (
        <mesh position={[centroid[0], -0.1, centroid[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={hovered ? 0.85 : 0.55} />
        </mesh>
      )}
      {hovered && (
        <Html position={[centroid[0], depth + 0.55, centroid[1]]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="map-tooltip">
            <div className="tt-label">{name}</div>
            <div className="tt-value">
              {yieldVal == null ? "no data" : `${yieldVal.toLocaleString()} ${note ?? ""}`.trim()}
            </div>
          </div>
        </Html>
      )}
      {selected && (
        <Html position={[centroid[0], depth + 0.5, centroid[1]]} distanceFactor={DF} center style={{ pointerEvents: "none" }}>
          <div className="map-label selected">{name}</div>
        </Html>
      )}
    </group>
  );
}

export function MapLegend({
  minYield,
  maxYield,
  unit = "kg/ha",
  title = "Yield",
}: {
  minYield: number;
  maxYield: number;
  unit?: string;
  title?: string;
}) {
  const steps = 6;
  return (
    <div className="map-legend">
      <div className="legend-title">{title}</div>
      <div className="legend-swatches">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="legend-swatch-row">
            <span
              className="legend-swatch"
              style={{ background: yieldColor((i + 0.5) / steps) }}
            />
            <span className="legend-val">
              {Math.round(minYield + ((maxYield - minYield) * (i + 1)) / steps).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="legend-unit">{unit}</div>
    </div>
  );
}