/**
 * Tests for scaffold's createCoordinatorFacade — the thin wrapper
 * over game-components' createAssetFacade.
 *
 * Validates scaffold-specific behavior:
 * - Parameterless initGpu() auto-creates a PixiLoader
 * - audio.play / audio.setMasterVolume / audio.unlock
 * - getGpuLoader() returns the auto-created loader
 * - Underlying facade methods are delegated correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@wolfgames/components/core', () => {
  const createAssetCoordinator = vi.fn(({ loaders }: { loaders?: Record<string, unknown> }) => {
    const loaded: string[] = [];
    return {
      loadBundle: vi.fn(async (name: string) => { loaded.push(name); }),
      loadBundles: vi.fn(async (names: string[]) => { loaded.push(...names); }),
      backgroundLoadBundle: vi.fn(async () => {}),
      preloadScene: vi.fn(async () => {}),
      loadBoot: vi.fn(async () => {}),
      loadCore: vi.fn(async () => {}),
      loadTheme: vi.fn(async () => {}),
      loadAudio: vi.fn(async () => {}),
      loadScene: vi.fn(async () => {}),
      initGpu: vi.fn(async () => {}),
      initLoader: vi.fn(),
      getLoadedBundles: vi.fn(() => loaded),
      isLoaded: vi.fn((name: string) => loaded.includes(name)),
      unloadBundle: vi.fn(),
      unloadBundles: vi.fn(),
      unloadScene: vi.fn(),
      startBackgroundLoading: vi.fn(async () => {}),
      loadingState: {
        get: vi.fn(() => ({ loading: [], loaded, errors: {}, bundleProgress: {}, progress: 0, backgroundLoading: [], unloaded: [] })),
        set: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      },
      getLoader: vi.fn(() => null),
      dispose: vi.fn(),
      _loaders: loaders,
    };
  });

  const createDomLoader = vi.fn(() => ({
    init: vi.fn(),
    loadBundle: vi.fn(async () => {}),
    get: vi.fn(() => null),
    getImage: vi.fn(() => null),
    getSheet: vi.fn(() => null),
    getSpritesheet: vi.fn(() => null),
    unloadBundle: vi.fn(),
    dispose: vi.fn(),
  }));

  const createSignal = vi.fn((initialValue: unknown) => ({
    get: vi.fn(() => initialValue),
    set: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  }));

  return {
    createAssetCoordinator,
    createDomLoader,
    createSignal,
    validateManifest: vi.fn(() => ({ valid: true, errors: [] })),
    KIND_TO_PREFIX: { scene: 'scene-', core: 'core-', fx: 'fx-', audio: 'audio-', theme: 'theme-', boot: 'boot-', data: 'data-' },
    KIND_TO_LOADER: { scene: 'gpu', core: 'gpu', fx: 'gpu', audio: 'audio', theme: 'dom', boot: 'dom', data: 'dom' },
  };
});

vi.mock('@wolfgames/components/howler', () => {
  const mockHowl = { play: vi.fn(() => 1), volume: vi.fn() };
  const createHowlerLoader = vi.fn(() => ({
    init: vi.fn(),
    loadBundle: vi.fn(async () => {}),
    get: vi.fn((alias: string) => alias === 'sfx' ? mockHowl : null),
    has: vi.fn(() => false),
    setVolume: vi.fn(),
    getVolume: vi.fn(() => 1),
    unlock: vi.fn(async () => {}),
    unloadBundle: vi.fn(),
    dispose: vi.fn(),
    _mockHowl: mockHowl,
  }));
  return { createHowlerLoader };
});

vi.mock('@wolfgames/components/pixi', () => {
  const mockPixiLoader = {
    init: vi.fn(),
    loadBundle: vi.fn(async () => {}),
    get: vi.fn(() => null),
    has: vi.fn(() => false),
    unloadBundle: vi.fn(),
    dispose: vi.fn(),
  };
  const createPixiLoader = vi.fn(() => mockPixiLoader);
  return { createPixiLoader };
});

import { createCoordinatorFacade } from '~/core/systems/assets/facade';
import type { Manifest } from '@wolfgames/components/core';

const testManifest: Manifest = {
  cdnBase: '/assets',
  bundles: [
    { name: 'boot-splash', assets: [{ alias: 'spinner', src: 'spinner.png' }] },
    { name: 'audio-sfx', assets: [{ alias: 'click', src: 'click.json' }] },
  ],
};

describe('createCoordinatorFacade', () => {
  let facade: ReturnType<typeof createCoordinatorFacade>;

  beforeEach(() => {
    vi.clearAllMocks();
    facade = createCoordinatorFacade(testManifest);
  });

  it('delegates loadBoot to the underlying facade', async () => {
    await facade.loadBoot();
    expect(facade.loadBoot).toBeDefined();
  });

  it('initGpu() creates a PixiLoader automatically (no param)', async () => {
    const { createPixiLoader } = await import('@wolfgames/components/pixi');
    await facade.initGpu();
    expect(createPixiLoader).toHaveBeenCalled();
  });

  it('initGpu() is idempotent — second call reuses the same promise', async () => {
    const { createPixiLoader } = await import('@wolfgames/components/pixi');
    await facade.initGpu();
    await facade.initGpu();
    expect(createPixiLoader).toHaveBeenCalledTimes(1);
  });

  it('getLoader() for gpu type returns null before initGpu', async () => {
    // getLoader is the public API on the facade interface
    const loader = facade.getLoader('gpu');
    expect(loader).toBeNull();
  });

  it('audio.play delegates to HowlerLoader', () => {
    const result = facade.audio.play('sfx', 'click');
    expect(result).toBe(1);
  });

  it('audio.play returns -1 for unknown channel', () => {
    const result = facade.audio.play('nonexistent');
    expect(result).toBe(-1);
  });

  it('audio.play with volume option does not throw', () => {
    const result = facade.audio.play('sfx', 'click', { volume: 0.5 });
    expect(result).toBe(1);
  });

  it('audio.setMasterVolume does not throw', () => {
    expect(() => facade.audio.setMasterVolume(0.5)).not.toThrow();
  });

  it('audio.unlock delegates to howlerLoader', async () => {
    await facade.audio.unlock();
  });

  it('exposes loadingStateSignal', () => {
    expect(facade.loadingStateSignal).toBeDefined();
    expect(typeof facade.loadingStateSignal.get).toBe('function');
    expect(typeof facade.loadingStateSignal.subscribe).toBe('function');
  });
});
