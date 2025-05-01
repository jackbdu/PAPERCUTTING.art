import pkg from "../../package.json";
import { dist, vector, polygon } from "../utils/index.js";
import { geometry, simplifyPath } from "../core/index.js";
import { AnimationPresets } from "../presets/animation-presets";

const BASE_SNAPPING_DISTANCE = 16;
const BASE_MIN_POINT_GAP = 4;

class Paper {
  constructor(options) {
    this.loadOptions(options);
  }

  loadOptions(options) {
    this.x = options?.x ?? 0;
    this.y = options?.y ?? 0;
    this.width = options?.width ?? 1;
    this.height = options?.height ?? 1;
    this.rotation = options?.rotation ?? 0;
    this.xFlipped = options?.xFlipped ?? false;
    this.yFlipped = options?.yFlipped ?? false;
    this.fill = options?.fill ?? "#fff";
    this.shape = options?.shape ?? "rect";
    this.pieces = options?.pieces ?? this.plainPaper;
    this.scraps = options?.scraps ?? this.scraps ?? [];
    this.minPointGap = options?.minPointGap ?? 1;
    this.farPlaneDistance = options?.farPlaneDistance ?? 5000;
    this.snappingDistance = options?.snappingDistance ?? BASE_SNAPPING_DISTANCE;
    this.polycuts = options?.polycuts ?? [];
    this.manualScrapSelection = options?.manualScrapSelection ?? false;
    this.polycutColor = options?.polycutColor ?? "#ddd";
    this.lastCutHighlighted = false;
    this.beingCut = false;
  }

  loadPreset(preset) {
    const ignoredOptions = {
      pieces: undefined,
      scraps: undefined,
      polycuts: undefined,
      rotation: undefined,
      xFlipped: undefined,
      yFlipped: undefined,
    };
    const presetOptions = {
      ...this.toJSON(),
      ...ignoredOptions,
      ...(preset?.data ?? preset ?? {}),
    };
    this.loadOptions(presetOptions);
  }

  toJSON() {
    // THIS DEFINES WHAT'S TRACKED IN HISTORY
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: this.fill,
      shape: this.shape,
      pieces: this.pieces,
      rotation: this.rotation,
      xFlipped: this.xFlipped,
      yFlipped: this.yFlipped,
      // scraps: this.scraps,
      polycuts: this.polycuts,
      manualScrapSelection: true,
    };
  }

  toExport() {
    const meta = {
      app: "PAPERCUTTING.art",
      url: "https://papercutting.art/",
      version: pkg.version,
      format: "papercut-json-v1",
      exported: new Date().toISOString(),
      instructions: "To view or edit this file, open the URL above in your web browser and drag this file to the window.",
    };

    const data = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: this.fill,
      shape: this.shape,
      pieces: this.pieces.slice(0, 1),
      rotation: this.rotation,
      xFlipped: this.xFlipped,
      yFlipped: this.yFlipped,
      // scraps: this.scraps,
      // polycuts: this.polycuts,
      // manualScrapSelection: true,
    };
    return { meta, data };
  }

  get snappingDistance() {
    return this._snappingDistance;
  }

  set snappingDistance(n) {
    // snappingDistance MUST BE LARGER THAN minPointGap
    this._snappingDistance = Math.max(n, (this.minPointGap ?? 1) + 1);
  }

  get plainPaper() {
    let contour;
    switch (this.shape) {
      case "ellipse":
        contour = polygon(0, 0, this.width, this.height, 64);
        break;
      case "diamond":
        contour = polygon(0, 0, this.width, this.height, 4);
        break;
      default:
        contour = [
          { x: this.x - this.width / 2, y: this.y - this.height / 2 },
          { x: this.x + this.width / 2, y: this.y - this.height / 2 },
          { x: this.x + this.width / 2, y: this.y + this.height / 2 },
          { x: this.x - this.width / 2, y: this.y + this.height / 2 },
          { x: this.x - this.width / 2, y: this.y - this.height / 2 },
        ];
        break;
    }
    return [{ contour, holes: [] }];
  }

  appendUvToPoint = (point) => {
    const resetPoint = vector.rotate(point, -this.rotation);
    if (this.xFlipped) resetPoint.x *= -1;
    if (this.yFlipped) resetPoint.y *= -1;
    let uvVector = { x: (resetPoint.x - this.x) / this.width, y: (resetPoint.y - this.y) / this.height };
    return { x: point.x, y: point.y, z: point.z ?? 0, u: uvVector.x + 0.5, v: uvVector.y + 0.5 };
  };

  videoGraphics(t, presetKey = "scrapsFlipAwayAndCameraMotion", seed = 0) {
    return presetKey in AnimationPresets ? AnimationPresets[presetKey](this, t, seed) : this.mainPiecesGraphics;
  }

  get printGraphics() {
    return {
      style: { fill: "#fff" },
      children: [this.mainPiecesGraphics],
    };
  }

  get imageGraphics() {
    return {
      style: { fill: this.fill },
      children: [this.mainPiecesGraphics],
    };
  }

  get mainPiecesGraphics() {
    return {
      children: this.pieces
        .filter((piece) => !piece.scrapCandidate)
        .map((piece) => ({
          path: {
            points: piece.contour?.map(this.appendUvToPoint) ?? [],
            holes: piece.holes?.map((hole) => ({ path: { points: hole?.map(this.appendUvToPoint) ?? [] } })) ?? [],
          },
        })),
    };
  }

  get scrapCandidatesGraphics() {
    return {
      children: this.pieces
        .filter((piece) => piece.scrapCandidate)
        .map((piece) => ({
          transform: { translate: { x: 0, y: 0, z: -32 } },
          path: {
            points: piece.contour?.map(this.appendUvToPoint) ?? [],
            holes: piece.holes?.map((hole) => ({ path: { points: hole?.map(this.appendUvToPoint) ?? [] } })) ?? [],
          },
        })),
    };
  }

  get piecesGraphics() {
    return {
      children: [...this.mainPiecesGraphics.children, ...this.scrapCandidatesGraphics.children],
    };
  }

  get scrapsGraphics() {
    return {
      children: this.scraps.map((piece) => ({
        path: {
          points: piece.contour?.map(this.appendUvToPoint) ?? [],
          holes: piece.holes?.map((hole) => ({ path: { points: hole.map(this.appendUvToPoint) } })) ?? [],
        },
      })),
    };
  }

  get polycutsGraphics() {
    return {
      children:
        this.polycuts?.map((polycut) => ({
          style: {
            noFill: true,
            stroke: this.polycutColor,
            lineWidth: this.lastCutHighlighted ? 4 : 2,
          },
          path: {
            points: polycut,
          },
        })) ?? [],
    };
  }

  get graphics() {
    return {
      /*
      style: {
        fill: this.fill,
      },
      */
      children: [...this.piecesGraphics.children, ...this.scrapsGraphics.children, ...this.polycutsGraphics.children],
    };
  }

  get mainPiece() {
    return this.pieces[0];
  }

  get lastCutBack() {
    return this.polycuts?.at(-1)?.at(-1);
  }

  get lastCutFront() {
    return this.polycuts?.at(-1)?.at(0);
  }

  get lastCutBackOnPaper() {
    return this.lastCutBack && geometry.pointInPolygonWithHoles(this.lastCutBack.x, this.lastCutBack.y, this.mainPiece);
  }

  get lastCutFrontOnPaper() {
    return this.lastCutFront && geometry.pointInPolygonWithHoles(this.lastCutFront.x, this.lastCutFront.y, this.mainPiece);
  }

  rotate(theta = Math.PI / 4) {
    const rotatePoint = (point) => vector.rotate(point, theta);
    this.pieces = this.pieces.map((piece) => ({
      contour: piece.contour?.map(rotatePoint),
      holes: piece.holes?.map((hole) => hole.map(rotatePoint)),
    }));
    this.polycuts = this.polycuts.map((cut) => cut.map(rotatePoint));
    this.rotation = (this.rotation + theta) % (Math.PI * 2);
  }

  flipX() {
    const flipPointX = (point) => ({ x: -point.x, y: point.y });
    this.pieces = this.pieces.map((piece) => ({
      contour: piece.contour?.map(flipPointX),
      holes: piece.holes?.map((hole) => hole.map(flipPointX)),
    }));
    this.xFlipped = !this.xFlipped;
  }

  flipY() {
    const flipPointY = (point) => ({ x: point.x, y: -point.y });
    this.pieces = this.pieces.map((piece) => ({
      contour: piece.contour?.map(flipPointY),
      holes: piece.holes?.map((hole) => hole.map(flipPointY)),
    }));
    this.yFlipped = !this.yFlipped;
  }

  nearLastCutBack(x, y) {
    return this.lastCutBack && dist(this.lastCutBack.x, this.lastCutBack.y, x, y) <= this.snappingDistance;
  }

  nearLastCutFront(x, y) {
    return this.lastCutFront && dist(this.lastCutFront.x, this.lastCutFront.y, x, y) <= this.snappingDistance;
  }

  meetMinGap(x, y) {
    return this.lastCutBack && dist(this.lastCutBack.x, this.lastCutBack.y, x, y) >= this.minPointGap;
  }

  simplifyPiecesAndScraps() {
    this.pieces = this.pieces.map((piece) => this.simplifyPiece(piece));
    this.scraps = this.scraps.map((piece) => this.simplifyPiece(piece));
  }

  simplifyPiece(piece) {
    const contour = simplifyPath(piece?.contour ?? [], 0.5);
    const holes = piece.holes?.map((hole) => simplifyPath(hole, 0.5)) ?? [];
    return { contour, holes };
  }

  cut(x1, y1, x2, y2) {
    let hasImpact = false;
    if (this.pieces.length > 1 && !this.manualScrapSelection) this.sortPieces();
    if (this.pieces.length === 1) {
      if (this.lastCutBackOnPaper && this.nearLastCutBack(x1, y1)) {
        if (this.meetMinGap(x2, y2)) this.polycuts.at(-1).push({ x: x2, y: y2 });
      } else if (this.lastCutFrontOnPaper && this.nearLastCutFront(x1, y1)) {
        this.polycuts.at(-1).reverse();
        if (this.meetMinGap(x2, y2)) this.polycuts.at(-1).push({ x: x2, y: y2 });
      } else {
        this.polycuts.push(
          dist(x1, y1, x2, y2) > 0
            ? [
                { x: x1, y: y1 },
                { x: x2, y: y2 },
              ]
            : [{ x: x1, y: y1 }]
        );
        const intersections = geometry.polylinePolygonWithHolesIntersections(this.polycuts.at(-1), this.mainPiece);
        const firstPointOnPaper = geometry.pointInPolygonWithHoles(x1, y1, this.mainPiece);
        if (intersections.length >= 1 || firstPointOnPaper) {
          // this.polycuts.push(cut);
          // REPLACE PREVIOUS CUTS (ONLY KEEP LAST ONE)
          this.polycuts.splice(0, this.polycuts.length - 1);
        } else {
          this.polycuts.length -= 1;
        }
      }
      if (this.polycuts.length > 0) {
        const intersections = geometry.polylinePolygonWithHolesIntersections(this.polycuts.at(-1), this.mainPiece);
        if (geometry.polylineBackSelfIntersection(this.polycuts.at(-1))) {
          const polygon = geometry.backSelfIntersectPolylineToPolygon(this.polycuts.at(-1));
          if (polygon?.length > 2) {
            const hole = geometry.setPathOrientation(polygon, 1);
            const contour = geometry.setPathOrientation(polygon, -1);
            this.mainPiece.holes !== undefined ? this.mainPiece.holes.push(hole) : (this.mainPiece.holes = [hole]);
            const cutoutHoles = this.mainPiece.holes.filter((hole) => geometry.polygonInPolygon(hole, contour));
            this.mainPiece.holes = this.mainPiece.holes.filter((hole) => !geometry.polygonInPolygon(hole, contour));
            this.pieces.push({ contour, holes: cutoutHoles });
            this.polycuts.length -= 1;
            hasImpact = true;
          }
        } else if (intersections.length >= 2) {
          this.pieces.splice(0, 1, ...geometry.applyPolylineToPolygonWithHoles(this.mainPiece, this.polycuts.at(-1)));
          this.polycuts.length -= 1;
          hasImpact = true;
        }
      }
      this.beingCut = this.lastCutHighlighted;
    }
    return hasImpact;
  }

  filterScraps() {
    if (this.pieces.length > 1) {
      this.scraps = [...this.scraps, ...this.pieces.filter((piece) => piece.scrapCandidate)];
      this.pieces = this.pieces.filter((piece) => !piece.scrapCandidate);
      // THIS IS TO AVOID OVERLAPPING PIECES IF SIMPLIFYING TOO EARLY
    } else {
      this.simplifyPiecesAndScraps();
    }
  }

  // Maybe this could be achieved with transform instead?
  updateScraps() {
    const fallingSpeed = 16;
    this.scraps = this.scraps.map((scrap, index) => {
      scrap.contour = scrap.contour?.map((point) => ({ x: point?.x ?? 0, y: point?.y ?? 0, z: (point?.z ?? 0) - fallingSpeed }));
      scrap.holes = scrap.holes?.map((hole) => hole.map((point) => ({ x: point.x, y: point.y, z: (point.z ?? 0) - fallingSpeed })));
      return scrap;
    });
    this.removeFarScraps();
  }

  updateScrapCandidates(x, y) {
    if (this.pieces.length > 1) {
      this.pieces = this.pieces.map((piece) => {
        piece.scrapCandidate = geometry.pointInPolygonWithHoles(x, y, piece);
        return piece;
      });
    } else {
      this.manualScrapSelection = false;
    }
  }

  update(x1, y1, x2, y2, viewportScale = 1) {
    this.minPointGap = BASE_MIN_POINT_GAP * viewportScale;
    this.snappingDistance = BASE_SNAPPING_DISTANCE * viewportScale;
    if (this.manualScrapSelection) this.updateScrapCandidates(x2, y2);
    this.beingCut = false;
    if ((this.lastCutBackOnPaper && this.nearLastCutBack(x1, y1)) || (this.lastCutFrontOnPaper && this.nearLastCutFront(x1, y1))) {
      this.lastCutHighlighted = true;
    } else {
      this.lastCutHighlighted = false;
    }
    this.updateScraps();
  }

  removeFarScraps() {
    // this.scraps = [...this.scraps, ...this.pieces.filter((piece) => piece.contour[0].z !== undefined && piece.contour[0].z <= -this.farPlaneDistance)];
    this.scraps = this.scraps.filter((scrap) => scrap.contour?.at(0).z === undefined || scrap.contour?.at(0).z > -this.farPlaneDistance);
  }

  // MOVE PIECE CONTAINING ANCHOR TO FIRST
  sortPieces() {
    this.pieces.sort((pieceA, pieceB) => {
      // SORT BY PIECE COMPLEXITY (PRIORITIZES PIECE WITH MORE POINTS)
      let a = pieceA.holes.length;
      let b = pieceB.holes.length;
      if (a === b) {
        a = pieceA.holes.reduce((sum, hole) => sum + hole.length, pieceA.contour?.length ?? 0);
        b = pieceB.holes.reduce((sum, hole) => sum + hole.length, pieceB.contour?.length ?? 0);
      }
      return b - a;
    });
    this.scraps = [...this.scraps, ...this.pieces.slice(1)];
    this.pieces = this.pieces.slice(0, 1);
  }
}

export { Paper };
