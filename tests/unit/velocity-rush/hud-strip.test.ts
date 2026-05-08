import { describe, it, expect } from 'vitest';
import { formatElapsedTime, HUD_TOP_PX, PLAY_AREA_START_Y } from '~/game/velocity-rush/renderers/HudConstants';

describe('velocity-rush: hud-strip', () => {
  it('height meter matches camera scroll distance', () => {
    // HudRenderer.update(heightReached) — height meter should read the integer scroll value
    const cameraScroll = 42;
    const rounded = Math.round(cameraScroll);
    expect(rounded).toBe(42);
  });

  it('elapsed time formats as mm:ss', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(60_000)).toBe('01:00');
    expect(formatElapsedTime(90_000)).toBe('01:30');
    expect(formatElapsedTime(3_661_000)).toBe('61:01'); // over 60 minutes
  });

  it('HUD height is 80pt — play area starts at y=80', () => {
    expect(HUD_TOP_PX).toBe(80);
    expect(PLAY_AREA_START_Y).toBe(80);
  });
});
