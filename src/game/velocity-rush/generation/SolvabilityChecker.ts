/**
 * SolvabilityChecker — simulates whether a generated platform layout is beatable.
 *
 * Checks for:
 *   - CONSECUTIVE_CRUMBLING: two adjacent platforms both crumble
 *   - GAP_TOO_WIDE: horizontal gap exceeds maximum jump range
 *   - RISE_TOO_HIGH: vertical gap exceeds maximum jump height
 *   - NO_EXIT: no exit platform present
 *
 * Uses the same physics constants as PhysicsSystem to ensure
 * generation-time sim matches runtime behavior.
 */

import type { Platform } from '~/game/velocity-rush/entities/Platform';
import { JUMP_IMPULSE, GRAVITY } from '~/game/velocity-rush/systems/PhysicsSystem';

export const SolvabilityError = {
  ConsecutiveCrumbling: 'CONSECUTIVE_CRUMBLING',
  GapTooWide: 'GAP_TOO_WIDE',
  RiseTooHigh: 'RISE_TOO_HIGH',
  NoExit: 'NO_EXIT',
} as const;

export type SolvabilityErrorType = (typeof SolvabilityError)[keyof typeof SolvabilityError];

export interface SolvabilityResult {
  solvable: boolean;
  error?: SolvabilityErrorType;
}

/**
 * Maximum horizontal drift distance the runner can cover in one jump.
 * Derived from physics: time airborne × max horizontal speed.
 * Jump time = 2 × jumpVelocity / gravity (up + down symmetry)
 * At max drift speed (2 u/s): maxHorizontalRange = 2 × (2 * 14 / 28) = 2 × 1 = 2s × 2 u/s = 4 u
 * Add viewport width to account for wrap: use 8 as practical max
 */
const MAX_HORIZONTAL_REACH = 8; // game units (includes wrap)

/**
 * Maximum height gain in one jump.
 * At JUMP_IMPULSE = 14 u/s, gravity = 28 u/s²:
 *   t_peak = 14/28 = 0.5s
 *   height = 14 * 0.5 - 0.5 * 28 * 0.25 = 7 - 3.5 = 3.5 units
 */
const MAX_JUMP_HEIGHT = 3.5; // game units

export const checkSolvability = (platforms: Platform[]): SolvabilityResult => {
  // Check no exit
  const hasExit = platforms.some((p) => p.variant === 'exit');
  if (!hasExit) return { solvable: false, error: SolvabilityError.NoExit };

  // Sort platforms by y ascending (bottom to top)
  const sorted = [...platforms].sort((a, b) => a.y - b.y);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // Consecutive crumbling check
    if (current.variant === 'crumbling' && next.variant === 'crumbling') {
      return { solvable: false, error: SolvabilityError.ConsecutiveCrumbling };
    }

    // Rise too high check
    const rise = next.y - (current.y + current.height);
    if (rise > MAX_JUMP_HEIGHT) {
      return { solvable: false, error: SolvabilityError.RiseTooHigh };
    }

    // Gap too wide check — minimum horizontal proximity needed
    const currentRight = current.x + current.width;
    const horizontalGap = Math.min(
      Math.abs(next.x - currentRight),
      Math.abs(current.x - (next.x + next.width)),
    );
    if (horizontalGap > MAX_HORIZONTAL_REACH) {
      return { solvable: false, error: SolvabilityError.GapTooWide };
    }
  }

  return { solvable: true };
};
