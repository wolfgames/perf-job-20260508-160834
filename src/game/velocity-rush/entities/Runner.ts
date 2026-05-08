/**
 * Runner entity — dark charcoal 1×2 game unit rectangle.
 * Represents the player character's state, not its visual.
 * Visuals live in RunnerRenderer.ts.
 */

/** Runner.jumpAnimationDurationMs must be ≤ 16ms — fired within one frame. */
export const RUNNER_WIDTH_UNITS = 1;
export const RUNNER_HEIGHT_UNITS = 2;

/** Drift speed range [min, max] in units/s. */
const DRIFT_MIN = 0.3;
const DRIFT_MAX = 2.0;

export interface RunnerEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Time in ms at which the jump stretch animation is triggered — ≤ 16ms so it fires within the same frame. */
  jumpAnimationDurationMs: number;
}

/** Compute seeded horizontal drift speed (units/s) from a PRNG. */
export const computeHorizontalDrift = (rng: () => number): number => {
  const t = rng();
  const speed = DRIFT_MIN + t * (DRIFT_MAX - DRIFT_MIN);
  // Alternate direction on next rng call
  const dir = rng() < 0.5 ? 1 : -1;
  return speed * dir;
};

export const createRunner = ({
  x,
  y,
  rng,
}: {
  x: number;
  y: number;
  rng: () => number;
}): RunnerEntity => ({
  x,
  y,
  vx: computeHorizontalDrift(rng),
  vy: 0,
  jumpAnimationDurationMs: 0, // stretch is triggered immediately on jump, well within 16ms
});
