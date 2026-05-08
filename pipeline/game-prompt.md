# Velocity Rush
**Tagline:** Every jump is a quiet decision; every landing is a small victory.
**Genre:** Platformer / Casual Arcade
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
4. [Level Generation](#level-generation)

**How It Flows**
5. [Game Flow](#game-flow)

---

## Game Overview

Velocity Rush is a minimal vertical-scrolling platformer where the player guides a small runner across procedurally generated platforms with a single tap. Each level is a self-contained sprint designed to complete in under three minutes, making it ideal as a lightweight performance benchmark for the game engine. The game strips the genre to its load-bearing essentials — one input, one physics rule, one objective — so every frame of CPU and GPU time goes to proving the renderer, not to feature complexity.

**Setting:** A clean, abstracted void — infinite white space punctuated by solid rectangular platforms in muted monochrome. No narrative dressing; the world exists to host physics.

**Core Loop:** Player taps the screen to jump -> which keeps the runner airborne between platforms -> which advances the runner to the next platform until the level exit is reached.

---

## At a Glance

| | |
|---|---|
| **Play Surface** | Portrait viewport, platforms span 8 logical columns |
| **Input** | Tap (single touch) |
| **Player Entity** | Runner (rectangle, 1×2 units) |
| **Platform Types** | Static, Moving (horizontal), Crumbling |
| **Levels / Run** | 1 procedurally generated level per session |
| **Session Target** | 1–3 min per level |
| **Move Budget** | Unlimited jumps; level ends at exit platform |
| **Chapters at Launch** | N/A — single endless performance loop |
| **Failure** | Yes — fall below viewport bottom |
| **Continue System** | Instant retry; no cost |
| **Star Rating** | None — pass/fail only |
| **Companion** | None |
| **Content Cadence** | N/A — procedural |

---

## Core Mechanics

### Primary Input

**Input type:** Single tap anywhere on the screen.
**Acts on:** The Runner entity.
**Produces:** A fixed-impulse upward jump (if the Runner is grounded or within the coyote-time window).

Tap while airborne: no effect (double-jump is not supported — one tap, one jump).
On web: mouse click maps directly to tap.

### Play Surface

The play surface is a portrait viewport (approximately 9:16 aspect ratio). The camera scrolls upward automatically at a constant speed, tracking the Runner's vertical position with a dead zone. The logical grid is 8 columns wide; each column is equal in width. Vertical space is infinite — level generation extends upward on demand until the exit platform is placed.

There is no horizontal scrolling. The Runner wraps horizontally: exiting the right edge re-enters from the left edge and vice versa.

A HUD strip at the top of the viewport (80pt tall) displays the height meter and elapsed time. The play area occupies the remaining viewport height beneath it.

### Game Entities

#### Runner
- **Visual:** A solid 1×2 unit rectangle in dark charcoal.
- **Behavior:** Controlled by gravity and the player's tap input. Moves horizontally at a constant automatic drift speed (slight left-right oscillation seeded per level). Cannot stop moving horizontally; the player controls only vertical position via jumping.
- **Edge cases:**
  - IF Runner falls below the bottom of the viewport THEN level ends in failure.
  - IF Runner reaches the exit platform and stands still for 0.3 s THEN level ends in success.

#### Static Platform
- **Visual:** A solid rectangle, 2–6 units wide, 0.5 units tall, in mid-grey.
- **Behavior:** Immovable. Runner lands on top surface. Runner passes through from below (one-way collision).
- **Edge cases:**
  - IF Runner hits the underside of a static platform THEN Runner's vertical velocity is zeroed and Runner begins to fall.

#### Moving Platform (horizontal)
- **Visual:** Same rectangle as static, tinted slightly lighter grey. Moves left and right within a bounded lane.
- **Behavior:** Oscillates horizontally between two lane boundaries at a constant speed (1–2 units/s). Carries the Runner with it when the Runner is standing on top.
- **Edge cases:**
  - IF the moving platform pushes Runner into the viewport edge THEN horizontal wrap applies as normal.

#### Crumbling Platform
- **Visual:** Same rectangle as static, with a dashed-outline overlay.
- **Behavior:** Supports the Runner on first contact. After 0.4 s of contact, begins a 0.3 s visual shake animation, then disappears.
- **Edge cases:**
  - IF Runner jumps before crumble completes THEN the platform still crumbles on schedule.
  - IF Runner returns to a crumbled platform THEN no collision — Runner falls through the gap.

#### Exit Platform
- **Visual:** Same rectangle as static, filled with a bright accent color (single highlight color per seed). A small upward-pointing arrow icon is centered on the surface.
- **Behavior:** Static. Level success triggers when the Runner stands on the exit platform for 0.3 s.

### Movement & Physics Rules

All durations below are in milliseconds.

1. IF Runner is grounded AND player taps THEN Runner receives an upward velocity impulse of 14 units/s over 0 ms (instantaneous).
2. IF Runner is airborne AND no tap THEN gravity applies at -28 units/s² each frame.
3. IF Runner's vertical velocity exceeds terminal velocity (-20 units/s downward) THEN clamp velocity to -20 units/s.
4. IF Runner lands on a platform THEN vertical velocity is zeroed and Runner state transitions to Grounded within 1 frame (16 ms).
5. IF Runner walks off a platform edge without jumping (coyote time) THEN Runner may still jump within 120 ms of leaving the edge.
6. IF Runner is on a moving platform THEN Runner's horizontal position is offset by the platform's delta each frame.
7. IF Runner's horizontal position exceeds viewport right edge THEN Runner.x = 0 (wrap).
8. IF Runner's horizontal position is less than viewport left edge THEN Runner.x = viewportWidth (wrap).
9. IF Runner hits underside of any platform THEN Runner vertical velocity = 0, Runner begins falling.
10. IF Runner.y < viewport bottom THEN trigger failure state.

All animations (crumble shake, landing squash, jump stretch) are driven by GSAP. No requestAnimationFrame, no setTimeout for visual updates.

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method

**Procedural** — every level is fully generated at runtime from a numeric seed. No hand-crafted levels. The algorithm runs in under 16 ms on the target device (this is a performance benchmark, so generation speed is itself a metric).

### Generation Algorithm

**Step 1: Seed Initialization**
- Inputs: `levelNumber` (integer, starts at 1 per session)
- Outputs: Seeded PRNG instance (`rng`)
- Constraints: Seed formula is `levelNumber × 99991` (prime multiplier for good distribution). Same seed always produces the same level. `Math.random()` is never called — all randomness goes through `rng`.

**Step 2: Difficulty Parameters**
- Inputs: `rng`, `levelNumber`
- Outputs: `platformCount`, `movingRatio`, `crumblingRatio`, `platformWidthRange`, `gapRange`, `cameraSpeed`
- Constraints:
  - `platformCount` = clamp(12 + floor(levelNumber × 0.5), 12, 30)
  - `movingRatio` = clamp(levelNumber × 0.03, 0, 0.35) — no moving platforms before level 4
  - `crumblingRatio` = clamp((levelNumber - 6) × 0.04, 0, 0.25) — no crumbling platforms before level 7
  - `platformWidthRange` = [max(2, 5 - floor(levelNumber × 0.1)), 6]
  - `gapRange` = [1.5, min(2.5 + levelNumber × 0.05, 4.5)] units — gap must always be jumpable
  - `cameraSpeed` = 0.8 + levelNumber × 0.02 units/s — camera starts slow; never exceeds 2 units/s

**Step 3: Platform Layout**
- Inputs: `rng`, difficulty parameters
- Outputs: Array of platform descriptors (`{ type, x, width, y, moveRange? }`)
- Constraints:
  - First platform is always a static platform of width 4 placed at the viewport center, y = 2 units from bottom. This is the spawn platform — never randomized.
  - Each subsequent platform is placed at a vertical increment of `rng.next(2.5, 4.5)` units above the previous.
  - Horizontal position is chosen so the gap from the nearest previous platform edge is within `gapRange`.
  - Platform type is drawn from a weighted pool (`rng.weightedPick`): static gets (1 - movingRatio - crumblingRatio) weight, moving gets `movingRatio`, crumbling gets `crumblingRatio`.
  - No two consecutive platforms may be both crumbling.
  - Last platform is always the exit platform (static, width 3, accent-colored).

**Step 4: Solvability Check**
- Inputs: Platform array, jump impulse (14 units/s), gravity (-28 units/s²), coyote time (120 ms)
- Outputs: `solvable` boolean
- Constraints:
  - Simulate Runner path using the physics constants. Confirm every gap is reachable from a standing jump on the preceding platform.
  - IF any gap exceeds the max jump arc THEN mark level `invalid`.
  - IF the tallest required jump exceeds `maxJumpHeight` (3.6 units) THEN mark level `invalid`.

### Seeding & Reproducibility

Seed formula: `seed = levelNumber × 99991`

The same seed passed to the PRNG always produces the identical platform sequence. Seeds are stored in the level result payload so a failing run can be exactly reproduced. Failed seeds (those producing an invalid layout) are incremented by 1 and retried (see Solvability Validation).

### Solvability Validation

**Rejection conditions (named):**
- `GAP_TOO_WIDE` — a horizontal gap between consecutive platforms exceeds the maximum jump arc
- `RISE_TOO_HIGH` — the vertical increment between two platforms exceeds `maxJumpHeight`
- `CONSECUTIVE_CRUMBLING` — two adjacent platforms are both crumbling type
- `NO_EXIT` — the final platform is not of type exit

**Retry logic:** On rejection, increment seed by 1 and regenerate. Maximum 10 retries.

**Fallback chain:**
1. Attempt seeded generation (up to 10 retries).
2. If all 10 fail, switch to safe-mode generation: static platforms only, fixed-width (4 units), fixed gap (2 units), fixed rise (3 units). Same seed base, suffix `_safe`.

**Last-resort guarantee:** Safe-mode generation is deterministic and uses only static platforms with gaps provably within jump range. It cannot produce a `GAP_TOO_WIDE` or `RISE_TOO_HIGH` rejection. It always produces a solvable level.

### Hand-Crafted Levels

None. This game is fully procedural. The spawn platform dimensions and exit platform dimensions are hardcoded constants (not random), which guarantees the start and end of every level are always navigable.

---

## Game Flow

### Master Flow Diagram

```
App Open
  ↓ (BOOT phase — asset load, GPU init)
Loading Screen
  ↓ (assets ready)
Start Screen
  ↓ (player taps "Play")
Gameplay Screen [PLAY phase]
  ↓ (Runner reaches exit platform, stands 0.3 s)       → Win Sequence
  ↓ (Runner falls below viewport bottom)               → Loss Sequence

Win Sequence:
  Gameplay Screen → Level Complete Screen [OUTCOME]
    ↓ (player taps "Play Again" or "Next")
  Start Screen (next level seed incremented)

Loss Sequence:
  Gameplay Screen → Try Again Screen [OUTCOME]
    ↓ (player taps "Try Again")
  Gameplay Screen (same seed, same level)
```

### Screen Breakdown

#### Loading Screen
- **lifecycle_phase:** BOOT
- **Purpose:** Initialize GPU renderer and load the single asset bundle (`scene-perf`). Provide visual confirmation the app is alive.
- **What the player sees:** Centered progress bar on a white background. No branding, no animation — minimal DOM.
- **What the player does:** Nothing. Passive wait.
- **What happens next:** When assets are ready, transition to Start Screen.
- **Expected session length:** < 2 s on modern mobile.

#### Start Screen
- **lifecycle_phase:** TITLE
- **Purpose:** Give the player a clear entry point and show the current level seed number.
- **What the player sees:** Game title ("Velocity Rush"), level number indicator, large "Play" button (min 44×44pt), and a small "perf mode" badge.
- **What the player does:** Taps "Play."
- **What happens next:** Transition to Gameplay Screen. Level is generated from the current seed before the screen fade completes.
- **Expected session length:** < 5 s.

#### Gameplay Screen
- **lifecycle_phase:** PLAY
- **Purpose:** Core interaction. Player taps to jump; camera scrolls upward; platforms scroll past.
- **What the player sees:** Play surface (Runner, platforms), HUD strip at top (height meter, elapsed time), viewport wraps horizontally.
- **What the player does:** Taps anywhere on screen to make the Runner jump.
- **What happens next:**
  - IF Runner reaches exit platform → Level Complete Screen.
  - IF Runner falls below viewport → Try Again Screen.
- **Expected session length:** 1–3 min.

#### Level Complete Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Confirm success, display performance metrics (height reached, time elapsed, frame time average).
- **What the player sees:** "Level Complete" heading, height reached, time taken, average frame time (ms), two buttons: "Play Again" (same seed) and "Next Level" (seed + 1).
- **What the player does:** Taps "Play Again" or "Next Level."
- **What happens next:** Transition to Start Screen with the chosen seed.
- **Expected session length:** < 10 s.

#### Try Again Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Gentle failure acknowledgment; encourage immediate retry.
- **What the player sees:** "Try Again?" heading (no "Game Over" language), height reached before fall, a single large "Try Again" button.
- **What the player does:** Taps "Try Again."
- **What happens next:** Gameplay Screen reloads with the same seed (identical level).
- **Expected session length:** < 5 s.

### Board States

| State | Description | Input Allowed |
|---|---|---|
| `Idle` | Runner is grounded; waiting for player input | Yes — tap to jump |
| `Airborne` | Runner is in the air after a jump | No — tap has no effect |
| `CoyoteWindow` | Runner just left a platform edge within 120 ms | Yes — late jump allowed |
| `Animating` | Platform crumble shake or Runner squash/stretch playing | Yes — input queued, not blocked |
| `Won` | Runner stood on exit platform for 0.3 s | No |
| `Lost` | Runner fell below viewport | No |
| `Paused` | System pause (app backgrounded) | No |

All transitions between states that mutate visible elements (crumble, landing squash, jump stretch, camera scroll acceleration) are animated transitions driven by GSAP — no instant state changes.

### Win Condition

`IF Runner.state == Grounded AND Runner.currentPlatform.type == 'exit' AND Runner.groundedDuration >= 0.3 s THEN win = true`

### Lose Condition

`IF Runner.y < viewportBottom THEN loss = true`

### Win Sequence (ordered)

1. Set board state to `Won`.
2. Freeze camera scroll.
3. Play exit platform highlight pulse animation (GSAP, 400 ms).
4. Play Runner victory bounce animation (GSAP, 300 ms).
5. Wait for animations to complete (total 700 ms).
6. Capture performance metrics (height, time, avg frame time).
7. Transition to Level Complete Screen (fade out over 300 ms).
8. Populate Level Complete Screen with captured metrics.

### Loss Sequence (ordered)

1. Set board state to `Lost`.
2. Runner falls below viewport (no intervention animation needed).
3. Freeze camera scroll.
4. Wait 400 ms (brief pause so player registers the failure).
5. Transition to Try Again Screen (fade out over 200 ms).
6. Populate Try Again Screen with height-reached value.
