const polygon = (x, y, w, h, sidesNum = 16, angleOffset = 0) =>
  new Array(sidesNum + 1).fill(0).map((_, index, arr) => {
    const theta = (index / (arr.length - 1)) * Math.PI * 2 + angleOffset;
    return { x: x + (Math.cos(theta) * w) / 2, y: y + (Math.sin(theta) * h) / 2 };
  });

const rectangle = (x, y, w, h) => {
  return [
    { x: x - w / 2, y: y - h / 2 },
    { x: x + w / 2, y: y - h / 2 },
    { x: x + w / 2, y: y + h / 2 },
    { x: x - w / 2, y: y + h / 2 },
    { x: x - w / 2, y: y - h / 2 },
  ];
};

export { polygon, rectangle };
