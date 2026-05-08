/**
 * Platform entity — shared type for all platform variants.
 * No Pixi, no DOM. Pure data.
 */

export type PlatformVariant = 'static' | 'moving' | 'crumbling' | 'exit';

export interface Platform {
  id: string;
  x: number; // game units, left edge
  y: number; // game units, top surface
  width: number; // game units
  height: number; // game units (always 0.5)
  variant: PlatformVariant;
  /** Moving platforms only — current oscillation speed (signed, units/s). */
  vx?: number;
  /** Crumbling platforms only — ms since first contact (null = not contacted). */
  crumbleTimerMs?: number | null;
  /** Exit platforms only — accent color derived from seed (0xRRGGBB). */
  accentColor?: number;
}

export interface PlatformCreateOptions {
  x: number;
  y: number;
  width: number;
  variant: PlatformVariant;
  vx?: number;
  accentColor?: number;
}

/** Game units per pixel — must match RunnerRenderer.UNIT_PX */
export const UNIT_PX = 48;

let _idCounter = 0;
export const createPlatform = (opts: PlatformCreateOptions): Platform => ({
  id: `platform-${_idCounter++}`,
  x: opts.x,
  y: opts.y,
  width: opts.width,
  height: 0.5,
  variant: opts.variant,
  vx: opts.vx,
  crumbleTimerMs: opts.variant === 'crumbling' ? null : undefined,
  accentColor: opts.accentColor,
});

/** First platform spec: always width 4, centered, y=2 from bottom. */
export const firstPlatformPosition = (viewportWidthPx: number) => {
  const centerUnit = viewportWidthPx / UNIT_PX;
  return {
    x: centerUnit / 2 - 2, // centered: half viewport - half width
    y: 2,
    width: 4,
  };
};

// ---------------------------------------------------------------------------
// Collision detection — pure functions
// ---------------------------------------------------------------------------

/** Compute horizontal overlap between runner and platform (game units). */
const horizontalOverlap = (
  runner: { x: number; width: number },
  platform: Platform,
): boolean =>
  runner.x + runner.width > platform.x && runner.x < platform.x + platform.width;

/**
 * True if runner is descending and their bottom (y + height) crosses
 * the platform top surface this frame.
 * One-way: only from above.
 */
export const landedOnTop = (
  runner: { x: number; y: number; width: number; height: number; vy: number },
  platform: Platform,
): boolean => {
  if (runner.vy > 0) return false; // ascending — can't land
  if (!horizontalOverlap(runner, platform)) return false;
  const runnerBottom = runner.y + runner.height;
  // Runner bottom is within the platform thickness (allow 0.15 units tolerance)
  return runnerBottom >= platform.y && runnerBottom <= platform.y + platform.height + 0.15;
};

/**
 * True if runner is ascending and their top (y) hits the platform underside.
 */
export const hitsUnderside = (
  runner: { x: number; y: number; width: number; height: number; vy: number },
  platform: Platform,
): boolean => {
  if (runner.vy <= 0) return false; // descending — won't hit underside
  if (!horizontalOverlap(runner, platform)) return false;
  const platformBottom = platform.y + platform.height;
  // Runner top is within the platform from below
  return runner.y <= platformBottom && runner.y >= platform.y - 0.15;
};

/** Derive accent color from seed — bright HSL color. */
export const accentColorFromSeed = (seed: number): number => {
  const hue = seed % 360;
  return hslToHex(hue, 80, 55);
};

const hslToHex = (h: number, s: number, l: number): number => {
  const sf = s / 100;
  const lf = l / 100;
  const a = sf * Math.min(lf, 1 - lf);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lf - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
};
