const applyStyle = (p, style) => {
  style?.noFill && p.noFill();
  style?.fill && p.fill(style.fill);
  style?.stroke && p.stroke(style.stroke);
  style?.lineWidth && p.strokeWeight(style.lineWidth);
};

const applyTransform = (p, transform) => {
  transform?.translate && p.translate(transform.translate?.x ?? 0, transform.translate?.y ?? 0, transform.translate?.z ?? 0);
  transform?.scale && p.scale(transform.scale?.x ?? 1, transform.scale?.y ?? 1, transform.scale.z ?? 1);
  transform?.rotate && p.rotate(transform.rotate);
  transform?.rotateX && p.rotateX(transform.rotateX);
  transform?.rotateY && p.rotateY(transform.rotateY);
  transform?.rotateZ && p.rotateZ(transform.rotateZ);
};

const renderPoint = (p, point) => {
  if (point?.x !== undefined && point?.y !== undefined && point?.u !== undefined && point?.v !== undefined) {
    p.vertex(point.x, point.y, point.z ?? 0, point.u, point.v);
  } else if (point?.x !== undefined && point?.y !== undefined && point?.z !== undefined) {
    p.vertex(point.x, point.y, point.z);
  } else if (point?.x !== undefined && point?.y !== undefined) {
    p.vertex(point.x, point.y);
  }
};

const renderPath = (p, path) => {
  if (path?.points?.length) {
    p.beginShape();
    path.points?.forEach((point) => renderPoint(p, point));
    path.holes?.forEach((hole) => {
      hole?.path?.points?.length && p.beginContour();
      hole?.path?.points?.forEach((point) => renderPoint(p, point));
      hole?.path?.points?.length && p.endContour(p.CLOSE);
    });
    p.endShape();
  }
};

const renderP5 = function renderGraphics(p, graphics) {
  if (graphics?.path?.points?.length || graphics?.children?.length) {
    p.push();
    graphics.transform && applyTransform(p, graphics.transform);
    graphics.style && applyStyle(p, graphics.style);
    graphics.path && renderPath(p, graphics.path);
    graphics.children?.forEach((graphics) => renderGraphics(p, graphics));
    p.pop();
    return true;
  } else {
    return false;
  }
};
export { renderP5 };
