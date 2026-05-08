/**
 * Loss sequence — brief pause + fade out + transition.
 *
 * Timeline (600ms total):
 *   0ms    — freeze camera, Lost state already set by caller
 *   0ms    — runner falls below viewport (no intervention animation)
 *   400ms  — fade overlay begins (200ms fade)
 *   600ms  — navigate to results
 *
 * Uses GSAP delayedCall — no setTimeout.
 */

import gsap from 'gsap';

export interface LossSequenceOptions {
  /** Called immediately to freeze camera. */
  onCameraFreeze: () => void;
  /** Called when transition fires (navigate to results). */
  onTransition: () => void;
  /** Optional: overlay to fade in. */
  fadeOverlay?: { alpha: number } | null;
  /** Skip animation timings (for tests). */
  skipAnimation?: boolean;
}

export const runLossSequence = ({
  onCameraFreeze,
  onTransition,
  fadeOverlay = null,
  skipAnimation = false,
}: LossSequenceOptions): Promise<void> =>
  new Promise((resolve) => {
    onCameraFreeze();

    if (skipAnimation) {
      onTransition();
      resolve();
      return;
    }

    // Fade overlay after 400ms pause
    if (fadeOverlay) {
      gsap.to(fadeOverlay, {
        alpha: 1,
        duration: 0.2,
        delay: 0.4,
        ease: 'power1.in',
      });
    }

    // Transition after 600ms total
    gsap.delayedCall(0.6, () => {
      onTransition();
      resolve();
    });
  });
