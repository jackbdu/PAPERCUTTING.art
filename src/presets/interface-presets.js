import { polygon, rectangle } from "../utils/index.js";
// BUTTON PRESETS GENERATED USING CUSTOM UTILITY: https://editor.p5js.org/jackbdu/sketches/-VM1AcYM9
import buttonPresets from "./button-presets.json";

const cornerButtonCommands = ["menu", "exit", "redo", "undo"];
const topButtonCommands = ["square", "circle", "a4", "example", "load"];
const rightButtonCommands = ["help", "scissors", "overlay", "camera", "closer", "farther", "full"];
const bottomButtonCommands = ["json", "svg", "png", "mp4", "print"];
const leftButtonCommands = ["flipX", "flipY", "rotateL", "rotateR", "reset"];
const PAPER_HEIGHT_MAX = 512;
const PAPER_WIDTH_MAX = 512;
const paddingFromPaper = 50;
const edgeButtonScale = 0.9;
const cornerButtonScale = 1.5;
const width = 512;
const height = 512;
const length = 128;
const nCornerButtonVertices = 8;
const leftX = -PAPER_WIDTH_MAX / 2 - paddingFromPaper - length / 2;
const rightX = PAPER_WIDTH_MAX / 2 + paddingFromPaper + length / 2;
const topY = -PAPER_HEIGHT_MAX / 2 - paddingFromPaper - length / 2;
const bottomY = PAPER_HEIGHT_MAX / 2 + paddingFromPaper + length / 2;

const transformPoint = (point, x, y, w, h) => ({ x: point.x * w + x, y: point.y * h + y });
const transformPath = (path, x, y, w, h) => path.map((point) => transformPoint(point, x, y, w, h));
const transformPiece = (piece, x, y, w, h) => {
  if (piece && typeof piece === "object" && piece.contour) piece.contour = transformPath(piece.contour, x, y, w, h) ?? [];
  piece.holes = piece?.holes?.map((hole) => transformPath(hole, x, y, w, h)) ?? [];
  return piece;
};

const topLeftButton = {
  type: "primary",
  command: cornerButtonCommands[0],
  x: leftX,
  y: topY,
  width: length * cornerButtonScale,
  height: length * cornerButtonScale,
};
const topRightButton = {
  type: "primary",
  command: cornerButtonCommands[1],
  x: rightX,
  y: topY,
  width: length * cornerButtonScale,
  height: length * cornerButtonScale,
};
const bottomRightButton = {
  type: "primary",
  command: cornerButtonCommands[2],
  x: rightX,
  y: bottomY,
  width: length * cornerButtonScale,
  height: length * cornerButtonScale,
};
const bottomLeftButton = {
  type: "primary",
  command: cornerButtonCommands[3],
  x: leftX,
  y: bottomY,
  width: length * cornerButtonScale,
  height: length * cornerButtonScale,
};

const topButtons = topButtonCommands.map((command, index, commands) => {
  const tileWidth = width / commands.length;
  const tileHeight = length;
  const x = tileWidth * (index + 0.5) - width / 2;
  const y = topY;
  return { command, x, y, width: tileWidth * edgeButtonScale, height: tileHeight * edgeButtonScale };
});
const bottomButtons = bottomButtonCommands.map((command, index, commands) => {
  const tileWidth = width / commands.length;
  const tileHeight = length;
  const x = tileWidth * (index + 0.5) - width / 2;
  const y = bottomY;
  return { command, x, y, width: tileWidth * edgeButtonScale, height: tileHeight * edgeButtonScale };
});
const leftButtons = leftButtonCommands.map((command, index, commands) => {
  const tileWidth = length;
  const tileHeight = height / commands.length;
  const x = leftX;
  const y = tileHeight * (index + 0.5) - height / 2;
  return { command, x, y, width: tileWidth * edgeButtonScale, height: tileHeight * edgeButtonScale };
});
const rightButtons = rightButtonCommands.map((command, index, commands) => {
  const tileWidth = length;
  const tileHeight = height / commands.length;
  const x = rightX;
  const y = tileHeight * (index + 0.5) - height / 2;
  return { command, x, y, width: tileWidth * edgeButtonScale, height: tileHeight * edgeButtonScale };
});

const buttons = [topLeftButton, topRightButton, bottomLeftButton, bottomRightButton, ...topButtons, ...bottomButtons, ...leftButtons, ...rightButtons];

const pieces = buttons.map((button) => {
  const piece = buttonPresets[button.command] ? transformPiece(buttonPresets[button.command], button.x, button.y, button.width, button.height) : {};
  return {
    type: button.type,
    command: button.command,
    contour: button.type === "primary" ? polygon(button.x, button.y, button.width, button.height, 6) : rectangle(button.x, button.y, button.width, button.height),
    holes: [],
    ...piece,
  };
});

const InterfacePresets = {
  default: {
    x: 0,
    y: 0,
    width,
    height,
    fill: "#ffffff",
    shape: "rect",
    rotation: 0,
    xFlipped: false,
    yFlipped: false,
    pieces,
  },
};

export { InterfacePresets };
