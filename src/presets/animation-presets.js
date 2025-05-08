import { seededRandom, linear, easeIn, easeOut, easeInOut, mapTiming } from "../utils/index.js";

const TAU = Math.PI * 2;

const AnimationPresets = {
  ripple: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const graphics = {};
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
  rotate: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const axis = options?.axis ?? "y";
    const freq = options?.freq ?? 1;

    const graphics = {};
    const globalTransform = {};
    switch (axis) {
      case "x":
        globalTransform.rotateX = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
      case "y":
        globalTransform.rotateY = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
      case "z":
        globalTransform.rotateZ = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
    }
    graphics.transform = globalTransform;
    graphics.children = [paper.getMainPiecesGraphics()];
    return graphics;
  },
  rippleRotate: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const axis = options?.axis ?? "y";
    const freq = options?.freq ?? 1;
    const graphics = {};
    const maxAmplitude = Math.min(paper.width, paper.height) / 8;
    const waveFrequency = 2;

    const globalTransform = {};
    switch (axis) {
      case "x":
        globalTransform.rotateX = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
      case "y":
        globalTransform.rotateY = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
      case "z":
        globalTransform.rotateZ = mapTiming(easeInOut, t, 0, 1, 0, TAU * freq);
        break;
    }

    const animatePoint = (point) => {
      const amplitude = t < 0.5 ? mapTiming(easeIn, t, 0, 0.5, 0, maxAmplitude) : mapTiming(easeOut, t, 0.5, 1, maxAmplitude, 0);
      return {
        x: point.x,
        y: point.y,
        z: -amplitude * Math.sin((point.x / paper.width + point.y / paper.height) * Math.PI + t * TAU * waveFrequency),
      };
    };
    graphics.transform = globalTransform;
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
  flip: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
    const maxZ = paper.height;
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = { rotateX: mapTiming(easeIn, t, 0, 1, Math.PI * 0.25, 0) };
    const holesTransform = {
      translate: {
        x: 0,
        y: mapTiming(easeIn, t, 0, 1, -paper.height / 2, -paper.height),
      },
    };
    const holesGraphics = {
      transform: holesTransform,
      children: holes.map((hole) => {
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
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
  dramaticFlip: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
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
      children: holes.map((hole) => {
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
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
  zoom1: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
    const maxZ = paper.height;
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = {
      translate: {
        x: 0,
        y: 0,
        z: mapTiming(easeInOut, t, 0, 0.8, -100, 0),
      },
    };
    const holesTransform = {
      translate: {
        x: 0,
        y: mapTiming(easeIn, t, 0, 1, -paper.height / 2, -paper.height),
      },
    };
    const holesGraphics = {
      transform: holesTransform,
      children: holes.map((hole) => {
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
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
  zoom2: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = {
      translate: {
        x: 0,
        y: 0,
        z: mapTiming(easeInOut, t, 0, 0.8, -100, 0),
      },
    };
    const holesGraphics = {
      children: holes.map((hole) => {
        const randomDelay = mapTiming(linear, random(), 0, 1, 0.01, 0.8);
        const delayedT = t < randomDelay ? 0 : mapTiming(linear, t, randomDelay, 1, 0, 1);
        const holeTransform = {
          translate: { x: 0, y: 0, z: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -5000, -20000)) },
        };
        return {
          transform: holeTransform,
          path: {
            points: hole ?? [],
          },
        };
      }),
    };
    graphics.transform = globalTransform;
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
  zoom3: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = {
      translate: {
        x: 0,
        y: 0,
        z: mapTiming(easeInOut, t, 0, 0.8, -500, 0),
      },
    };
    const holesGraphics = {
      children: holes.map((hole) => {
        const randomDelay = mapTiming(linear, random(), 0, 1, 0.01, 0.8);
        const delayedT = t < randomDelay ? 0 : mapTiming(linear, t, randomDelay, 1, 0, 1);
        const holeTransform = {
          translate: {
            x: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -10000, 10000)),
            y: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -10000, 10000)),
            z: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -10000, -20000)),
          },
        };
        return {
          transform: holeTransform,
          path: {
            points: hole ?? [],
          },
        };
      }),
    };
    graphics.transform = globalTransform;
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
  zoom4: (paper, t, options = {}) => {
    const seed = options?.seed ?? 0;
    const random = seededRandom(seed);
    const graphics = {};
    const holes = paper.mainPiece?.holes ?? [];
    const globalTransform = {
      scale: {
        x: mapTiming(easeInOut, t, 0, 0.8, 3.5, 2.03),
        y: mapTiming(easeInOut, t, 0, 0.8, 3.5, 2.03),
      },
    };
    const holesGraphics = {
      children: holes.map((hole) => {
        const randomDelay = mapTiming(linear, random(), 0, 1, 0.01, 0.8);
        const delayedT = t < randomDelay ? 0 : mapTiming(linear, t, randomDelay, 1, 0, 1);
        const holeTransform = {
          translate: {
            x: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -1000, 1000)),
            y: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, -1000, 1000)),
            z: mapTiming(linear, delayedT, 0, 1, 0, mapTiming(easeOut, random(), 0, 1, 500, 2000)),
          },
        };
        return {
          transform: holeTransform,
          path: {
            points: hole ?? [],
          },
        };
      }),
    };
    graphics.transform = globalTransform;
    graphics.children = [paper.getMainPiecesGraphics(), holesGraphics];
    return graphics;
  },
};

export { AnimationPresets };
