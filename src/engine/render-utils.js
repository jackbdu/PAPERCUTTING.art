const getBoundingBox = (graphics) => {
  // GET BOUNDING BOX
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const includePointInBox = (point) => {
    minX = Math.min(minX, point?.x ?? Infinity);
    minY = Math.min(minY, point?.y ?? Infinity);
    maxX = Math.max(maxX, point?.x ?? -Infinity);
    maxY = Math.max(maxY, point?.y ?? -Infinity);
  };
  graphics?.path?.points?.forEach((point) => includePointInBox(point ?? {}));
  graphics?.children?.forEach((graphics) => {
    const boundingBox = getBoundingBox(graphics);
    const corners = [
      { x: boundingBox.minX, y: boundingBox.minY },
      { x: boundingBox.maxX, y: boundingBox.maxY },
    ];
    corners.forEach((corner) => includePointInBox(corner));
  });
  const width = maxX - minX;
  const height = maxY - minY;
  const x = (maxX + minX) / 2;
  const y = (maxY + minY) / 2;
  return { x, y, width, height, minX, minY, maxX, maxY };
};

const autoRotateAspectRatio = (aspectRatio, width, height) => (Math.floor(aspectRatio) === Math.floor(width / height) ? aspectRatio : 1 / aspectRatio);

const renderStripes = (p, options) => {
  const color = options?.color ?? "#999";
  const gap = options?.gap ?? 8;
  const length = Math.max(p.width, p.height);
  p.push();
  p.stroke(color);
  for (let x = 0; x < length * 4; x += gap) {
    p.line(x, 0, 0, x);
  }
  p.pop();
};

const renderTextsPattern = (p, options) => {
  const texts = options?.texts ?? ["✄"];
  const colsNum = options?.colsNum ?? 8;
  const rowsNum = options?.rowsNum ?? 8;
  const textSizeFactor = options?.textSizeFactor ?? 0.5;
  const rotate = options?.rotate ?? -Math.PI / 4;
  const color = options?.color ?? "#999";

  const colWidth = p.width / colsNum;
  const rowHeight = p.height / rowsNum;
  const refSize = Math.min(colWidth, rowHeight);
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(refSize * textSizeFactor);
  p.fill(color);
  p.noStroke();
  for (let c = 0; c < colsNum + 1; c++) {
    for (let r = 0; r < rowsNum + 1; r++) {
      const offsetX = ((r % 2) * colWidth) / 2;
      const x = c * colWidth + offsetX;
      const y = r * rowHeight;
      const textIndex = c % texts.length;
      const text = texts[textIndex];
      p.push();
      p.translate(x, y);
      p.rotate(rotate);
      p.text(text, 0, 0);
      p.pop();
    }
  }
  p.pop();
};

export { getBoundingBox, autoRotateAspectRatio, renderStripes, renderTextsPattern };
