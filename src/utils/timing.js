const linear = (t) => t;
const easeIn = (t) => 1 - Math.cos(Math.PI * 0.5 * t);
const easeOut = (t) => -Math.cos(Math.PI * 0.5 + Math.PI * 0.5 * t);
const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const mapTiming = (fn, t, tStart = 0, tStop = 1, oStart = 0, oStop = 1, clamp = true) => {
  if (clamp && ((tStart < tStop && t < tStart) || (tStart > tStop && t > tStart))) t = tStart;
  if (clamp && ((tStart < tStop && t > tStop) || (tStart > tStop && t < tStop))) t = tStop;
  return oStart + (oStop - oStart) * fn((t - tStart) / (tStop - tStart));
};

export { linear, easeIn, easeOut, easeInOut, mapTiming };
