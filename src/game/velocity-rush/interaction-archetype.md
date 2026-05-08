# Interaction Archetype — Velocity Rush

**Interaction type:** Tap

## Pointer sequence

```
pointertap (or click on web)
  → If board phase is Idle or CoyoteWindow:
      Fire jump impulse (+14 units/s upward)
      Transition board phase → Airborne
      Trigger RunnerRenderer.playJumpStretch()
  → If board phase is Airborne, Won, Lost, or Paused:
      Event ignored silently (no state change)
```

No drag distance threshold is needed. Tap is detected on `pointertap` (Pixi's synthetic event combining `pointerdown` + `pointerup` within a tap radius).

## Direction detection

Not applicable — tap produces a single upward jump regardless of tap location on the canvas.

## Cancel behavior

There is no multi-step gesture to cancel. Each tap is an atomic action: it either produces a jump (allowed phases) or is silently ignored (blocked phases). No selection highlight or in-progress state is visible between `pointerdown` and `pointerup`.

## Invalid gesture feedback

Per the GDD: "Tap while airborne: no effect." Silence is the intended response — the game design explicitly forbids double-jumping. The player learns this constraint in approximately 3 seconds: they tap while in the air, see nothing happen, and understand the rule.

The GDD provides no shake, elastic snap-back, or visual reject for airborne taps. This departs from the general CoS "invalid gesture → visible feedback" guidance because the game's design intent is to enforce the one-tap-one-jump rule via silence (the rule teaches itself).

## Feel description

**Crisp and instantaneous.** Jump impulse fires within the same frame as the tap (≤ 16 ms). The visual stretch animation (scaleY 1.3, 80 ms GSAP) gives the jump physical weight without delaying the physics step. Landing squash (scaleY 0.7 → 1.0, elastic.out) completes the satisfying bounce cycle.

## Input routing

- `app.stage.eventMode = 'static'` — stage receives pointer events
- `gameLayer.eventMode = 'passive'` — passes events to parent stage listener
- `app.stage.on('pointertap', onTap)` — single listener, not per-platform
- `touch-action: none` not set at CSS level (Pixi canvas manages this internally)
- `sequencePending` flag blocks input during win/loss sequences
