/**
 * Velocity Rush — Start Screen View.
 *
 * Displays:
 *   - 'Velocity Rush' title
 *   - Current level number (from gameState.level())
 *   - 'PERF MODE' badge
 *   - Large Play button (≥ 44×44 px hit area)
 *
 * Play button: calls initGpu() → loadBundle('scene-perf') → goto('game').
 * loadAudio() removed (guardrail #15 — no audio content in GDD).
 * unlockAudio() retained for mobile constraints compliance.
 */

import type { StartScreenDeps, StartScreenController, SetupStartScreen } from '~/game/mygame-contract';
import { gameState } from '~/game/state';

export const GAME_TITLE = 'Velocity Rush';
export const PLAY_BUTTON_MIN_SIZE_PX = 56; // ≥ 44px minimum

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let wrapper: HTMLDivElement | null = null;

  return {
    backgroundColor: '#0f0f1a',

    init(container: HTMLDivElement) {
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'height:100%;gap:16px;padding:50px 24px 34px;box-sizing:border-box;';

      // PERF MODE badge
      const badge = document.createElement('span');
      badge.textContent = 'PERF MODE';
      badge.style.cssText =
        'font-size:0.75rem;font-weight:700;letter-spacing:0.12em;padding:4px 12px;' +
        'background:rgba(255,255,255,0.12);color:#88aabb;border-radius:20px;' +
        'font-family:system-ui,monospace;text-transform:uppercase;';

      // Title
      const title = document.createElement('h1');
      title.textContent = GAME_TITLE;
      title.style.cssText =
        'font-size:2.5rem;font-weight:800;color:#ffffff;margin:0;' +
        'font-family:system-ui,sans-serif;letter-spacing:-0.02em;';

      // Level indicator
      const levelIndicator = document.createElement('p');
      levelIndicator.textContent = `Level ${gameState.level()}`;
      levelIndicator.style.cssText =
        'font-size:1rem;color:#8899aa;margin:0;font-family:system-ui,monospace;';

      // Play button — min hit area 44×44, actual 56px height
      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.style.cssText =
        `font-size:1.25rem;font-weight:700;` +
        `padding:0 48px;height:${PLAY_BUTTON_MIN_SIZE_PX}px;min-width:${PLAY_BUTTON_MIN_SIZE_PX}px;` +
        `border:none;border-radius:14px;background:#4fc3f7;color:#0a0a14;cursor:pointer;` +
        `font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(79,195,247,0.3);` +
        `margin-top:16px;transition:transform 0.1s,box-shadow 0.1s;`;
      playBtn.onmouseenter = () => {
        playBtn.style.transform = 'scale(1.05)';
      };
      playBtn.onmouseleave = () => {
        playBtn.style.transform = 'scale(1)';
      };

      playBtn.addEventListener(
        'click',
        async () => {
          playBtn.disabled = true;
          playBtn.textContent = 'Loading...';
          deps.unlockAudio(); // mobile constraints — fire on first user interaction
          await deps.initGpu();
          if (deps.loadBundle) {
            await deps.loadBundle('scene-perf');
          }
          deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: false });
          deps.goto('game');
        },
        { once: true },
      );

      wrapper.append(badge, title, levelIndicator, playBtn);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
    },
  };
};
