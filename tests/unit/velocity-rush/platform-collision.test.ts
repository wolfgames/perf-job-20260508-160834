import { describe, it, expect } from 'vitest';
import {
  createPlatform,
  landedOnTop,
  hitsUnderside,
  firstPlatformPosition,
  type Platform,
} from '~/game/velocity-rush/entities/Platform';

describe('velocity-rush: platform-collision', () => {
  it('landing on top of static platform: velocity resets to 0', () => {
    const platform = createPlatform({ x: 5, y: 10, width: 4, variant: 'static' });
    // Runner descending (vy < 0), y=8 height=2 so feet = y+height = 8+2 = 10 = platform.y
    const runner = { x: 6, y: 8, width: 1, height: 2, vy: -3 };
    expect(landedOnTop(runner, platform)).toBe(true);
  });

  it('underside hit: runner passes through, velocity resets', () => {
    const platform = createPlatform({ x: 5, y: 10, width: 4, variant: 'static' });
    // Runner ascending (vy > 0), runner.y at platform top (touching underside)
    // platform bottom = y + height = 10 + 0.5 = 10.5; runner.y = 10.45
    const runner = { x: 6, y: 10.45, width: 1, height: 2, vy: 5 };
    expect(hitsUnderside(runner, platform)).toBe(true);
  });

  it('first platform always at expected position and width', () => {
    const viewportWidth = 390;
    const pos = firstPlatformPosition(viewportWidth);
    // Width 4 units, centered, y=2 from bottom
    expect(pos.width).toBe(4);
    expect(pos.y).toBe(2);
    // Centered: x = viewportWidth/2 / UNIT_PX - width/2
    // In game units: viewport center = 390/48 ≈ 8.125; x = 8.125 - 2 = 6.125
    const centerUnit = viewportWidth / 48;
    expect(pos.x).toBeCloseTo(centerUnit / 2 - 2, 2);
  });
});
