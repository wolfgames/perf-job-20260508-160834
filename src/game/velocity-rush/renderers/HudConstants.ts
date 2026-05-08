/**
 * HUD constants and pure utility functions — no Pixi imports.
 * Exported separately so tests can import without navigator/browser APIs.
 */

export const HUD_TOP_PX = 80;
export const PLAY_AREA_START_Y = 80;

/** Format elapsed milliseconds as mm:ss. */
export const formatElapsedTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
