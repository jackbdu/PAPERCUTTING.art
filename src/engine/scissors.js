import { map, dist, lerp, vector } from "../utils/index.js";
import { CutPresets, ScissorsPresets } from "../presets/index.js";

class Scissors {
  static CUT_MIN_ANGLE = 0;
  static CUT_MAX_ANGLE = -0.2;
  static IDLE_ANGLE = -0.15;
  static ACTIVATED_ANGLE = -0.2;

  constructor(options) {
    this.time = 0;
    this.px = undefined;
    this.py = undefined;
    this.x = options?.x ?? 0;
    this.y = options?.y ?? 0;
    this.scale = options?.scale ?? 100;
    this.moveSmoothing = options?.moveSmoothing ?? 0.8;
    this.rotateSmoothing = options?.rotateSmoothing ?? 0.95;
    this.direction = options?.direction ?? { x: 0, y: -1 };
    this.aimSize = options?.aimSize ?? 0.02;
    this.soundPath = options?.soundPath ?? "";
    this.cutType = CutPresets.SMOOTH;
    this.design = ScissorsPresets.DEFAULT;
    this.rotateX = 0;
    this.cuttingActivated = false;
    this.isCutting = false;
    this.hideBody = false;
    this.hideAim = false;
    this.popening = undefined;
    const sound = new Audio(this.soundPath);
    sound.addEventListener("loadeddata", () => {
      this.sound = sound;
    });
  }

  // scale must be a number
  get scale() {
    return this._scale;
  }

  set scale(s) {
    this._scale = s;
  }

  get rotateSmoothing() {
    return Math.min(this.scale / 30, 1) * this._rotateSmoothing;
  }

  set rotateSmoothing(n) {
    this._rotateSmoothing = n;
  }

  get aim() {
    const anchorX = this.design?.anchor?.x ?? 0;
    return {
      style: {
        stroke: this.isCutting ? "#0f0" : "#aaa",
        lineWidth: 1,
      },
      path: {
        points: [
          { x: -anchorX - this.aimSize, y: 0 - this.aimSize },
          { x: -anchorX, y: 0 },
          { x: -anchorX + this.aimSize, y: 0 + this.aimSize },
          { x: -anchorX, y: 0 },
          { x: -anchorX - this.aimSize, y: 0 + this.aimSize },
          { x: -anchorX, y: 0 },
          { x: -anchorX + this.aimSize, y: 0 - this.aimSize },
          { x: -anchorX, y: 0 },
        ],
      },
    };
  }

  get opening() {
    const CUT_FREQUENCY = 200 / this.scale;
    const TEETH_FREQUENCY = 800 / this.scale;
    const CIRCLES_FREQUENCY = 400 / this.scale;
    if (this.isCutting) {
      switch (this.cutType) {
        case CutPresets.TEETH:
          return map(Math.cos(TEETH_FREQUENCY * (this.time / 1000) * Math.PI * 2), -1, 1, Scissors.CUT_MIN_ANGLE, Scissors.CUT_MAX_ANGLE);
        case CutPresets.CIRCLES:
        case CutPresets.TRIANGLES:
          return map(Math.cos(CIRCLES_FREQUENCY * (this.time / 1000) * Math.PI * 2), -1, 1, Scissors.CUT_MIN_ANGLE, Scissors.CUT_MAX_ANGLE);
        case CutPresets.SMOOTH:
        default:
          return map(Math.cos(CUT_FREQUENCY * (this.time / 1000) * Math.PI * 2), -1, 1, Scissors.CUT_MIN_ANGLE, Scissors.CUT_MAX_ANGLE);
      }
    } else if (this.cuttingActivated) {
      return Scissors.ACTIVATED_ANGLE;
    }
    return Scissors.IDLE_ANGLE;
  }

  set direction(v) {
    this._direction = vector.normalize(v);
  }

  get direction() {
    return this._direction;
  }

  // https://github.com/processing/p5.js/blob/0e0ca80d6018392bba0bfca84a3a213492af7412/src/math/p5.Vector.js#L2128
  get heading() {
    return vector.heading(this.direction);
  }

  get graphics() {
    const anchor = this.design?.anchor ?? { x: 0, y: 0 };
    const aimGraphics = this.hideAim ? [] : [{ transform: { rotateX: this.rotateX, translate: { ...anchor, z: 1 } }, ...this.aim }];
    const bodyGraphics = this.hideBody
      ? []
      : [
          { transform: { rotateZ: this.opening, rotateX: this.rotateX, translate: { ...anchor, z: 1 } }, ...this.design.handle },
          { transform: { rotateZ: this.opening, rotateX: -this.rotateX, translate: { ...anchor, z: 0 }, scale: { x: 1, y: -1 } }, ...this.design.handle },
          { transform: { rotateX: this.rotateX, translate: { ...anchor, z: 2 } }, ...this.design.rivet },
        ];
    if (this.sound && this.popening !== undefined && this.popening < -0.01 && this.opening >= -0.01) {
      this.sound.currentTime = 0.2;
      this.sound.volume = 0.5;
      this.sound.play();
    }
    this.popening = this.opening;
    return {
      transform: {
        translate: { x: this.x ?? 0, y: this.y ?? 0 },
        rotate: this.heading,
        // NOTE Z IS NOT SCALED HERE
        scale: { x: this.scale, y: this.scale },
      },
      children: [...bodyGraphics, ...aimGraphics],
    };
  }

  set cutType(cutType) {
    this._cutType = cutType;
  }

  get cutType() {
    return this._cutType;
  }

  toggleBody() {
    this.hideBody = !this.hideBody;
  }

  toggleAim() {
    this.hideAim = !this.hideAim;
  }

  hide() {
    this.hideBody = true;
    this.hideAim = true;
  }

  unhide() {
    this.hideBody = false;
    this.hideAim = false;
  }

  cycleCutType() {
    const types = Object.values(CutPresets);
    const currentIndex = types.indexOf(this.cutType);
    const nextIndex = (currentIndex + 1) % types.length;
    const nextType = types[nextIndex];
    // console.log(types);
    this.cutType = nextType;
  }

  update(deltaTime, x, y, paperBeingCut) {
    // https://github.com/processing/p5.js/blob/0e0ca80d6018392bba0bfca84a3a213492af7412/src/math/p5.Vector.js#L2657
    const direction = { x: x - this.x, y: y - this.y };
    this.direction = vector.lerp(direction, this.direction, this.rotateSmoothing);
    this.px = this.x;
    this.py = this.y;
    this.x = lerp(x, this.x, this.moveSmoothing);
    this.y = lerp(y, this.y, this.moveSmoothing);
    this.isCutting = paperBeingCut;
    if (this.isCutting) {
      const deltaDistance = dist(this.x, this.y, this.px, this.py);
      this.time += deltaTime * deltaDistance;
    }
  }

  beginCut() {
    this.cuttingActivated = true;
    this.time = 0;
  }

  endCut() {
    this.cuttingActivated = false;
  }
}

export { Scissors };
