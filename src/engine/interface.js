import { Paper } from "./paper.js";
import { geometry } from "../core/index.js";
import { InterfacePresets } from "../presets/index.js";

class Interface extends Paper {
  constructor(options) {
    super(options);
    this.manualScrapSelection = true;
    this.loadPreset(InterfacePresets.default);
    this.highlightedFill = options?.highlightedFill ?? "#fcd303";
    this.hideSecondary = true;
    this.hide = false;
  }

  updateScrapCandidates(x, y) {
    this.pieces =
      this.pieces?.map((piece) => {
        if (piece && typeof piece === "object") piece.scrapCandidate = geometry.pointInPolygon(x, y, piece?.contour ?? []) ?? false;
        return piece;
      }) ?? [];
  }

  update(x1, y1, x2, y2, viewportScale = 1) {
    if (this.manualScrapSelection) this.updateScrapCandidates(x2, y2);
    this.updateScraps();
  }

  toggleSecondary() {
    this.hideSecondary = !this.hideSecondary;
  }

  toggle() {
    this.hide = !this.hide;
  }

  getScrapsGraphics() {
    return {
      style: { fill: this.fill },
      children: this.scraps.map((piece) => ({
        path: this.pieceToPath(piece),
      })),
    };
  }

  checkVisibility(piece) {
    return (!this.hide && piece?.type === "primary") || !this.hideSecondary;
  }

  getMainPiecesGraphics() {
    return {
      style: { fill: this.fill },
      children: this.pieces
        .filter((piece) => this.checkVisibility(piece))
        .filter((piece) => !piece.scrapCandidate)
        .map((piece) => ({
          transform: { translate: { x: 0, y: 0, z: 64 } },
          path: this.pieceToPath(piece),
        })),
    };
  }

  getScrapCandidatesGraphics(mouseIsPressed) {
    return {
      style: { fill: this.highlightedFill },
      children: this.pieces
        .filter((piece) => this.checkVisibility(piece))
        .filter((piece) => piece.scrapCandidate)
        .map((piece) => ({
          transform: { translate: { x: 0, y: 0, z: 0 } },
          path: this.pieceToPath(piece),
        })),
    };
  }

  hoveredCommands() {
    const hoveredPieces = this.pieces?.filter((piece) => this.checkVisibility(piece)).filter((piece) => piece.scrapCandidate) ?? [];
    return hoveredPieces.map((piece) => piece.command);
  }

  mousePressed() {
    const pressedPieces = this.pieces?.filter((piece) => this.checkVisibility(piece)).filter((piece) => piece.scrapCandidate) ?? [];
    this.scraps = [...this.scraps, ...JSON.parse(JSON.stringify(pressedPieces))];
    return pressedPieces.map((piece) => piece.command);
  }
}

export { Interface };
