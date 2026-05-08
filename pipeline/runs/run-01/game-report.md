---
type: game-report
game: Velocity Rush
pipeline_version: "0.3.13"
run: 01
pass: core
status: partial
features:
  total: 20
  implemented: 20
  partial: 0
  deferred: 0
tests:
  new: 65
  passing: 206
  total: 206
issues:
  critical: 0
  minor: 2
cos:
  - id: core-interaction
    status: partial
    note: "silent airborne tap is intentional GDD design (not a CoS violation per se); interaction archetype created; pointer events + tap-blocked-in-terminal-states confirmed"
  - id: canvas
    status: pass
    note: "runner 48×96px well above 48×48 floor; platform visual identity clear (grey/lighter-grey/accent); white void background gives strong negative space; HUD 80pt does not overlap play area"
  - id: animated-dynamics
    status: partial
    note: "no formal event queue — physics tick calls renderer methods synchronously (functional equivalent for single-entity game); all GSAP animations confirmed; stable IDs on platforms; no instant state changes"
  - id: scoring
    status: pass
    note: "3 multiplicative dimensions: heightReached × (1000/elapsedMs) × (16.67/avgFrameMs); 2× faster run = 2× score; 2× better frame efficiency = 2× score; skilled vs beginner ratio > 3× achieved"
completeness:
  items_required: 22
  items_met: 19
  items_gaps: 3
blocking:
  cos_failed: []
  completeness_gaps:
    - "gesture-60fps-mobile: cannot verify gesture detection on real mobile device (browser-mcp-unavailable in this environment)"
    - "animated-dynamics-event-queue: no formal event queue — synchronous inline renderer calls; functional equivalent for this single-entity game archetype but does not satisfy the strict exit criterion"
    - "core-interaction-silent-airborne: GDD explicitly specifies 'tap while airborne: no effect'; CoS requires visible invalid-gesture feedback; documented tension, interaction archetype explains the design decision"
---

# Pipeline Report: Velocity Rush

## Status: PARTIAL

## Blocking issues — must resolve before next pass

These items prevented a `complete` status but do not block gameplay:

- **CoS partial — `condition-core-interaction`**: Silent airborne tap is intentional per GDD ("tap while airborne: no effect"). CoS requires visible invalid-gesture feedback. The archetype document documents this design tension. Next pass should either add a subtle visual cue for blocked taps (e.g., brief pulse on runner) or escalate as a GDD-CoS waiver.

- **CoS partial — `condition-animated-dynamics`**: No formal event queue between physics resolution and visual playback. For this single-entity platformer, physics tick directly calls `RunnerRenderer.playJumpStretch()` / `playLandSquash()` synchronously. This is functionally equivalent for Velocity Rush but does not satisfy the "separate systems connected by an event queue" exit criterion. Next pass: extract animation calls into a dispatched event list.

- **Completeness gap — gesture-60fps-mobile**: Browser MCP unavailable in this environment; cannot verify 60 fps tap detection on physical mobile device. Next pass should include a device test.

## Features

- [x] loading-screen — white background, centered progress bar, no branding
- [x] start-screen — 'Velocity Rush' title, level indicator, 'PERF MODE' badge, 44×44pt Play button
- [x] results-screen — dual branch (Level Complete / Try Again), no 'Game Over' language, perf metrics
- [x] game-controller-gpu — Pixi Application, full physics loop, tap input, all renderers wired
- [x] asset-manifest-scene-perf — `scene-perf` GPU bundle with correct prefix
- [x] game-state-signals — heightReached, elapsedTimeMs, avgFrameTimeMs, currentSeed, winState
- [x] screen-shell-wiring — all 4 screen IDs (loading, start, game, results) wired in config.ts
- [x] runner-entity — dark charcoal 1×2 unit rectangle, seeded horizontal drift, wrap
- [x] physics-system — gravity −28 u/s², jump +14 u/s, terminal velocity −20 u/s, coyote 120 ms
- [x] platform-static — mid-grey rectangle, one-way collision, first platform spawn guaranteed
- [x] platform-moving — lighter-grey tint, horizontal oscillation, runner carry
- [x] platform-crumbling — dashed outline, 0.4s contact timer, 0.3s shake animation
- [x] platform-exit — accent color from seed, arrow emoji, 0.3s contact win trigger
- [x] procedural-level-gen — seed = level × 99991, mulberry32 PRNG, solvability check, safe-mode fallback, < 16ms
- [x] camera-system — auto-scroll upward at cameraSpeed, dead zone, freeze on Won/Lost
- [x] hud-strip — 80pt GPU Pixi band, height meter, elapsed time mm:ss
- [x] board-state-machine — Idle/Airborne/CoyoteWindow/Animating/Won/Lost/Paused, pure functions
- [x] win-sequence — exit pulse (400ms) + victory bounce (300ms) + 700ms total, GSAP delayedCall
- [x] loss-sequence — 400ms pause + 200ms fade + camera freeze, GSAP delayedCall
- [x] scoring — perf score formula: heightReached × speed × frame-efficiency (3 multiplicative dims)

## CoS Compliance — pass `core`

| CoS | Status | Evidence / note |
|---|---|---|
| `core-interaction` | partial | Tap → jump in Idle/CoyoteWindow; blocked in Won/Lost; silent airborne tap is GDD-spec, not a bug; archetype doc created |
| `canvas` | pass | Runner 48×96px ≥ 48×48 floor; platforms color-coded (grey/lighter/accent); HUD 80pt no overlap |
| `animated-dynamics` | partial | All transitions GSAP-animated; stable platform IDs; no formal event queue (synchronous calls) |
| `scoring` | pass | 3 multiplicative dims confirmed; 2× faster = 2× score; >3× skill ratio achieved |

## Completeness — pass `core`

| Area | Required | Met | Gaps |
|---|---|---|---|
| Interaction | 5 | 4 | 1 (60fps mobile unverified) |
| Board & Pieces | 4 | 4 | 0 |
| Core Mechanics | 6 | 6 | 0 |
| Scoring (base) | 3 | 3 | 0 |
| CoS mandatory | 4 | 2 pass + 2 partial | 2 partial items |

## Known Issues

- **Minor**: `copy-mismatch:start-screen-badge` — GDD says 'perf mode' (lowercase); code renders 'PERF MODE' (uppercase with CSS text-transform). Visually identical due to CSS. No gameplay impact.
- **Minor**: Build exits with SIGKILL in CI (OOM — large Vite bundle > 1.5k modules). The `verify` phase ran a successful build (0 errors); the SIGKILL is an environment memory constraint, not a code error. Tests run cleanly under vitest run (206/206 pass).

## Deferred

No features deferred from the core pass. All 20 GDD features are implemented.

## Recommendations

1. **Next pass (secondary) must address**: Add a subtle visual cue for blocked taps (e.g., brief runner pulse when airborne tap is ignored). This closes the core-interaction partial without new mechanics.
2. **Next pass**: Introduce a formal animation event queue between physics tick and renderer dispatch. The single-entity architecture makes this low-risk — extract `{ type, data }` events from the tick function and drain them in a separate render loop.
3. **Device testing**: Run on physical iOS device to confirm 60fps tap detection and HUD layout at safe-area insets.
