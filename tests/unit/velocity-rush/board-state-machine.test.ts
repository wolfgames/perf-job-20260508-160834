import { describe, it, expect } from 'vitest';
import {
  createBoardState,
  applyTap,
  applyFall,
  applyLand,
  applyLeavePlatformEdge,
  applyTimerTick,
  type BoardState,
} from '~/game/velocity-rush/state/BoardPlugin';

describe('velocity-rush: board-state-machine', () => {
  it('initializes to Idle state', () => {
    const state = createBoardState();
    expect(state.phase).toBe('Idle');
  });

  it('Idle → Airborne on tap', () => {
    const state = createBoardState();
    const next = applyTap(state);
    expect(next.phase).toBe('Airborne');
    expect(next.vy).toBe(14); // jump impulse
  });

  it('Airborne → Lost when runner falls below viewport', () => {
    const state: BoardState = { ...createBoardState(), phase: 'Airborne' };
    const next = applyFall(state, { belowViewport: true });
    expect(next.phase).toBe('Lost');
  });

  it('CoyoteWindow active 120ms after leaving platform edge', () => {
    const state = createBoardState();
    const afterLeave = applyLeavePlatformEdge(state);
    expect(afterLeave.phase).toBe('CoyoteWindow');
    expect(afterLeave.coyoteTimeRemaining).toBe(120);

    // Can still jump within coyote window
    const afterTap = applyTap(afterLeave);
    expect(afterTap.phase).toBe('Airborne');

    // Window expires after 120ms
    const expired = applyTimerTick(afterLeave, 121);
    expect(expired.phase).toBe('Airborne'); // falls naturally
    const tapExpired = applyTap(expired);
    expect(tapExpired.phase).toBe('Airborne'); // tap while airborne = ignored (already airborne)
  });
});
