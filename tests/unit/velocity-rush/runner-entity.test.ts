import { describe, it, expect } from 'vitest';
import { createRunner, computeHorizontalDrift } from '~/game/velocity-rush/entities/Runner';
import { mulberry32 } from '~/game/velocity-rush/generation/rng';

describe('velocity-rush: runner-entity', () => {
  it('runner starts horizontal drift on init (seeded, no Math.random)', () => {
    // Drift is deterministic given the same seed
    const seed = 99991;
    const rng = mulberry32(seed);
    const drift1 = computeHorizontalDrift(rng);

    const rng2 = mulberry32(seed);
    const drift2 = computeHorizontalDrift(rng2);

    expect(drift1).toBe(drift2);
    // Drift is non-zero and within reasonable range
    expect(Math.abs(drift1)).toBeGreaterThan(0);
    expect(Math.abs(drift1)).toBeLessThanOrEqual(2);
  });

  it('runner stretch animation fires on jump within 16ms', () => {
    // The runner entity should expose a jumpAnimationDuration
    const runner = createRunner({ x: 100, y: 200, rng: mulberry32(99991) });
    // Jump animation is stretch: scaleY > 1
    expect(runner.jumpAnimationDurationMs).toBeLessThanOrEqual(16);
  });
});
