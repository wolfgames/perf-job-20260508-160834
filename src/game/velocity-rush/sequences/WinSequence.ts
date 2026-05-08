/**
 * Win sequence — exit pulse + victory bounce + metrics capture + transition.
 *
 * Timeline (700ms total):
 *   0ms    — freeze camera, set Won state
 *   0ms    — exit platform highlight pulse (GSAP, 400ms)
 *   300ms  — runner victory bounce (GSAP, 300ms, after 300ms delay)
 *   600ms  — fade out (placeholder in this pass — screen transition)
 *   700ms  — navigate to results
 *
 * Uses GSAP delayedCall — no setTimeout.
 */

import gsap from 'gsap';

export interface WinSequenceOptions {
  /** Called immediately to freeze camera and camera stop scrolling. */
  onCameraFreeze: () => void;
  /** Called when transition fires (navigate to results). */
  onTransition: () => void;
  /** Optional: animated platform container to pulse. */
  exitPlatformContainer?: { alpha: number; scale: { x: number; y: number } } | null;
  /** Optional: runner container to bounce. */
  runnerContainer?: { y: number } | null;
  /** Skip animation timings (for tests). */
  skipAnimation?: boolean;
}

export const runWinSequence = ({
  onCameraFreeze,
  onTransition,
  exitPlatformContainer = null,
  runnerContainer = null,
  skipAnimation = false,
}: WinSequenceOptions): Promise<void> =>
  new Promise((resolve) => {
    onCameraFreeze();

    if (skipAnimation) {
      onTransition();
      resolve();
      return;
    }

    // Exit platform pulse
    if (exitPlatformContainer) {
      gsap.to(exitPlatformContainer, {
        alpha: 0.4,
        duration: 0.2,
        yoyo: true,
        repeat: 3,
        ease: 'power2.inOut',
      });
    }

    // Runner victory bounce after 300ms
    if (runnerContainer) {
      gsap.to(runnerContainer, {
        y: '-=20',
        duration: 0.15,
        delay: 0.3,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }

    // Transition after 700ms total
    gsap.delayedCall(0.7, () => {
      onTransition();
      resolve();
    });
  });
