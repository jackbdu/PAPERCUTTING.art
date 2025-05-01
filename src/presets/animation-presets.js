import { seededRandom, linear, easeIn, easeOut, easeInOut, mapTiming } from "../utils/index.js";

const AnimationPresets = {
  wavy: (paper, t, seed = 0) => {
    const graphics = {};
    // WAVY ANIMATION
    const animatePoint = (point) => {
      const amplitude = 16;
      return {
        x: point.x,
        y: point.y,
        z: amplitude * Math.sin((point.x / paper.width + point.y / paper.height) * 8 + t * Math.PI * 8),
      };
    };
    graphics.path = {
      points: paper.mainPiece.contour.map(animatePoint),
      holes: paper.mainPiece?.holes?.map((hole) => ({ path: { points: hole.map(animatePoint) } })) ?? [],
    };
    return graphics;
  },
  rotateAroundY: (paper, t, seed = 0) => {
    const graphics = {};
    // SIMPLE ROTATION BACK AND FORTH
    graphics.transform = { rotateY: mapTiming(easeInOut, t, 0, 1, 0, Math.PI * 2) };
    graphics.children = [paper.mainPiecesGraphics];
    return graphics;
  },
  wavyRotateAroundY: (paper, t, seed = 0) => {
    const graphics = {};
    const maxAmplitude = Math.min(paper.width, paper.height) / 8;
    const waveFrequency = 2;
    // WAVY ANIMATION
    const animatePoint = (point) => {
      const amplitude = t < 0.5 ? mapTiming(easeIn, t, 0, 0.5, 0, maxAmplitude) : mapTiming(easeOut, t, 0.5, 1, maxAmplitude, 0);
      return {
        x: point.x,
        y: point.y,
        z: -amplitude * Math.sin((point.x / paper.width + point.y / paper.height) * Math.PI + t * Math.PI * 2 * waveFrequency),
      };
    };
    graphics.transform = { rotateY: mapTiming(easeInOut, t, 0, 1, 0, Math.PI * 2) };
    graphics.children = [
      {
        path: {
          points: paper.mainPiece.contour.map(animatePoint),
          holes: paper.mainPiece?.holes?.map((hole) => ({ path: { points: hole.map(animatePoint) } })) ?? [],
        },
      },
    ];
    return graphics;
  },
  scrapsFlipAway: (paper, t, seed = 0) => {
    const random = seededRandom(seed);
    const graphics = {};
    // SCRAPS FLIPPING UP
    const maxZ = paper.height;
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = { rotateX: mapTiming(easeIn, t, 0, 1, Math.PI * 0.25, 0) };
    const holesTransform = {
      translate: {
        x: 0,
        y: mapTiming(easeIn, t, 0, 1, -paper.height / 2, -paper.height),
      },
      rotateX: mapTiming(easeIn, t, 0, 1, 0, Math.PI * 0.5),
    };
    const holesGraphics = {
      transform: holesTransform,
      children: holes.map((hole, holeIndex, holesArray) => {
        const holeTransform = {
          rotateX: mapTiming(linear, t, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, 0.25 * Math.PI, 0.5 * Math.PI)),
        };
        const holeTransformPostRotation = {
          translate: { x: -holesTransform.translate.x, y: -holesTransform.translate.y },
        };
        const animatePoint = (point) => {
          const offsetZ = mapTiming(easeIn, point.y / paper.height, 0, 1, 0, t * maxZ);
          return {
            x: point.x,
            y: point.y,
            z: (point?.z ?? 0) + offsetZ,
          };
        };
        return {
          transform: holeTransform,
          children: [
            {
              transform: holeTransformPostRotation,
              path: {
                points: hole?.map(animatePoint) ?? [],
              },
            },
          ],
        };
      }),
    };
    graphics.transform = globalTransform;
    graphics.children = [paper.mainPiecesGraphics, holesGraphics];
    return graphics;
  },
  scrapsFlipAwayAndCameraMotion: (paper, t, seed = 0) => {
    const random = seededRandom(seed);
    const graphics = {};
    // SCRAPS FLIPPING UP WITH ROTATION AND ZOOM
    const maxZ = paper.height;
    const holes = paper.mainPiece?.holes ?? [];
    const scale = mapTiming(easeInOut, t, 0, 1, 0.5, 1);
    const globalTransform = {
      rotateX: mapTiming(easeInOut, t, 0, 0.8, Math.PI * 0.35, 0),
      rotateZ: mapTiming(easeInOut, t, 0, 0.8, Math.PI * 0.5, 0),
      scale: { x: scale, y: scale },
    };
    const holesTransform = {
      translate: {
        x: 0,
        y: mapTiming(easeIn, t, 0, 1, -paper.height / 2, -paper.height),
      },
    };
    const holesGraphics = {
      transform: holesTransform,
      children: holes.map((hole, holeIndex, holesArray) => {
        const randomDelay = mapTiming(linear, random(), 0, 1, 0.01, 0.8);
        const delayedT = t < randomDelay ? 0 : mapTiming(linear, t, randomDelay, 1, 0, 1);
        const holeTransform = {
          rotateX: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, 0.8 * Math.PI, 1 * Math.PI)),
        };
        const holeTransformPostRotation = {
          translate: { x: -holesTransform.translate.x, y: -holesTransform.translate.y },
        };
        const animatePoint = (point) => {
          const offsetZ = mapTiming(easeIn, point.y / paper.height, 0, 1, 0, delayedT * maxZ);
          return {
            x: point.x,
            y: point.y,
            z: (point?.z ?? 0) + offsetZ,
          };
        };
        return {
          transform: holeTransform,
          children: [
            {
              transform: holeTransformPostRotation,
              path: {
                points: hole?.map(animatePoint) ?? [],
              },
            },
          ],
        };
      }),
    };
    graphics.transform = globalTransform;
    graphics.children = [paper.mainPiecesGraphics, holesGraphics];
    return graphics;
  },
};

export { AnimationPresets };
