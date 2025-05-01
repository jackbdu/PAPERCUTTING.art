// https://github.com/processing/p5.js/blob/0e0ca80d6018392bba0bfca84a3a213492af7412/src/math/p5.Vector.js

const heading = (v) => Math.atan2(v.y, v.x);

const mag = (v) => Math.sqrt(v.x ** 2 + v.y ** 2);

const sub = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

const mult = (v, n) => ({ x: v.x * n, y: v.y * n });

const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

const normalize = (v) => {
  const len = mag(v);
  if (len !== 0) return mult(v, 1 / len);
  return { x: 0, y: 0 };
};

const setMag = (v, m) => mult(normalize(v), m);

const rotate = (v, a) => {
  let newHeading = heading(v) + a;
  const len = mag(v);
  const x = Math.cos(newHeading) * len;
  const y = Math.sin(newHeading) * len;
  return { x, y };
};

const lerp = (a, b, amount) => {
  return { x: a.x + (b.x - a.x) * amount || 0, y: a.y + (b.y - a.y) * amount || 0 };
};

export { heading, mag, sub, mult, dot, normalize, setMag, rotate, lerp };
