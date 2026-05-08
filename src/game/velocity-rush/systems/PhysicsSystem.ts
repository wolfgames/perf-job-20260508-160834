/**
 * Physics system for Velocity Rush.
 * Pure functions operating on plain value objects — no Pixi, no DOM.
 *
 * All units: game units per second (velocity), game units per second² (acceleration).
 * Caller is responsible for passing dt in seconds (not ms).
 */

export const GRAVITY = 28; // units/s²
export const JUMP_IMPULSE = 14; // units/s upward
export const TERMINAL_VELOCITY = 20; // units/s downward max (positive value; vy is clamped to >= -20)

export interface PhysicsPoint {
  vy: number;
}

export interface Position {
  x: number;
}

/** Apply gravity for a frame with dt in seconds. Clamps to terminal velocity. */
export const applyGravity = <T extends PhysicsPoint>(state: T, dt: number): T => {
  const vy = Math.max(state.vy - GRAVITY * dt, -TERMINAL_VELOCITY);
  return { ...state, vy };
};

/** Apply jump impulse — sets vy to JUMP_IMPULSE upward. */
export const applyJump = <T extends PhysicsPoint>(state: T): T => ({
  ...state,
  vy: JUMP_IMPULSE,
});

/** Wrap horizontal position at viewport boundaries. */
export const applyHorizontalWrap = <T extends Position>(state: T, viewportWidth: number): T => {
  if (state.x > viewportWidth) return { ...state, x: 0 };
  if (state.x < 0) return { ...state, x: viewportWidth };
  return state;
};

/** Integrate position by velocity for a frame. dt in seconds. */
export const integratePosition = <T extends { x: number; y: number; vx: number; vy: number }>(
  state: T,
  dt: number,
): T => ({
  ...state,
  x: state.x + state.vx * dt,
  y: state.y + state.vy * dt,
});
