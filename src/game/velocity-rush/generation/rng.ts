/**
 * Seeded PRNG: mulberry32
 * Returns values in [0, 1). Used for all randomness in velocity-rush —
 * Math.random() is forbidden in game code.
 */
export const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
