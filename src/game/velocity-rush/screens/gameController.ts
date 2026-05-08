/**
 * Velocity Rush — GameController (Pixi mode).
 *
 * Wires Pixi Application, physics loop, camera, runner, platforms, and input.
 * Replaces the DOM stub. gameMode = 'pixi'.
 *
 * Layout (portrait 390×844):
 *   - HUD strip: 80pt top
 *   - Play area: 700pt (y=80 to y=780)
 *   - Reserved bottom: 64pt (Wolf logo)
 */

import { Application, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { createSignal } from 'solid-js';
import type { GameControllerDeps, GameController, SetupGame } from '~/game/mygame-contract';
import { HudRenderer } from '~/game/velocity-rush/renderers/HudRenderer';
import {
  createVelocityRushState,
  applyTap,
  applyFall,
  applyLand,
  applyLeavePlatformEdge,
  applyWin,
  applyTimerTick,
  type VelocityRushState,
} from '~/game/velocity-rush/state/BoardPlugin';
import {
  applyGravity,
  applyHorizontalWrap,
} from '~/game/velocity-rush/systems/PhysicsSystem';
import { createCameraState, tickCamera } from '~/game/velocity-rush/systems/CameraSystem';
import { createRunner } from '~/game/velocity-rush/entities/Runner';
import {
  landedOnTop,
  hitsUnderside,
  type Platform,
} from '~/game/velocity-rush/entities/Platform';
import { RunnerRenderer } from '~/game/velocity-rush/renderers/RunnerRenderer';
import { PlatformRenderer } from '~/game/velocity-rush/renderers/PlatformRenderer';
import { generateLevel } from '~/game/velocity-rush/generation/LevelGenerator';
import { runWinSequence } from '~/game/velocity-rush/sequences/WinSequence';
import { runLossSequence } from '~/game/velocity-rush/sequences/LossSequence';
import { mulberry32 } from '~/game/velocity-rush/generation/rng';
import { gameState } from '~/game/state';

const HUD_TOP_PX = 80;
const RESERVED_BOTTOM_PX = 64;
const UNIT_PX = 48;
const TARGET_FRAME_MS = 16.67;
const WIN_CONTACT_MS = 300; // ms on exit platform to trigger win

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('Velocity Rush loading...');

  let app: Application | null = null;
  let runnerRenderer: RunnerRenderer | null = null;
  let hudRenderer: HudRenderer | null = null;
  let platformRenderers: PlatformRenderer[] = [];
  let tickerCleanup: (() => void) | null = null;
  let tapCleanup: (() => void) | null = null;
  let sequencePending = false;

  // Mutable game state
  let rushState: VelocityRushState = createVelocityRushState(gameState.level());
  let runnerPos = { x: 0, y: 0, vx: 0, vy: 0 };
  let camera = createCameraState(gameState.level());
  let platforms: Platform[] = [];
  let exitContactMs = 0;

  // Frame time tracking for perf score
  const frameTimes: number[] = [];
  const maxFrameSamples = 120;
  const recordFrameTime = (ms: number) => {
    frameTimes.push(ms);
    if (frameTimes.length > maxFrameSamples) frameTimes.shift();
  };
  const avgFrameTime = () =>
    frameTimes.length === 0 ? TARGET_FRAME_MS : frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

  const initLevel = (level: number, viewportW: number, viewportH: number, gameLayer: Container) => {
    // Clear old platform renderers
    for (const r of platformRenderers) r.destroy();
    platformRenderers = [];

    const seed = level * 99991;
    rushState = createVelocityRushState(level);
    camera = createCameraState(level);
    exitContactMs = 0;

    // Generate platforms
    const gen = generateLevel(level);
    platforms = gen.platforms;

    for (const p of platforms) {
      const r = new PlatformRenderer(p);
      gameLayer.addChild(r.container);
      platformRenderers.push(r);
    }

    // Runner start position
    const rng = mulberry32(seed);
    const runner = createRunner({ x: viewportW / UNIT_PX / 2, y: 4, rng });
    runnerPos = { x: runner.x, y: runner.y, vx: runner.vx, vy: runner.vy };
  };

  const gotoResults = (deps: GameControllerDeps) => {
    // Write final metrics to game state for results screen
    gameState.setHeightReached(rushState.heightReached);
    gameState.setElapsedTimeMs(rushState.elapsedTimeMs);
    gameState.setAvgFrameTimeMs(avgFrameTime());
    deps.goto('results');
  };

  return {
    gameMode: 'pixi',

    init(container: HTMLDivElement) {
      setAriaText('Velocity Rush — tap to jump');

      app = new Application();

      void app
        .init({
          resizeTo: container,
          background: '#ffffff',
          resolution: Math.min(window.devicePixelRatio, 2),
          autoDensity: true,
        })
        .then(() => {
          if (!app) return;
          container.appendChild(app.canvas as HTMLCanvasElement);

          const { width: W, height: H } = app.screen;

          app.stage.eventMode = 'static';

          const bgLayer = new Container();
          bgLayer.eventMode = 'none';

          const gameLayer = new Container();
          gameLayer.eventMode = 'passive';

          const hudLayer = new Container();
          hudLayer.eventMode = 'none';

          app.stage.addChild(bgLayer, gameLayer, hudLayer);

          // Background
          bgLayer.addChild(
            new Graphics().rect(0, HUD_TOP_PX, W, H - HUD_TOP_PX - RESERVED_BOTTOM_PX).fill(0xffffff),
          );

          // HUD strip (GPU-only, Pixi)
          hudRenderer = new HudRenderer(W);
          hudLayer.addChild(hudRenderer.container);

          // Runner renderer
          runnerRenderer = new RunnerRenderer(UNIT_PX);

          // Init level (adds platforms and runner)
          initLevel(gameState.level(), W, H, gameLayer);
          gameLayer.addChild(runnerRenderer.container);

          runnerRenderer.sync({
            x: runnerPos.x,
            y: runnerPos.y,
            vx: runnerPos.vx,
            vy: runnerPos.vy,
            jumpAnimationDurationMs: 0,
          });

          // Input — tap anywhere fires jump
          const onTap = () => {
            if (sequencePending) return;
            const prev = rushState.board;
            const next = applyTap(prev);
            if (next !== prev) {
              rushState = { ...rushState, board: next };
              runnerPos = { ...runnerPos, vy: next.vy };
              runnerRenderer?.playJumpStretch();
            }
          };

          app.stage.on('pointertap', onTap);
          tapCleanup = () => app?.stage.off('pointertap', onTap);

          // Main game ticker
          let lastTime = performance.now();
          const viewWUnits = W / UNIT_PX;

          const tick = () => {
            const now = performance.now();
            const rawDt = now - lastTime;
            lastTime = now;

            recordFrameTime(rawDt);
            const dt = Math.min(rawDt / 1000, 0.05);
            const board = rushState.board;

            if (board.phase === 'Won' || board.phase === 'Lost' || sequencePending) return;

            // Advance coyote timer
            if (board.phase === 'CoyoteWindow') {
              rushState = { ...rushState, board: applyTimerTick(board, rawDt) };
            }

            // Apply gravity when airborne
            if (board.phase === 'Airborne' || board.phase === 'CoyoteWindow') {
              runnerPos = applyGravity(runnerPos, dt);
            }

            // Integrate position
            runnerPos = {
              ...runnerPos,
              x: runnerPos.x + runnerPos.vx * dt,
              y: runnerPos.y - runnerPos.vy * dt,
            };

            // Horizontal wrap
            runnerPos = applyHorizontalWrap(runnerPos, viewWUnits);

            // Platform collision
            let onPlatform: Platform | null = null;
            for (const p of platforms) {
              if (p.crumbleTimerMs !== undefined && p.crumbleTimerMs !== null && p.crumbleTimerMs < 0) continue;

              const rBody = { x: runnerPos.x, y: runnerPos.y, width: 1, height: 2, vy: runnerPos.vy };
              const cameraOffset = camera.offsetY;

              // Adjust platform y relative to camera
              const adjPlatform = { ...p, y: p.y - cameraOffset };

              if (board.phase === 'Airborne' && runnerPos.vy < 0 && landedOnTop(rBody, adjPlatform)) {
                runnerPos = { ...runnerPos, vy: 0, y: adjPlatform.y - 2 };
                rushState = { ...rushState, board: applyLand(rushState.board) };
                runnerRenderer?.playLandSquash();
                onPlatform = p;
              } else if (board.phase === 'Airborne' && runnerPos.vy > 0 && hitsUnderside(rBody, adjPlatform)) {
                runnerPos = { ...runnerPos, vy: 0 };
              } else if (board.phase === 'Idle') {
                // Check if runner is still standing on any platform
                const rBodyIdle = { x: runnerPos.x, y: runnerPos.y, width: 1, height: 2, vy: -0.01 };
                if (landedOnTop(rBodyIdle, adjPlatform)) {
                  onPlatform = p;
                }
              }
            }

            // Idle → CoyoteWindow: runner walked off a platform edge
            if (rushState.board.phase === 'Idle' && onPlatform === null) {
              rushState = { ...rushState, board: applyLeavePlatformEdge(rushState.board) };
            }

            // Moving platform carry
            if (onPlatform?.variant === 'moving' && onPlatform.vx) {
              runnerPos = { ...runnerPos, x: runnerPos.x + onPlatform.vx * dt };
              runnerPos = applyHorizontalWrap(runnerPos, viewWUnits);
            }

            // Exit platform contact timer
            if (onPlatform?.variant === 'exit') {
              exitContactMs += rawDt;
              if (exitContactMs >= WIN_CONTACT_MS && !sequencePending) {
                sequencePending = true;
                rushState = { ...rushState, board: applyWin(rushState.board), winState: true };
                gameState.setWinState(true);
                setAriaText('Level Complete!');

                const exitRenderer = platformRenderers.find((r) => r.container.x === onPlatform!.x * UNIT_PX);
                void runWinSequence({
                  onCameraFreeze: () => {
                    camera = { ...camera, frozen: true };
                  },
                  onTransition: () => gotoResults(deps),
                  exitPlatformContainer: exitRenderer?.container ?? null,
                  runnerContainer: runnerRenderer?.container ?? null,
                });
              }
            } else {
              exitContactMs = 0;
            }

            // Tick camera
            camera = tickCamera(camera, rushState.board.phase, dt);

            // Update metrics
            rushState = {
              ...rushState,
              heightReached: Math.round(camera.offsetY),
              elapsedTimeMs: rushState.elapsedTimeMs + rawDt,
            };

            // Check fall below viewport
            const playAreaHeightUnits = (H - HUD_TOP_PX - RESERVED_BOTTOM_PX) / UNIT_PX;
            if (runnerPos.y > playAreaHeightUnits && !sequencePending) {
              const next = applyFall(rushState.board, { belowViewport: true });
              if (next.phase === 'Lost') {
                sequencePending = true;
                rushState = { ...rushState, board: next, winState: false };
                gameState.setWinState(false);
                setAriaText('Try Again');

                void runLossSequence({
                  onCameraFreeze: () => {
                    camera = { ...camera, frozen: true };
                  },
                  onTransition: () => gotoResults(deps),
                });
              }
            }

            // Sync runner visual
            runnerRenderer?.sync({
              x: runnerPos.x,
              y: runnerPos.y,
              vx: runnerPos.vx,
              vy: runnerPos.vy,
              jumpAnimationDurationMs: 0,
            });

            // Update HUD every frame
            hudRenderer?.update(rushState.heightReached, rushState.elapsedTimeMs);

            // Scroll game layer (camera)
            const scrollPx = camera.offsetY * UNIT_PX;
            gameLayer.y = HUD_TOP_PX - scrollPx;
          };

          app.ticker.add(tick);
          tickerCleanup = () => app?.ticker.remove(tick);
        })
        .catch((err: unknown) => {
          console.error('[velocity-rush] Pixi init failed:', err);
          setAriaText('Error initializing game');
        });
    },

    destroy() {
      if (runnerRenderer?.container) {
        gsap.killTweensOf(runnerRenderer.container);
        gsap.killTweensOf(runnerRenderer.container.scale);
      }
      for (const r of platformRenderers) {
        gsap.killTweensOf(r.container);
      }
      tapCleanup?.();
      tickerCleanup?.();
      for (const r of platformRenderers) r.destroy();
      platformRenderers = [];
      runnerRenderer?.destroy();
      runnerRenderer = null;
      hudRenderer?.destroy();
      hudRenderer = null;
      app?.destroy(true, { children: true });
      app = null;
    },

    ariaText,
  };
};
