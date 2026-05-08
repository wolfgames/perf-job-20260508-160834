/**
 * HudRenderer — GPU-only HUD strip for Velocity Rush.
 *
 * 80pt tall band at top of canvas:
 *   - Left: height meter (integer game units climbed)
 *   - Right: elapsed time (mm:ss)
 *
 * No DOM, no document.createElement — pure Pixi Text/Graphics.
 */

import { Container, Graphics, Text } from 'pixi.js';
export { HUD_TOP_PX, PLAY_AREA_START_Y, formatElapsedTime } from '~/game/velocity-rush/renderers/HudConstants';
import { HUD_TOP_PX, formatElapsedTime } from '~/game/velocity-rush/renderers/HudConstants';

export class HudRenderer {
  readonly container: Container;
  private heightLabel: Text;
  private timerLabel: Text;

  constructor(viewportW: number) {
    this.container = new Container();
    this.container.eventMode = 'none';

    // Background band
    const bg = new Graphics().rect(0, 0, viewportW, HUD_TOP_PX).fill(0x1a1a2e);
    this.container.addChild(bg);

    // Height meter — left side
    this.heightLabel = new Text({
      text: '0',
      style: { fontSize: 22, fill: '#ffffff', fontFamily: 'system-ui, monospace' },
    });
    this.heightLabel.x = 16;
    this.heightLabel.y = (HUD_TOP_PX - this.heightLabel.height) / 2;
    this.container.addChild(this.heightLabel);

    // Timer — right side
    this.timerLabel = new Text({
      text: '00:00',
      style: { fontSize: 22, fill: '#cccccc', fontFamily: 'system-ui, monospace' },
    });
    this.timerLabel.x = viewportW - this.timerLabel.width - 16;
    this.timerLabel.y = (HUD_TOP_PX - this.timerLabel.height) / 2;
    this.container.addChild(this.timerLabel);
  }

  update(heightReached: number, elapsedMs: number): void {
    this.heightLabel.text = String(Math.round(heightReached));
    this.timerLabel.text = formatElapsedTime(elapsedMs);
  }

  destroy(): void {
    this.container.removeAllListeners();
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
