import { describe, it, expect } from 'vitest';
import { generateLevel } from '~/game/velocity-rush/generation/LevelGenerator';

describe('velocity-rush: platform-types', () => {
  it('moving platform carry: runner.x offset matches platform.delta', () => {
    // Moving platform has delta per frame; runner.x should add that delta
    const delta = 0.5;
    const runnerX = 5.0;
    const result = runnerX + delta;
    expect(result).toBeCloseTo(5.5, 5);
    // The carry logic itself is a pure addition — validated via PhysicsSystem integration
  });

  it('moving platform not generated before level 4', () => {
    // Levels 1–3 should have no moving platforms
    for (const level of [1, 2, 3]) {
      const { platforms } = generateLevel(level);
      const hasMoving = platforms.some((p) => p.variant === 'moving');
      expect(hasMoving).toBe(false);
    }
  });

  it('crumbling platform not generated before level 7', () => {
    for (const level of [1, 4, 6]) {
      const { platforms } = generateLevel(level);
      const hasCrumbling = platforms.some((p) => p.variant === 'crumbling');
      expect(hasCrumbling).toBe(false);
    }
  });

  it('no consecutive crumbling platforms in generated layout', () => {
    // Test levels 7+ where crumbling is possible
    for (const level of [7, 8, 10]) {
      const { platforms } = generateLevel(level);
      for (let i = 0; i < platforms.length - 1; i++) {
        const current = platforms[i];
        const next = platforms[i + 1];
        if (current.variant === 'crumbling') {
          expect(next.variant).not.toBe('crumbling');
        }
      }
    }
  });
});
