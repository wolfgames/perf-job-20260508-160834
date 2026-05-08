import { describe, it, expect } from 'vitest';
import { manifest } from '~/game/asset-manifest';

describe('velocity-rush: asset-manifest', () => {
  it('manifest contains scene-perf bundle', () => {
    const names = manifest.bundles.map((b) => b.name);
    expect(names).toContain('scene-perf');
  });

  it('scene-perf bundle name matches [a-z][a-z0-9-]* pattern', () => {
    const bundle = manifest.bundles.find((b) => b.name === 'scene-perf');
    expect(bundle).toBeDefined();
    expect(bundle!.name).toMatch(/^[a-z][a-z0-9-]*$/);
  });
});
