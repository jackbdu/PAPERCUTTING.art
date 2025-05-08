import pkg from "../../package.json";
import { dist, vector, polygon, rectangle } from "../utils/index.js";
import { geometry, simplifyPath } from "../core/index.js";
import { AnimationPresets } from "../presets/index.js";
import { getBoundingBox } from "./render-utils.js";

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
    const { pieces, scraps, polycuts, rotation, xFlipped, yFlipped, ...filteredSnapshot } = this.toSnapshot();
    const loadedPreset = this.preprocess(preset);
    const presetOptions = {
      ...filteredSnapshot,
      ...loadedPreset,
    };
    this.loadOptions(presetOptions);
  }

  scalePiece(piece, w, h) {
    const validatePoint = (point) => point?.x && point?.y;
    const scalePoint = (point, w, h) => ({
      x: point.x * w,
      y: point.y * h,
    });
    const scalePath = (path, w, h) => path.map((point) => scalePoint(point, w, h));
    const scaledPiece = { ...piece };
    if (piece?.contour && Array.isArray(piece.contour)) scaledPiece.contour = scalePath(piece.contour.filter(validatePoint), w, h);
    if (piece?.holes && Array.isArray(piece.holes)) scaledPiece.holes = piece.holes.map((hole) => scalePath(hole?.filter(validatePoint) ?? [], w, h));
    return scaledPiece;
  }

  preprocess(preset) {
    let processed = preset?.data ?? preset ?? {};
    switch (preset?.meta?.format) {
      case "papercut-json-v1-normalized":
        if (processed.pieces) processed.pieces = processed.pieces.map((piece) => this.scalePiece(piece, processed.width ?? this.width, processed.height ?? this.height));
        break;
    }
    return processed;
  }

  toJSON() {
    return this.toSnapshot();
  }

  // DEFINE TRACKED PROPERTIES IN HISTORY SNAPSHOT
  toSnapshot() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: this.fill,
      shape: this.shape,
      rotation: this.rotation,
      xFlipped: this.xFlipped,
      yFlipped: this.yFlipped,
      manualScrapSelection: true,
      pieces: this.pieces,
      polycuts: this.polycuts,
    };
  }

  toExport() {
    const meta = {
      app: pkg.name,
      version: pkg.version,
      format: "papercut-json-v1",
      exported: new Date().toISOString(),
      homepage: pkg.homepage,
      instructions: "To view or edit this file, visit homepage and drag this file to the browser window.",
    };

    const { polycuts, manualScrapSelection, ...filteredSnapshot } = this.toSnapshot();
    const data = filteredSnapshot;

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
        contour = rectangle(0, 0, this.width, this.height);
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

  holeToPath = (hole) => ({ points: hole?.map(this.appendUvToPoint) ?? [] });

  pieceToPath = (piece) => ({
    points: piece.contour?.map(this.appendUvToPoint) ?? [],
    holes: piece.holes?.map((hole) => ({ path: this.holeToPath(hole) })) ?? [],
  });

  getMainPiecesGraphics() {
    return {
      children: this.pieces
        .filter((piece) => !piece.scrapCandidate)
        .map((piece) => ({
          path: this.pieceToPath(piece),
        })),
    };
  }

  getMainHolesGraphics() {
    return {
      children: this.pieces
        .filter((piece) => !piece.scrapCandidate)
        .map((piece) => ({
          children: piece.holes?.map((hole) => ({ path: this.holeToPath(hole) })) ?? [],
        })),
    };
  }

  getScrapCandidatesGraphics() {
    return {
      children: this.pieces
        .filter((piece) => piece.scrapCandidate)
        .map((piece) => ({
          transform: { translate: { x: 0, y: 0, z: -32 } },
          path: this.pieceToPath(piece),
        })),
    };
  }

  getPiecesGraphics() {
    return {
      children: [...this.getMainPiecesGraphics().children, ...this.getScrapCandidatesGraphics().children],
    };
  }

  getScrapsGraphics() {
    return {
      children: this.scraps.map((piece) => ({
        path: this.pieceToPath(piece),
      })),
    };
  }

  getPolycutsGraphics() {
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

  toRenderGraphics() {
    return {
      children: [...this.getPiecesGraphics().children, ...this.getScrapsGraphics().children, ...this.getPolycutsGraphics().children],
    };
  }

  toVideoGraphics(t, presetKey = "dramaticFlip", options) {
    return presetKey in AnimationPresets ? AnimationPresets[presetKey](this, t, options) : this.getMainPiecesGraphics();
  }

  toPrintGraphics() {
    return {
      style: { fill: "#fff" },
      children: [this.getMainPiecesGraphics()],
    };
  }

  toImageGraphics() {
    return {
      style: { fill: this.fill },
      children: [this.getMainPiecesGraphics()],
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
    const rotatePath = (path) => path.map(rotatePoint);
    this.pieces = this.pieces.map((piece) => ({
      contour: rotatePath(piece?.contour ?? []),
      holes: piece?.holes?.map((hole) => rotatePath(hole ?? [])) ?? [],
    }));
    this.polycuts = this.polycuts?.map(rotatePath) ?? [];
    this.rotation = (this.rotation + theta) % (Math.PI * 2);
  }

  setRotate(theta = 0) {
    if (this.rotation !== theta) this.rotate(theta - this.rotation);
  }

  resetRotate() {
    this.setRotate(0);
  }

  flipX() {
    const flipPointX = (point) => ({ x: -point.x, y: point.y });
    const flipPathX = (path) => path.map(flipPointX);
    this.pieces = this.pieces.map((piece) => ({
      contour: flipPathX(piece?.contour ?? []),
      holes: piece?.holes?.map((hole) => flipPathX(hole ?? [])) ?? [],
    }));
    this.xFlipped = !this.xFlipped;
  }

  flipY() {
    const flipPointY = (point) => ({ x: point.x, y: -point.y });
    const flipPathY = (path) => path.map(flipPointY);
    this.pieces = this.pieces.map((piece) => ({
      contour: flipPathY(piece?.contour ?? []),
      holes: piece?.holes?.map((hole) => flipPathY(hole ?? [])) ?? [],
    }));
    this.yFlipped = !this.yFlipped;
  }

  resetFlipX() {
    if (this.xFlipped) this.flipX();
  }

  resetFlipY() {
    if (this.yFlipped) this.flipY();
  }

  resetFlips() {
    this.resetFlipX();
    this.resetFlipY();
  }

  reset() {
    this.resetRotate();
    this.resetFlips();
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
    this.pieces = this.pieces?.map((piece) => this.simplifyPiece(piece)) ?? [];
    this.scraps = this.scraps?.map((piece) => this.simplifyPiece(piece)) ?? [];
  }

  simplifyPiece(piece) {
    const contour = simplifyPath(piece?.contour ?? [], 0.5);
    // REMOVE HOLES OF TINY AREA
    const holes = piece.holes?.map((hole) => simplifyPath(hole ?? [], 0.5)) ?? [];
    return {
      contour,
      holes: holes.filter((hole) => {
        hole = hole?.filter((point) => point?.x && point?.y) ?? [];
        return geometry.getPolygonArea(hole) > 1;
      }),
    };
  }

  cut(x1, y1, x2, y2) {
    let hasImpact = false;
    if (this.pieces.length > 1 && !this.manualScrapSelection) {
      this.sortPieces();
      this.moveSecondaryPiecesToScraps();
    }
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
      this.scraps = [...this.scraps, ...this.pieces.filter((piece) => piece?.scrapCandidate)];
      this.pieces = this.pieces.filter((piece) => !!piece && !piece?.scrapCandidate);
      // THIS IS TO AVOID OVERLAPPING PIECES IF SIMPLIFYING TOO EARLY
    } else {
      this.simplifyPiecesAndScraps();
    }
  }

  // Maybe this could be achieved with transform instead?
  updateScraps() {
    const fallingSpeed = 16;
    this.scraps = this.scraps.map((scrap) => {
      scrap.contour = scrap.contour?.map((point) => ({ x: point?.x ?? 0, y: point?.y ?? 0, z: (point?.z ?? 0) - fallingSpeed }));
      scrap.holes = scrap.holes?.map((hole) => hole.map((point) => ({ x: point.x, y: point.y, z: (point.z ?? 0) - fallingSpeed })));
      return scrap;
    });
    this.removeFarScraps();
  }

  updateScrapCandidates(x, y) {
    if (this.pieces?.length > 1) {
      this.pieces =
        this.pieces?.map((piece) => {
          if (piece && typeof piece === "object") piece.scrapCandidate = geometry.pointInPolygonWithHoles(x, y, piece) ?? false;
          return piece;
        }) ?? [];
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
    this.scraps = this.scraps?.filter((scrap) => scrap?.contour?.at(0)?.z === undefined || scrap?.contour?.at(0)?.z > -this.farPlaneDistance) ?? [];
  }

  sortPieces() {
    // SORT BY COMPLEXITY (PRIORITIZES PIECE WITH MORE HOLES OR TOTAL POINTS)
    this.pieces.sort((pieceA, pieceB) => {
      let a = pieceA?.holes?.length ?? 0;
      let b = pieceB?.holes?.length ?? 0;
      if (a === b) {
        a = pieceA?.holes?.reduce((sum, hole) => sum + (hole?.length ?? 0), pieceA?.contour?.length ?? 0) ?? 0;
        b = pieceB?.holes?.reduce((sum, hole) => sum + (hole?.length ?? 0), pieceB?.contour?.length ?? 0) ?? 0;
      }
      return b - a;
    });
  }

  moveSecondaryPiecesToScraps() {
    this.scraps = [...this.scraps, ...this.pieces.slice(1)];
    this.pieces = this.pieces.slice(0, 1);
  }

  moveMainHolesBy(x, y) {
    if (this.mainPiece && typeof this.mainPiece === "object") this.mainPiece.holes = this.mainPiece.holes?.map((hole) => hole?.filter((point) => point && point.x && point.y).map((point) => vector.add(point, { x, y })) ?? []) ?? [];
  }

  centerHoles() {
    const boundingBox = getBoundingBox(this.getMainHolesGraphics());
    const offsetX = this.x - boundingBox.x;
    const offsetY = this.y - boundingBox.y;
    this.moveMainHolesBy(offsetX, offsetY);
  }
}

export { Paper };
