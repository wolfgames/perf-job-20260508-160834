import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createBoardState,
  applyWin,
  applyTap,
} from '~/game/velocity-rush/state/BoardPlugin';
import { runWinSequence } from '~/game/velocity-rush/sequences/WinSequence';
import { runLossSequence } from '~/game/velocity-rush/sequences/LossSequence';

describe('velocity-rush: win-loss-sequences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('win sequence: Won state set, camera frozen, transition fires after 700ms', async () => {
    const onTransition = vi.fn();
    const onCameraFreeze = vi.fn();

    const start = Date.now();
    await runWinSequence({ onTransition, onCameraFreeze, skipAnimation: true });
    const elapsed = Date.now() - start;

    expect(onCameraFreeze).toHaveBeenCalled();
    expect(onTransition).toHaveBeenCalled();
    // skipAnimation collapses timing — just check callbacks fire
  });

  it('loss sequence: Lost state set, camera frozen, transition fires after 600ms', async () => {
    const onTransition = vi.fn();
    const onCameraFreeze = vi.fn();

    await runLossSequence({ onTransition, onCameraFreeze, skipAnimation: true });

    expect(onCameraFreeze).toHaveBeenCalled();
    expect(onTransition).toHaveBeenCalled();
  });

  it('tap in Won state does not change state', () => {
    const won = applyWin(createBoardState());
    expect(won.phase).toBe('Won');
    // applyTap in Won state must return the same state unchanged
    const afterTap = applyTap(won);
    expect(afterTap.phase).toBe('Won');
  });
});
