import { getBoundingBox } from "./render-utils.js";

const renderSvg = (graphics) => {
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const SVG_VERSION = "1.1";

  const boundingBox = getBoundingBox(graphics);

  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("xmlns", SVG_NAMESPACE);
  svg.setAttribute("version", SVG_VERSION);
  svg.setAttribute("width", boundingBox.width);
  svg.setAttribute("height", boundingBox.height);
  svg.setAttribute("viewBox", `0 0 ${boundingBox.width} ${boundingBox.height}`);

  const pointToSvgPathData = (point, index) => (index === 0 ? `M${point.x - boundingBox.minX},${point.y - boundingBox.minY} ` : `L${point.x - boundingBox.minX},${point.y - boundingBox.minY} `);
  const paths =
    graphics?.children?.map((graphics) => {
      const path = document.createElementNS(SVG_NAMESPACE, "path");
      const contourPathData = graphics?.path?.points?.map(pointToSvgPathData)?.join("") ?? "";
      const holesPathData =
        graphics?.path?.holes
          ?.map((hole) => hole?.path?.points?.map(pointToSvgPathData) ?? "")
          .flat()
          .join("") ?? "";
      path.setAttribute("d", contourPathData + holesPathData);
      return path;
    }) ?? [];
  paths.forEach((path) => svg.appendChild(path));
  return `<?xml version="1.0" encoding="UTF-8"?>${new XMLSerializer().serializeToString(svg)}`;
};

export { renderSvg };
