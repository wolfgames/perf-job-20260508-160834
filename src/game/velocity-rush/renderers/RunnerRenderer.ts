/**
 * RunnerRenderer — GPU-only Pixi renderer for the player character.
 *
 * Dark charcoal 1×2 game-unit rectangle.
 * GSAP stretch on jump (scaleY 1.3, 80ms), squash on land (scaleY 0.7 then 1.0).
 * No DOM, no requestAnimationFrame — GPU canvas only.
 */

import { Graphics, Container } from 'pixi.js';
import gsap from 'gsap';
import type { RunnerEntity } from '~/game/velocity-rush/entities/Runner';

/** Game-unit to pixel conversion factor. Derived from viewport layout. */
const UNIT_PX = 48; // 1 game unit = 48px (ensures 1×2 runner = 48×96px ≥ 48×48 minimum)

export const RUNNER_COLOR = 0x2d2d2d; // dark charcoal

export class RunnerRenderer {
  readonly container: Container;
  private rect: Graphics;
  private unitPx: number;

  constructor(unitPx = UNIT_PX) {
    this.unitPx = unitPx;
    this.container = new Container();

    this.rect = new Graphics()
      .rect(0, 0, 1 * unitPx, 2 * unitPx)
      .fill(RUNNER_COLOR);

    // Pivot at center-bottom so stretches/squashes look natural
    this.rect.pivot.set(0.5 * unitPx, 2 * unitPx);
    this.container.addChild(this.rect);
  }

  sync(runner: RunnerEntity): void {
    this.container.x = runner.x * this.unitPx;
    this.container.y = runner.y * this.unitPx;
  }

  /** Call when jump fires. Stretch animation — scaleY 1.3 within 80ms. */
  playJumpStretch(): void {
    gsap.killTweensOf(this.container.scale);
    gsap.to(this.container.scale, {
      y: 1.3,
      duration: 0.08,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  /** Call when runner lands on a platform. Squash then settle. */
  playLandSquash(): void {
    gsap.killTweensOf(this.container.scale);
    gsap.to(this.container.scale, {
      y: 0.7,
      duration: 0.06,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        gsap.to(this.container.scale, {
          y: 1.0,
          duration: 0.12,
          ease: 'elastic.out(1, 0.5)',
        });
      },
    });
  }

  destroy(): void {
    gsap.killTweensOf(this.container.scale);
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
