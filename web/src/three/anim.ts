import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Tracks a 0 → 1 grow-in progress each frame, starting when the component
 * mounts. Views are remounted on tab switches (`key={tab}` in App.tsx), so
 * this replays the grow-in whenever a tab loads. The returned ref holds the
 * current eased progress; combine it with your own hover/lift math inside a
 * `useFrame` callback.
 */
export function useGrowProgress(
  delay = 0,
  duration = 0.55,
  overshoot = false,
) {
  const progress = useRef(0);
  const start = useRef<number | null>(null);
  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const el = state.clock.elapsedTime - start.current - delay;
    const t = Math.max(0, Math.min(1, el / duration));
    progress.current = overshoot ? easeOutBack(t) : easeOutCubic(t);
  });
  return progress;
}