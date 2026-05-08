import { onMount, createMemo, Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { useAssets, useLoadingState } from '~/core/systems/assets';
import { useManifest } from '@wolfgames/components/solid';
import { useTuning, type ScaffoldTuning } from '~/core';
import type { GameTuning } from '~/game/tuning';

/**
 * Loading screen — white background, centered progress bar, no branding.
 * WolfGames logo is NOT shown during loading (only after theme loaded and out of loading phase).
 */
export function LoadingScreen() {
  const { goto } = useScreen();
  const assets = useAssets();
  const loadingState = useLoadingState();
  const { manifest } = useManifest();
  const tuning = useTuning<ScaffoldTuning, GameTuning>();

  const m = manifest();
  const bundlesByPrefix = (prefix: string) =>
    (m.bundles as Array<{ name: string }>).filter((b) => b.name.startsWith(prefix)).map((b) => b.name);

  const bootBundles = bundlesByPrefix('boot-');
  const themeBundles = bundlesByPrefix('theme-');

  const shouldSkipStartScreen = (): boolean => {
    if (tuning.game.devMode?.skipStartScreen) return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('screen') === 'game';
  };

  const skipToGame = shouldSkipStartScreen();

  const coreBundles = bundlesByPrefix('core-');
  const audioBundles = bundlesByPrefix('audio-');

  const targetBundles = skipToGame
    ? [...bootBundles, ...themeBundles, ...coreBundles, ...audioBundles]
    : [...bootBundles, ...themeBundles];

  const progress = createMemo(() => {
    const s = loadingState();
    if (targetBundles.length === 0) return 100;
    let sum = 0;
    for (const name of targetBundles) {
      if (s.loaded.includes(name)) {
        sum += 1;
      } else if (s.loading.includes(name)) {
        sum += 0.5;
      }
    }
    return (sum / targetBundles.length) * 100;
  });

  const failedBundles = createMemo(() => {
    const s = loadingState();
    return targetBundles.filter((name) => name in s.errors);
  });

  const retryFailed = async () => {
    const failed = failedBundles();
    for (const name of failed) {
      await assets.loadBundle(name);
    }
  };

  onMount(async () => {
    try {
      if (skipToGame) {
        await assets.loadBoot();
        await assets.loadTheme();
        assets.unlockAudio();
        await assets.initGpu();
        await assets.loadCore();
        await new Promise((r) => setTimeout(r, 300));
        await goto('game');
      } else {
        await assets.loadBoot();
        await assets.loadTheme();
        await new Promise((r) => setTimeout(r, 500));
        await goto('start');
      }
    } catch (err) {
      console.error('[velocity-rush] Failed to load initial assets:', err);
    }
  });

  return (
    // White background — no branding during loading (guardrail #15)
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <Show
        when={failedBundles().length === 0}
        fallback={
          <div class="text-center max-w-sm px-6">
            <p class="text-lg font-semibold text-gray-800 mb-2">Unable to load</p>
            <p class="text-sm text-gray-600 mb-4">
              Failed to load: {failedBundles().join(', ')}
            </p>
            <button
              onClick={retryFailed}
              class="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        }
      >
        {/* Centered progress bar — dark fill on white background */}
        <div class="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gray-800 rounded-full transition-all duration-300"
            style={{ width: `${progress()}%` }}
          />
        </div>
      </Show>
    </div>
  );
}
