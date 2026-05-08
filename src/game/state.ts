import { createSignal, createRoot } from 'solid-js';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * Signals here are the DOM bridge — ECS is not used for this game.
 * Pause state lives in core/systems/pause (scaffold feature).
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  /** Height the runner has reached (camera scroll distance, integer game units). */
  heightReached: () => number;
  setHeightReached: (v: number) => void;

  /** Elapsed game time in milliseconds. */
  elapsedTimeMs: () => number;
  setElapsedTimeMs: (v: number) => void;

  /** Average frame time in ms, sampled over recent frames. Used for perf score. */
  avgFrameTimeMs: () => number;
  setAvgFrameTimeMs: (v: number) => void;

  /** Current level seed = level × 99991. Read by start and results screens. */
  currentSeed: () => number;

  /** True when the player won (Level Complete), false = Try Again. */
  winState: () => boolean;
  setWinState: (v: boolean) => void;

  reset: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [heightReached, setHeightReached] = createSignal(0);
  const [elapsedTimeMs, setElapsedTimeMs] = createSignal(0);
  const [avgFrameTimeMs, setAvgFrameTimeMs] = createSignal(16.67);
  const [winState, setWinState] = createSignal(false);

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    heightReached,
    setHeightReached,

    elapsedTimeMs,
    setElapsedTimeMs,

    avgFrameTimeMs,
    setAvgFrameTimeMs,

    // Derived: seed recalculates whenever level changes
    currentSeed: () => level() * 99991,

    winState,
    setWinState,

    reset: () => {
      setScore(0);
      setHeightReached(0);
      setElapsedTimeMs(0);
      setAvgFrameTimeMs(16.67);
      setWinState(false);
      // level is NOT reset — it persists for retry/next-level
    },
  };
}

export const gameState = createRoot(createGameState);
