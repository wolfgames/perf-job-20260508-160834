/**
 * PlatformRenderer — GPU-only Pixi renderer for all platform variants.
 *
 * Colors:
 *   static   → mid-grey  (0x888888)
 *   moving   → lighter grey (0xaaaaaa)
 *   crumbling → mid-grey with dashed-outline effect (alpha flicker during crumble)
 *   exit     → accent color derived from seed, with "↑" emoji text
 *
 * No DOM, no requestAnimationFrame — GPU canvas only.
 */

import { Graphics, Container, Text } from 'pixi.js';
import gsap from 'gsap';
import type { Platform } from '~/game/velocity-rush/entities/Platform';

const UNIT_PX = 48;
const PLATFORM_COLORS: Record<string, number> = {
  static: 0x888888,
  moving: 0xaaaaaa,
  crumbling: 0x888888,
};

export class PlatformRenderer {
  readonly container: Container;
  private gfx: Graphics;
  private platform: Platform;
  private label?: Text;

  constructor(platform: Platform) {
    this.platform = platform;
    this.container = new Container();

    const color = platform.variant === 'exit' ? (platform.accentColor ?? 0x4fc3f7) : PLATFORM_COLORS[platform.variant];
    const w = platform.width * UNIT_PX;
    const h = platform.height * UNIT_PX;

    this.gfx = new Graphics().rect(0, 0, w, h).fill(color);
    this.container.addChild(this.gfx);

    if (platform.variant === 'crumbling') {
      // Dashed outline affordance — draw a lighter border rect
      const border = new Graphics()
        .rect(2, 2, w - 4, h - 4)
        .stroke({ color: 0xcccccc, width: 2, alignment: 0 });
      this.container.addChild(border);
    }

    if (platform.variant === 'exit') {
      // Upward arrow emoji on exit platform
      this.label = new Text({
        text: '↑',
        style: { fontSize: Math.max(h * 1.5, 16), fill: '#ffffff' },
      });
      this.label.anchor.set(0.5, 0.5);
      this.label.x = w / 2;
      this.label.y = h / 2;
      this.container.addChild(this.label);
    }

    this.sync(platform);
  }

  sync(platform: Platform): void {
    this.container.x = platform.x * UNIT_PX;
    this.container.y = platform.y * UNIT_PX;
    this.platform = platform;
  }

  /** Start crumble animation — 300ms shake then disappear. */
  playCrumble(onComplete: () => void): void {
    gsap.killTweensOf(this.container);
    gsap.to(this.container, {
      x: this.container.x + 4,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      ease: 'power1.inOut',
      onComplete: () => {
        gsap.to(this.container, {
          alpha: 0,
          duration: 0.1,
          onComplete: () => {
            onComplete();
            this.destroy();
          },
        });
      },
    });
  }

  /** Pulse effect for exit platform on win. */
  playExitPulse(): void {
    gsap.to(this.container, {
      alpha: 0.4,
      duration: 0.1,
      yoyo: true,
      repeat: 7,
      ease: 'power2.inOut',
    });
  }

  destroy(): void {
    gsap.killTweensOf(this.container);
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
