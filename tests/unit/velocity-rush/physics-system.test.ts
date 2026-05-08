import { describe, it, expect } from 'vitest';
import {
  applyGravity,
  applyJump,
  applyHorizontalWrap,
  GRAVITY,
  JUMP_IMPULSE,
  TERMINAL_VELOCITY,
} from '~/game/velocity-rush/systems/PhysicsSystem';

const VIEWPORT_WIDTH = 390;

describe('velocity-rush: physics-system', () => {
  it('jump impulse sets vertical velocity to +14 units/s', () => {
    const state = { vy: 0 };
    const next = applyJump(state);
    expect(next.vy).toBe(JUMP_IMPULSE);
    expect(JUMP_IMPULSE).toBe(14);
  });

  it('gravity applies -28 units/s² per frame when airborne', () => {
    // Start near 0 velocity, use small dt so terminal doesn't clamp yet
    const state = { vy: 10 }; // already moving upward
    const dt = 1 / 60; // one frame ~16.67ms
    const next = applyGravity(state, dt);
    // After one frame: 10 - 28 * (1/60) ≈ 10 - 0.467 ≈ 9.53
    expect(next.vy).toBeCloseTo(10 - GRAVITY * dt, 3);
    expect(GRAVITY).toBe(28);
  });

  it('terminal velocity clamps downward at -20 units/s', () => {
    const state = { vy: -19 }; // just above terminal
    const dt = 1;
    const next = applyGravity(state, dt);
    expect(next.vy).toBeGreaterThanOrEqual(-Math.abs(TERMINAL_VELOCITY));
    expect(TERMINAL_VELOCITY).toBe(20);

    // Already at terminal
    const atTerminal = applyGravity({ vy: -20 }, dt);
    expect(atTerminal.vy).toBe(-20);
  });

  it('horizontal wrap: runner.x > viewportRight wraps to 0', () => {
    const overRight = applyHorizontalWrap({ x: VIEWPORT_WIDTH + 1 }, VIEWPORT_WIDTH);
    expect(overRight.x).toBe(0);

    const overLeft = applyHorizontalWrap({ x: -1 }, VIEWPORT_WIDTH);
    expect(overLeft.x).toBe(VIEWPORT_WIDTH);

    const normal = applyHorizontalWrap({ x: 100 }, VIEWPORT_WIDTH);
    expect(normal.x).toBe(100);
  });
});
