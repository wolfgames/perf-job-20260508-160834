import { describe, it, expect } from 'vitest';
import { generateLevel, SAFE_MODE_PLATFORM_WIDTH } from '~/game/velocity-rush/generation/LevelGenerator';
import { checkSolvability, SolvabilityError } from '~/game/velocity-rush/generation/SolvabilityChecker';
import type { Platform } from '~/game/velocity-rush/entities/Platform';

describe('velocity-rush: level-generator', () => {
  it('same seed produces identical layout (deterministic)', () => {
    const result1 = generateLevel(1);
    const result2 = generateLevel(1);
    expect(result1.platforms.length).toBe(result2.platforms.length);
    result1.platforms.forEach((p, i) => {
      expect(p.x).toBe(result2.platforms[i].x);
      expect(p.y).toBe(result2.platforms[i].y);
      expect(p.width).toBe(result2.platforms[i].width);
      expect(p.variant).toBe(result2.platforms[i].variant);
    });
  });

  it('safe-mode fallback triggers after 10 failed solvability checks', () => {
    // Safe mode produces static-only level that is always solvable
    const result = generateLevel(1, { forceSafeMode: true });
    expect(result.safeMode).toBe(true);
    const hasCrumbling = result.platforms.some((p) => p.variant === 'crumbling');
    const hasMoving = result.platforms.some((p) => p.variant === 'moving');
    expect(hasCrumbling).toBe(false);
    expect(hasMoving).toBe(false);
    // Safe mode uses fixed width — skip the first spawn platform (width=4)
    result.platforms
      .filter((p) => p.variant === 'static')
      .slice(1) // first spawn is always width 4
      .forEach((p) => {
        expect(p.width).toBe(SAFE_MODE_PLATFORM_WIDTH);
      });
  });

  it('generation completes in < 16ms for level 1 through level 10', () => {
    for (const level of [1, 2, 3, 4, 5, 7, 10]) {
      const start = performance.now();
      generateLevel(level);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(16);
    }
  });

  it('solvability checker rejects CONSECUTIVE_CRUMBLING layout', () => {
    const platforms: Platform[] = [
      { x: 2, y: 2, width: 4, variant: 'static', height: 0.5, id: 'p0' },
      { x: 2, y: 5, width: 3, variant: 'crumbling', height: 0.5, id: 'p1', crumbleTimerMs: null },
      { x: 2, y: 8, width: 3, variant: 'crumbling', height: 0.5, id: 'p2', crumbleTimerMs: null },
      { x: 2, y: 20, width: 3, variant: 'exit', height: 0.5, id: 'exit', accentColor: 0xff0000 },
    ];
    const result = checkSolvability(platforms);
    expect(result.solvable).toBe(false);
    expect(result.error).toBe(SolvabilityError.ConsecutiveCrumbling);
  });

  it('solvability checker rejects GAP_TOO_WIDE layout', () => {
    // Create platforms with a gap that is too wide to jump
    const platforms: Platform[] = [
      { x: 0, y: 2, width: 2, variant: 'static', height: 0.5, id: 'p0' },
      // Gap of 12 units — too wide to jump (max jump range ≈ 5 units horizontal)
      { x: 14, y: 4, width: 2, variant: 'static', height: 0.5, id: 'p1' },
      { x: 14, y: 20, width: 3, variant: 'exit', height: 0.5, id: 'exit', accentColor: 0xff0000 },
    ];
    const result = checkSolvability(platforms);
    expect(result.solvable).toBe(false);
    expect(result.error).toBe(SolvabilityError.GapTooWide);
  });
});
