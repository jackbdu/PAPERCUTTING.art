import { vector } from "../utils/index.js";

const lineDistance = (p, a, b) => {
  const ab = vector.sub(b, a);
  const ap = vector.sub(p, a);
  const projectedAPLength = vector.dot(ap, vector.normalize(ab));
  const projectedAP = vector.setMag(ab, projectedAPLength);
  return vector.mag(vector.sub(ap, projectedAP));
};

const findFarthestIndex = (path, startIndex, endIndex, epsilon) => {
  const start = path[startIndex];
  const end = path[endIndex];
  let farthestIndex = -1;
  let farthestDist = epsilon;
  for (let i = startIndex; i < endIndex; i++) {
    const next = path[i];
    const dist = lineDistance(next, start, end);
    if (dist > farthestDist) {
      farthestDist = dist;
      farthestIndex = i;
    }
  }
  return farthestIndex;
};

const rdp = (path, startIndex, endIndex, epsilon) => {
  const farthestIndex = findFarthestIndex(path, startIndex, endIndex, epsilon);
  const simplifiedPath = [];
  simplifiedPath.push(path[startIndex]);
  if (farthestIndex > 0) {
    const simplifiedPathA = rdp(path, startIndex, farthestIndex, epsilon);
    const simplifiedPathB = rdp(path, farthestIndex, endIndex, epsilon);
    for (let i = 1; i < simplifiedPathA.length - 1; i++) {
      simplifiedPath.push(simplifiedPathA[i]);
    }
    simplifiedPath.push(path[farthestIndex]);
    for (let i = 1; i < simplifiedPathB.length - 1; i++) {
      simplifiedPath.push(simplifiedPathB[i]);
    }
  }
  simplifiedPath.push(path[endIndex]);
  return simplifiedPath;
};

// Reference: https://www.youtube.com/watch?v=nSYw9GrakjY
const simplifyPath = (polygon, epsilon = 1) => {
  return rdp(polygon, 0, polygon.length - 1, epsilon);
};

export { simplifyPath };
