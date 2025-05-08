import { getBoundingBox, renderStripes, renderTextsPattern, autoRotateAspectRatio } from "./render-utils.js";
import { renderP5 } from "./render-p5.js";
import { makeFilename } from "../utils/index.js";

const renderImage = (p, graphics, options) => {
  const extension = options?.extension ?? "png";
  const paddingRatio = options?.paddingRatio ?? 0.05;
  const aspectRatio = options?.aspectRatio ?? 0;
  const autoRotate = options?.autoRotate ?? true;
  const scale = options?.scale ?? 2;
  const print = options?.print ?? false;
  const stripeGap = options?.stripeGap ?? 8;
  const patternColor = options?.patternColor ?? "#999";
  const strokeWeight = options?.strokeWeight ?? 1;

  const boundingBox = getBoundingBox(graphics);
  const padding = Math.min(boundingBox.width, boundingBox.height) * paddingRatio;
  const paddedWidth = (boundingBox.width + padding * 2) * scale;
  const paddedHeight = (boundingBox.height + padding * 2) * scale;
  const paddedAspectRatio = paddedWidth / paddedHeight;
  const exportAspectRatio = aspectRatio ? (autoRotate ? autoRotateAspectRatio(aspectRatio, paddedWidth, paddedHeight) : aspectRatio) : paddedAspectRatio;
  const exportWidth = paddedAspectRatio >= exportAspectRatio ? paddedWidth : paddedHeight * exportAspectRatio;
  const exportHeight = paddedAspectRatio >= exportAspectRatio ? paddedWidth / exportAspectRatio : paddedHeight;
  const p5Graphics = p.createGraphics(exportWidth, exportHeight);
  p5Graphics.background("#fff");
  p5Graphics.strokeJoin(p.ROUND);
  p5Graphics.strokeWeight(strokeWeight);
  if (print) {
    renderStripes(p5Graphics, { color: patternColor, gap: stripeGap });
    const shortSideTextNum = 8;
    const colsNum = exportAspectRatio < 1 ? shortSideTextNum : shortSideTextNum * exportAspectRatio;
    const rowsNum = exportAspectRatio < 1 ? shortSideTextNum / exportAspectRatio : shortSideTextNum;
    renderTextsPattern(p5Graphics, { colsNum, rowsNum, color: patternColor });
  }
  renderP5(p5Graphics, { transform: { translate: { x: p5Graphics.width / 2 - boundingBox.x * scale, y: p5Graphics.height / 2 - boundingBox.y * scale }, scale: { x: scale, y: scale } }, children: [graphics] });
  p.saveCanvas(p5Graphics, makeFilename(print ? "template" : ""), extension);
  p5Graphics.remove();
};
export { renderImage };
