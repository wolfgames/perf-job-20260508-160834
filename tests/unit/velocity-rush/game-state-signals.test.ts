import { describe, it, expect } from 'vitest';
import {
  computeSeed,
  createVelocityRushState,
} from '~/game/velocity-rush/state/BoardPlugin';

describe('velocity-rush: game-state-signals', () => {
  it('initial heightReached is 0', () => {
    const state = createVelocityRushState();
    expect(state.heightReached).toBe(0);
  });

  it('currentSeed equals levelNumber × 99991', () => {
    expect(computeSeed(1)).toBe(99991);
    expect(computeSeed(3)).toBe(299973);
    expect(computeSeed(10)).toBe(999910);
  });

  it('heightReached tracks camera scroll distance', () => {
    const state = createVelocityRushState();
    const updated = { ...state, heightReached: 42 };
    expect(updated.heightReached).toBe(42);
  });
});
