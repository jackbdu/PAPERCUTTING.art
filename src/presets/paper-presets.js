const BASE_SIZE = 512;
const ASPECT_RATIO = 210 / 297;
const COLOR = "#e01b0d";

const PaperPresets = Object.freeze({
  SQUARE: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    fill: COLOR,
    shape: "rect",
  },
  RECT_LANDSCAPE: {
    width: BASE_SIZE,
    height: ASPECT_RATIO * BASE_SIZE,
    fill: COLOR,
    shape: "rect",
  },
  RECT_PORTRAIT: {
    width: ASPECT_RATIO * BASE_SIZE,
    height: BASE_SIZE,
    fill: COLOR,
    shape: "rect",
  },
  DIAMOND: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    fill: COLOR,
    shape: "diamond",
  },
  CIRCLE: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    fill: COLOR,
    shape: "ellipse",
  },
  ELLIPSE_LANDSCAPE: {
    width: BASE_SIZE,
    height: ASPECT_RATIO * BASE_SIZE,
    fill: COLOR,
    shape: "ellipse",
  },
  ELLIPSE_PORTRAIT: {
    width: ASPECT_RATIO * BASE_SIZE,
    height: BASE_SIZE,
    fill: COLOR,
    shape: "ellipse",
  },
});

export { PaperPresets };
