/**
 * Camera system — controls vertical world scroll.
 * The camera moves upward automatically, driving the height meter.
 * Freezes when phase is Won or Lost.
 */

import type { GamePhase } from '~/game/velocity-rush/state/BoardPlugin';

/** Base camera speed (units/s), scales with level. Max 2 units/s. */
export const baseCameraSpeed = (levelNumber: number): number =>
  Math.min(0.8 + levelNumber * 0.02, 2.0);

export interface CameraState {
  offsetY: number;
  speed: number;
  frozen: boolean;
}

export const createCameraState = (levelNumber: number): CameraState => ({
  offsetY: 0,
  speed: baseCameraSpeed(levelNumber),
  frozen: false,
});

const terminalPhases: Set<GamePhase> = new Set(['Won', 'Lost']);

/** Advance camera by dt seconds. Freezes on Won/Lost phase. */
export const tickCamera = (
  camera: CameraState,
  phase: GamePhase,
  dt: number,
): CameraState => {
  if (terminalPhases.has(phase)) {
    return { ...camera, frozen: true };
  }
  return {
    ...camera,
    frozen: false,
    offsetY: camera.offsetY + camera.speed * dt,
  };
};
