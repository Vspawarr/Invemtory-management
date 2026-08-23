/** Deterministic pseudo-random helpers shared by the Digital Farm's
 * instanced planting/vegetation placement — layouts must stay stable
 * across re-renders instead of reshuffling every frame, so nothing here
 * uses Math.random()'s global, unseedable state. */

/** mulberry32 PRNG, seeded from a plain integer. */
export function seededRandom(seed: number): () => number {
  let t = seed;
  return function next() {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
