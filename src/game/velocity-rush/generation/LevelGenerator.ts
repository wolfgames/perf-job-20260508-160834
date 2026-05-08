/**
 * LevelGenerator — deterministic procedural level generation.
 *
 * Seed: levelNumber × 99991.
 * No Math.random() — all randomness via mulberry32 PRNG.
 * Must complete in < 16ms.
 *
 * Difficulty parameters:
 *   level 1–3: static platforms only
 *   level 4+:  movingRatio increases
 *   level 7+:  crumblingRatio increases
 */

import { mulberry32 } from '~/game/velocity-rush/generation/rng';
import { checkSolvability } from '~/game/velocity-rush/generation/SolvabilityChecker';
import {
  createPlatform,
  accentColorFromSeed,
  firstPlatformPosition,
  type Platform,
} from '~/game/velocity-rush/entities/Platform';

export const SAFE_MODE_PLATFORM_WIDTH = 3;
const VIEWPORT_WIDTH_PX = 390;
const UNIT_PX = 48;
const VIEWPORT_WIDTH_UNITS = VIEWPORT_WIDTH_PX / UNIT_PX; // ~8.125

export interface LevelGeneratorOptions {
  forceSafeMode?: boolean;
}

export interface GeneratedLevel {
  platforms: Platform[];
  seed: number;
  safeMode: boolean;
}

const difficultyParams = (level: number) => ({
  platformCount: Math.min(6 + Math.floor(level * 0.8), 14),
  movingRatio: level >= 4 ? Math.min((level - 3) * 0.1, 0.4) : 0,
  crumblingRatio: level >= 7 ? Math.min((level - 6) * 0.08, 0.3) : 0,
  widthMin: Math.max(4 - Math.floor(level * 0.2), 2),
  widthMax: 5,
  gapMin: 0.5,
  gapMax: Math.min(1 + level * 0.1, 3),
  riseMin: 1.5,
  riseMax: Math.min(2 + level * 0.1, 3.2),
  cameraSpeed: Math.min(0.8 + level * 0.02, 2.0),
});

const buildPlatforms = (levelNumber: number, seed: number): Platform[] => {
  const rng = mulberry32(seed);
  const params = difficultyParams(levelNumber);
  const platforms: Platform[] = [];

  // First platform: fixed spawn
  const firstPos = firstPlatformPosition(VIEWPORT_WIDTH_PX);
  platforms.push(createPlatform({ ...firstPos, variant: 'static' }));

  let currentY = firstPos.y;

  for (let i = 1; i < params.platformCount; i++) {
    const isLast = i === params.platformCount - 1;

    if (isLast) {
      // Exit platform
      const x = rng() * (VIEWPORT_WIDTH_UNITS - 3);
      const y = currentY + params.riseMin + rng() * (params.riseMax - params.riseMin);
      const accentColor = accentColorFromSeed(seed);
      platforms.push(createPlatform({ x, y, width: 3, variant: 'exit', accentColor }));
      break;
    }

    const width = params.widthMin + rng() * (params.widthMax - params.widthMin);
    const x = rng() * Math.max(VIEWPORT_WIDTH_UNITS - width, 0.5);
    const y = currentY + params.riseMin + rng() * (params.riseMax - params.riseMin);
    currentY = y;

    // Determine variant
    const roll = rng();
    let variant: Platform['variant'] = 'static';
    const prevVariant = platforms[platforms.length - 1]?.variant;

    if (roll < params.crumblingRatio && prevVariant !== 'crumbling') {
      variant = 'crumbling';
    } else if (roll < params.crumblingRatio + params.movingRatio) {
      variant = 'moving';
    }

    const vx = variant === 'moving' ? (rng() < 0.5 ? 1 : -1) * (1 + rng()) : undefined;
    platforms.push(createPlatform({ x, y: Math.round(y * 10) / 10, width: Math.round(width * 10) / 10, variant, vx }));
  }

  return platforms;
};

const buildSafeModePlatforms = (levelNumber: number): Platform[] => {
  const platforms: Platform[] = [];
  const firstPos = firstPlatformPosition(VIEWPORT_WIDTH_PX);
  platforms.push(createPlatform({ ...firstPos, variant: 'static' }));

  const count = 8;
  let y = firstPos.y;
  let xDir = 1;
  let x = VIEWPORT_WIDTH_UNITS / 2 - SAFE_MODE_PLATFORM_WIDTH / 2;

  for (let i = 1; i < count; i++) {
    y += 2;
    x = Math.max(0, Math.min(VIEWPORT_WIDTH_UNITS - SAFE_MODE_PLATFORM_WIDTH, x + xDir * 1.5));
    xDir *= -1;
    const isLast = i === count - 1;
    const accentColor = isLast ? accentColorFromSeed(levelNumber * 99991) : undefined;
    platforms.push(
      createPlatform({
        x,
        y,
        width: SAFE_MODE_PLATFORM_WIDTH,
        variant: isLast ? 'exit' : 'static',
        accentColor,
      }),
    );
  }

  return platforms;
};

export const generateLevel = (levelNumber: number, opts: LevelGeneratorOptions = {}): GeneratedLevel => {
  const baseSeed = levelNumber * 99991;

  if (opts.forceSafeMode) {
    return { platforms: buildSafeModePlatforms(levelNumber), seed: baseSeed, safeMode: true };
  }

  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const seed = baseSeed + attempt;
    const platforms = buildPlatforms(levelNumber, seed);
    const { solvable } = checkSolvability(platforms);

    if (solvable) {
      return { platforms, seed, safeMode: false };
    }
  }

  // Fallback: safe mode after 10 failed attempts
  return { platforms: buildSafeModePlatforms(levelNumber), seed: baseSeed, safeMode: true };
};
