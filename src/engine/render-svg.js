import { getBoundingBox } from "./render-utils.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SVG_VERSION = "1.1";

const pointToSvgPathData = (point, index, boundingBox) => (index === 0 ? `M${point.x - boundingBox.minX},${point.y - boundingBox.minY} ` : `L${point.x - boundingBox.minX},${point.y - boundingBox.minY} `);

const renderSvgElements = (graphics, boundingBox) => {
  const fill = graphics?.style?.fill;

  const path = document.createElementNS(SVG_NAMESPACE, "path");
  const contourPathData = graphics?.path?.points?.map((point, index) => pointToSvgPathData(point, index, boundingBox))?.join("") ?? "";
  const holesPathData =
    graphics?.path?.holes
      ?.map((hole) => hole?.path?.points?.map((point, index) => pointToSvgPathData(point, index, boundingBox)) ?? "")
      .flat()
      .join("") ?? "";
  const pathData = contourPathData + holesPathData;
  path.setAttribute("d", pathData);

  const childElements = graphics?.children?.map((graphics) => renderSvgElements(graphics, boundingBox)).flat() ?? [];
  if (childElements.length > 0) {
    const group = document.createElementNS(SVG_NAMESPACE, "g");
    fill && group.setAttribute("fill", fill);
    childElements.forEach((element) => group.appendChild(element));
    pathData !== "" && group.appendChild(path);
    return [group];
  }

  fill && path.setAttribute("fill", fill);
  return pathData !== "" ? [path] : [];
};

const renderSvg = (graphics, options) => {
  const includesXmlHeader = options?.includesXmlHeader ?? true;
  const serialized = options?.serialized ?? true;

  const xmlHeader = includesXmlHeader ? '<?xml version="1.0" encoding="UTF-8"?>' : "";

  const boundingBox = getBoundingBox(graphics);

  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("xmlns", SVG_NAMESPACE);
  svg.setAttribute("version", SVG_VERSION);
  svg.setAttribute("width", boundingBox.width);
  svg.setAttribute("height", boundingBox.height);
  svg.setAttribute("viewBox", `0 0 ${boundingBox.width} ${boundingBox.height}`);

  const elements = renderSvgElements(graphics, boundingBox) ?? [];
  elements.forEach((element) => svg.appendChild(element));
  return serialized ? `${xmlHeader}${new XMLSerializer().serializeToString(svg)}` : svg;
};

export { renderSvg };
