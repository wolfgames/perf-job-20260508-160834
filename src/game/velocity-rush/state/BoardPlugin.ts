/**
 * Board state machine for Velocity Rush.
 * Pure state transitions — no Pixi, no DOM, no Math.random().
 *
 * Phase transitions:
 *   Idle → Airborne (tap)
 *   Airborne → Idle (platform land)
 *   Idle → CoyoteWindow (step off platform edge)
 *   CoyoteWindow → Airborne (tap within 120ms) | Airborne (timer expires)
 *   Airborne → Lost (fall below viewport)
 *   Airborne|Idle → Won (exit platform contact ≥ 300ms)
 *   Any → Paused (system pause)
 */

export type GamePhase = 'Idle' | 'Airborne' | 'CoyoteWindow' | 'Animating' | 'Won' | 'Lost' | 'Paused';

export interface BoardState {
  phase: GamePhase;
  /** Vertical velocity in game units/s. Positive = upward. */
  vy: number;
  /** Remaining coyote window in ms. Only meaningful in CoyoteWindow phase. */
  coyoteTimeRemaining: number;
}

export const createBoardState = (): BoardState => ({
  phase: 'Idle',
  vy: 0,
  coyoteTimeRemaining: 0,
});

/** Full run-time state passed around the controller. */
export interface VelocityRushState {
  board: BoardState;
  heightReached: number;
  elapsedTimeMs: number;
  avgFrameTimeMs: number;
  currentSeed: number;
  winState: boolean;
}

export const computeSeed = (levelNumber: number): number => levelNumber * 99991;

export const createVelocityRushState = (levelNumber = 1): VelocityRushState => ({
  board: createBoardState(),
  heightReached: 0,
  elapsedTimeMs: 0,
  avgFrameTimeMs: 16.67,
  currentSeed: computeSeed(levelNumber),
  winState: false,
});

// ---------------------------------------------------------------------------
// State transitions — all pure functions returning new state
// ---------------------------------------------------------------------------

/** Player taps. Allowed from Idle, CoyoteWindow. Ignored from Won/Lost/Paused/Airborne. */
export const applyTap = (state: BoardState): BoardState => {
  if (state.phase === 'Idle' || state.phase === 'CoyoteWindow') {
    return { ...state, phase: 'Airborne', vy: 14, coyoteTimeRemaining: 0 };
  }
  return state; // silently ignored in all other phases
};

/** Runner has fallen below viewport bottom. */
export const applyFall = (state: BoardState, { belowViewport }: { belowViewport: boolean }): BoardState => {
  if (belowViewport && (state.phase === 'Airborne' || state.phase === 'CoyoteWindow')) {
    return { ...state, phase: 'Lost' };
  }
  return state;
};

/** Runner lands on top of a platform. */
export const applyLand = (state: BoardState): BoardState => {
  if (state.phase === 'Airborne' || state.phase === 'CoyoteWindow') {
    return { ...state, phase: 'Idle', vy: 0 };
  }
  return state;
};

/** Runner steps off platform edge — start coyote window. */
export const applyLeavePlatformEdge = (state: BoardState): BoardState => {
  if (state.phase === 'Idle') {
    return { ...state, phase: 'CoyoteWindow', coyoteTimeRemaining: 120 };
  }
  return state;
};

/** Advance the coyote timer by dtMs. Expires to Airborne. */
export const applyTimerTick = (state: BoardState, dtMs: number): BoardState => {
  if (state.phase === 'CoyoteWindow') {
    const remaining = state.coyoteTimeRemaining - dtMs;
    if (remaining <= 0) {
      return { ...state, phase: 'Airborne', coyoteTimeRemaining: 0 };
    }
    return { ...state, coyoteTimeRemaining: remaining };
  }
  return state;
};

/** Win trigger from exit platform. */
export const applyWin = (state: BoardState): BoardState =>
  state.phase === 'Won' || state.phase === 'Lost' ? state : { ...state, phase: 'Won' };
