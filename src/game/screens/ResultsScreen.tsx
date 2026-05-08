import { Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';
import { computePerfScore } from '~/game/velocity-rush/scoring/PerfScore';

/**
 * Results Screen — two branches based on gameState.winState().
 *
 * Level Complete (win=true):
 *   - Heading: "Level Complete"
 *   - Metrics: height, elapsed time, perf score
 *   - CTAs: "Play Again" (same seed) | "Next Level" (seed+1)
 *
 * Try Again (win=false):
 *   - Heading: "Try Again"
 *   - Metric: height reached
 *   - CTA: single large "Try Again"
 *
 * No "Game Over" language anywhere.
 */
export function ResultsScreen() {
  const { goto } = useScreen();

  const perfScore = () =>
    computePerfScore(
      gameState.heightReached(),
      gameState.elapsedTimeMs(),
      gameState.avgFrameTimeMs(),
    );

  const elapsedFormatted = () => {
    const totalS = Math.floor(gameState.elapsedTimeMs() / 1000);
    const m = Math.floor(totalS / 60);
    const s = totalS % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePlayAgain = () => {
    // Same seed — level stays the same
    gameState.reset();
    void goto('game');
  };

  const handleNextLevel = () => {
    gameState.reset();
    gameState.incrementLevel();
    void goto('game');
  };

  const handleTryAgain = () => {
    gameState.reset();
    void goto('game');
  };

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#0f0f1a] px-6">
      <Show
        when={gameState.winState()}
        fallback={
          // Try Again branch — no "Game Over" language
          <div class="flex flex-col items-center gap-6 w-full max-w-sm">
            <h1 class="text-3xl font-bold text-white">Try Again?</h1>

            <div class="text-center">
              <p class="text-white/50 text-sm mb-1">Height Reached</p>
              <p class="text-4xl font-bold text-white">{gameState.heightReached()}</p>
            </div>

            <Button onClick={handleTryAgain} class="w-full py-4 text-lg">
              Try Again
            </Button>
          </div>
        }
      >
        {/* Level Complete branch */}
        <div class="flex flex-col items-center gap-6 w-full max-w-sm">
          <h1 class="text-3xl font-bold text-white">Level Complete</h1>

          <div class="grid grid-cols-3 gap-4 w-full text-center">
            <div>
              <p class="text-white/50 text-xs mb-1">Height</p>
              <p class="text-2xl font-bold text-white">{gameState.heightReached()}</p>
            </div>
            <div>
              <p class="text-white/50 text-xs mb-1">Time</p>
              <p class="text-2xl font-bold text-white">{elapsedFormatted()}</p>
            </div>
            <div>
              <p class="text-white/50 text-xs mb-1">Perf Score</p>
              <p class="text-2xl font-bold text-[#4fc3f7]">{perfScore()}</p>
            </div>
          </div>

          <div class="flex gap-3 w-full">
            <Button variant="secondary" onClick={handlePlayAgain} class="flex-1">
              Play Again
            </Button>
            <Button onClick={handleNextLevel} class="flex-1">
              Next Level
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
