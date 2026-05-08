import { describe, it, expect } from 'vitest';
import { computePerfScore } from '~/game/velocity-rush/scoring/PerfScore';

describe('velocity-rush: perf-score-formula', () => {
  it('perf score: player A 2× faster than B yields 2× score', () => {
    // Same height, same avgFrameTime; player A takes half the time of player B
    const height = 100;
    const avgFrameMs = 16.67;
    const scoreA = computePerfScore(height, 10_000, avgFrameMs); // 10s
    const scoreB = computePerfScore(height, 20_000, avgFrameMs); // 20s
    // A is 2x faster → 2x score
    expect(scoreA / scoreB).toBeCloseTo(2, 5);
  });

  it('perf score: frame efficiency 2× better yields 2× score', () => {
    // Same height, same time; run A has twice as good frame time as run B
    const height = 100;
    const elapsedMs = 10_000;
    const scoreA = computePerfScore(height, elapsedMs, 16.67); // perfect frames
    const scoreB = computePerfScore(height, elapsedMs, 33.34); // 2× worse frames
    // A has 2× better frame efficiency → 2× score
    expect(scoreA / scoreB).toBeCloseTo(2, 5);
  });

  it('perf score: all three dimensions multiply (height × speed × frame)', () => {
    const base = computePerfScore(100, 10_000, 16.67);
    // Double height → double score
    const doubleHeight = computePerfScore(200, 10_000, 16.67);
    expect(doubleHeight / base).toBeCloseTo(2, 5);

    // Triple speed (1/3 time) → triple score
    const tripleSpeed = computePerfScore(100, 10_000 / 3, 16.67);
    expect(tripleSpeed / base).toBeCloseTo(3, 5);

    // Score is always at least 1
    const tinyScore = computePerfScore(0, 999_999, 1000);
    expect(tinyScore).toBeGreaterThanOrEqual(1);
  });
});
