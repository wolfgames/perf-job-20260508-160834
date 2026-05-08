/**
 * PerfScore — performance score formula.
 *
 * Formula: heightReached × (1000 / elapsedMs) × (TARGET_FRAME_MS / avgFrameMs)
 *
 * Three multiplicative dimensions:
 *   1. heightReached   — how high the player climbed
 *   2. 1000/elapsedMs  — speed factor (faster runs score more)
 *   3. TARGET/avgFrame — frame-efficiency factor (smoother runs score more)
 *
 * Result clamped to minimum 1.
 */

export const TARGET_FRAME_MS = 16.67; // 60 fps baseline

/**
 * Compute performance score from run metrics.
 * All parameters must be > 0 (0 or negative returns 1 via clamp).
 */
export const computePerfScore = (
  heightReached: number,
  elapsedMs: number,
  avgFrameMs: number,
): number => {
  if (elapsedMs <= 0 || avgFrameMs <= 0) return 1;
  const raw = heightReached * (1000 / elapsedMs) * (TARGET_FRAME_MS / avgFrameMs);
  return Math.max(1, Math.round(raw));
};
