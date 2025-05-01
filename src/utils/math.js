const map = (n, srcMin, srcMax, destMin, destMax) => {
  return destMin + ((n - srcMin) / (srcMax - srcMin)) * (destMax - destMin);
};

const dist = (x1, y1, x2, y2) => {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};

const lerp = (start, stop, amount) => {
  return start + (stop - start) * amount || 0;
};

const seededRandom = (seed) => {
  // https://en.wikipedia.org/wiki/Linear_congruential_generator
  const m = 2 ** 32;
  const a = 1664525;
  const c = 1013904223;

  let state = seed;

  return () => {
    state = (state * a + c) % m;
    return state / m;
  };
};

export { map, dist, lerp, seededRandom };
