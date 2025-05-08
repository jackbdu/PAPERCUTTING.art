import { dist } from "../utils/index.js";

const isOdd = (n) => n % 2 === 1;

// https://www.geeksforgeeks.org/area-of-a-polygon-with-given-n-ordered-vertices/
const getPolygonArea = (polygon) => {
  // Initialize area
  let area = 0.0;

  // Calculate value of shoelace formula
  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);

    // j is previous vertex to i
    j = i;
  }

  // Return absolute value
  return Math.abs(area / 2.0);
};

// Reference: https://www.mathsisfun.com/algebra/line-equation-2points.html
// ax + by = c;
const twoPointsToLineCoefficients = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let a = 1;
  let b = 1;
  if (dy === 0) a = 0;
  dx === 0 ? (b = 0) : (a = -dy / dx);
  let c = a * x1 + b * y1;
  return [a, b, c];
};

// Reference: https://www.geeksforgeeks.org/program-for-point-of-intersection-of-two-lines/
// returns either intersection coord [x, y] or [] if colinear/parallel
const twoLinesIntersection = (p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) => {
  const [a1, b1, c1] = twoPointsToLineCoefficients(p1x, p1y, q1x, q1y);
  const [a2, b2, c2] = twoPointsToLineCoefficients(p2x, p2y, q2x, q2y);
  const determinant = a1 * b2 - a2 * b1;
  if (determinant === 0) {
    return undefined;
  } else {
    const x = (c1 * b2 - c2 * b1) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    return { x, y };
  }
};

// Reference: https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
const pathOrientation = (path) => {
  let sum = 0;
  try {
    for (let i = 1; i < path.length; i++) {
      const pt1 = path[(i - 1) % path.length];
      const pt2 = path[i % path.length];
      sum += (pt2.x - pt1.x) * (pt1.y + pt2.y);
    }
  } catch (e) {
    console.error(path, e);
  }
  return sum;
};

// direction depends on coordinate system
const setPathOrientation = (path, orientation) => (Math.sign(pathOrientation(path)) === Math.sign(orientation) ? path.slice() : path.slice().reverse());

// Reference: https://www.dcs.gla.ac.uk/~pat/52233/slides/Geometry1x1.pdf

const threePointOrientation = (x1, y1, x2, y2, x3, y3) => (y2 - y1) * (x3 - x2) - (y3 - y2) * (x2 - x1);

// POINT ON LINE IS TRUE, OVERLAPPING POINTS ARE NOT CONSIDERED TRUE
const lineSegmentsIntersect1D = (p1, q1, p2, q2) => ((p2 >= p1 && p2 <= q1) || (q2 >= p1 && q2 <= q1) || (p2 <= p1 && p2 >= q1) || (q2 <= p1 && q2 >= q1)) && !(p1 === q1 && p2 === q2);

const lineSegmentsIntersect2D = (p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) => {
  const o1a = Math.sign(threePointOrientation(p1x, p1y, q1x, q1y, p2x, p2y));
  const o1b = Math.sign(threePointOrientation(p1x, p1y, q1x, q1y, q2x, q2y));
  const o2a = Math.sign(threePointOrientation(p2x, p2y, q2x, q2y, p1x, p1y));
  const o2b = Math.sign(threePointOrientation(p2x, p2y, q2x, q2y, q1x, q1y));
  if (o1a !== o1b && o2a !== o2b) {
    return true;
    // simply ignore colinear linesegments and do not consider them as intersecting
    /*
  } else if (o1a === 0 && o1b === 0 && o2a === 0 && o2b === 0 && lineSegmentsIntersect1D(p1x, q1x, p2x, q2x) && lineSegmentsIntersect1D(p1y, q1y, p2y, q2y)) {
    return true;
    */
  } else {
    return false;
  }
};

const pointInPolygon = (px, py, _polygon = []) => {
  if (_polygon.length < 1) return undefined;
  const polygon = _polygon.slice();
  polygon.push(_polygon[0]);
  let intersectNum = 0;
  // TOP OR BOTTOM
  let prevNonZeroSide;
  let firstNonZeroSide;
  for (let i = 1; i < polygon.length; i++) {
    const pi = (i - 1) % polygon.length;
    const qi = i % polygon.length;
    const p1x = polygon[pi].x;
    const p1y = polygon[pi].y;
    const q1x = polygon[qi].x;
    const q1y = polygon[qi].y;
    const p2x = px;
    const p2y = py;
    const q2x = Math.max(p1x, q1x) > px ? (q1x > p1x ? q1x : p1x) : px;
    const q2y = py;
    if (lineSegmentsIntersect2D(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y)) {
      // SKIP HORIZONTAL LINES
      if (p1y !== q1y) intersectNum++;
      let side;
      if (py === p1y) {
        side = Math.sign(q1y - py);
        if (firstNonZeroSide === undefined && side !== 0) {
          firstNonZeroSide = side;
        }
      } else if (py === q1y) {
        side = Math.sign(p1y - py);
        // console.log(side, firstNonZeroSide);
      }
      // if (i === polygon.length - 1)
      //   console.log(firstNonZeroSide, prevNonZeroSide, side);
      // EITHER OPPOSING SIDE OR OPPOSING SIDE FOR FIRST AND LAST NONE-ZERO SIDES
      if (prevNonZeroSide + side === 0 || ((py === p1y || py === q1y) && i === polygon.length - 1 && (side + firstNonZeroSide === 0 || prevNonZeroSide + firstNonZeroSide === 0))) {
        intersectNum--;
      }
      if (side !== 0) prevNonZeroSide = side;
    }
  }
  // console.log(intersectNum);
  return isOdd(intersectNum);
};

const polygonInPolygon = (polygon1, polygon2) => {
  for (const point of polygon1) {
    if (pointInPolygon(point.x, point.y, polygon2) !== true) {
      return false;
    }
  }
  return true;
};

const pointInPolygonWithHoles = (px, py, polygonWithHoles) => {
  const contour = polygonWithHoles?.contour ?? [];
  const holes = polygonWithHoles?.holes ?? [];
  if (pointInPolygon(px, py, contour)) {
    for (const hole of holes) {
      if (pointInPolygon(px, py, hole)) return false;
    }
    return true;
  } else {
    return false;
  }
};

const polylineBackSelfIntersection = (polyline) => {
  for (let i = 1; i < polyline.length - 2; i++) {
    const p1x = polyline[i - 1].x;
    const p1y = polyline[i - 1].y;
    const q1x = polyline[i].x;
    const q1y = polyline[i].y;
    const p2x = polyline.at(-2).x;
    const p2y = polyline.at(-2).y;
    const q2x = polyline.at(-1).x;
    const q2y = polyline.at(-1).y;
    if (lineSegmentsIntersect2D(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y)) return true;
  }
  return false;
};

const backSelfIntersectPolylineToPolygon = (polyline) => {
  for (let i = 1; i < polyline.length - 2; i++) {
    const p1x = polyline[i - 1].x;
    const p1y = polyline[i - 1].y;
    const q1x = polyline[i].x;
    const q1y = polyline[i].y;
    const p2x = polyline.at(-2).x;
    const p2y = polyline.at(-2).y;
    const q2x = polyline.at(-1).x;
    const q2y = polyline.at(-1).y;
    if (lineSegmentsIntersect2D(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y)) {
      const intersection = twoLinesIntersection(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y);
      if (intersection) {
        const polygon = polyline.slice(i, polyline.length - 1);
        polygon.splice(0, 0, intersection);
        polygon.push(intersection);
        return polygon;
      }
    }
  }
  console.warn("polyline length smaller than 4 or polyline not self intersecting at back");
  return [];
};

const polylinePolygonIntersections = (polyline, polygon, minDist = 1) => {
  const intersections = [];
  for (let i = 1; i < polyline.length; i++) {
    const p1x = polyline[i - 1].x;
    const p1y = polyline[i - 1].y;
    const q1x = polyline[i].x;
    const q1y = polyline[i].y;
    for (let j = 1; j < polygon.length; j++) {
      const p2x = polygon[j - 1].x;
      const p2y = polygon[j - 1].y;
      const q2x = polygon[j].x;
      const q2y = polygon[j].y;
      if (lineSegmentsIntersect2D(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y)) {
        const intersection = twoLinesIntersection(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y);
        // MAKE SURE NOT COLLINEAR
        if (intersection !== undefined) {
          const pintersection = intersections[intersections.length - 1];
          if (pintersection === undefined || dist(pintersection.x, pintersection.y, intersection.x, intersection.y) > minDist) {
            intersections.push(intersection);
          }
        }
      }
    }
  }
  return intersections;
};

const polylinePolygonWithHolesIntersections = (polyline, polygonWithHoles, minDist = 1) => {
  const contour = polygonWithHoles?.contour ?? [];
  const holes = polygonWithHoles?.holes ?? [];
  const pcIntersections = polylinePolygonIntersections(polyline, contour, minDist);
  const phIntersections = holes.map((hole) => polylinePolygonIntersections(polyline, hole, minDist)).flat();
  return [...pcIntersections, ...phIntersections];
};

// TODO:
// EDGE CASE: SINGLE LINE SEGMENT MAY INTERSECTS MULTIPLE TIMES
const splitPolygonWithPolyline = (_polygon, _polyline) => {
  const polyline = _polyline.slice();
  const polygon = _polygon.slice();
  // ENSURE POLYGON IS CLOSED
  // TODO: CHECK IF CLOSED BEFORE THIS
  // polygon.push(_polygon[0]);
  let polygons = [_polygon];

  const sp1x = polyline[0].x;
  const sp1y = polyline[0].y;
  const sq1x = polyline[1].x;
  const sq1y = polyline[1].y;

  const ep1x = polyline[polyline.length - 2].x;
  const ep1y = polyline[polyline.length - 2].y;
  const eq1x = polyline[polyline.length - 1].x;
  const eq1y = polyline[polyline.length - 1].y;

  const polygonA = polyline.slice(1, polyline.length - 1);
  const polygonB = polygonA.slice().reverse();

  let polygonAStatus = "searching"; //'adding', 'done'
  let polygonBStatus = "searching"; //'adding', 'done'

  // this could be replaced with a while loop, but make sure not infinite
  for (let i = 1; i < polygon.length * 2; i++) {
    const pi = (i - 1) % polygon.length;
    const qi = i % polygon.length;
    const p2x = polygon[pi].x;
    const p2y = polygon[pi].y;
    const q2x = polygon[qi].x;
    const q2y = polygon[qi].y;
    if (polygonBStatus === "adding" || polygonBStatus === "starting") {
      polygonB.push({ x: p2x, y: p2y });
      polygonBStatus = "adding";
    }
    if (polygonAStatus === "adding" || polygonAStatus === "starting") {
      polygonA.push({ x: p2x, y: p2y });
      polygonAStatus = "adding";
    }
    if (lineSegmentsIntersect2D(ep1x, ep1y, eq1x, eq1y, p2x, p2y, q2x, q2y)) {
      const intersection = twoLinesIntersection(ep1x, ep1y, eq1x, eq1y, p2x, p2y, q2x, q2y);
      if (polygonBStatus === "adding") {
        polygonB.push(intersection);
        polygonB.push(polygonB[0]);
        polygonBStatus = "done";
      }
      if (polygonAStatus === "searching") {
        polygonA.push(intersection);
        polygonAStatus = "starting";
        // EDGE CASE WHEN BOTH INTERSECTIONS ARE ON THE SAME LINE SEGMENT
        // CHECK THIS ONLY IF POLYLINE IS NOT ONE LINE SEGMENT
        if (!(ep1x === sp1x && ep1y === sp1y && eq1x === sq1x && eq1y === sq1y) && lineSegmentsIntersect2D(sp1x, sp1y, sq1x, sq1y, intersection.x, intersection.y, q2x, q2y)) {
          const nextIntersection = twoLinesIntersection(sp1x, sp1y, sq1x, sq1y, intersection.x, intersection.y, q2x, q2y);
          polygonA.push(nextIntersection);
          polygonA.push(polygonA[0]);
          polygonAStatus = "done";
        }
      }
    }
    if (lineSegmentsIntersect2D(sp1x, sp1y, sq1x, sq1y, p2x, p2y, q2x, q2y)) {
      const intersection = twoLinesIntersection(sp1x, sp1y, sq1x, sq1y, p2x, p2y, q2x, q2y);
      // ENSURES BOTH POLYGONS ARE NOT STARTING AT THE SAME INDEX (IN THE EVENT THAT THERE ARE ONLY TWO POINTS IN POLYLINE)
      if (polygonBStatus === "searching" && polygonAStatus !== "starting") {
        polygonB.push(intersection);
        polygonBStatus = "starting";
        // EDGE CASE WHEN BOTH INTERSECTIONS ARE ON THE SAME LINE SEGMENT
        // CHECK THIS ONLY IF POLYLINE IS NOT ONE LINE SEGMENT
        if (!(ep1x === sp1x && ep1y === sp1y && eq1x === sq1x && eq1y === sq1y) && lineSegmentsIntersect2D(ep1x, ep1y, eq1x, eq1y, intersection.x, intersection.y, q2x, q2y)) {
          const nextIntersection = twoLinesIntersection(ep1x, ep1y, eq1x, eq1y, intersection.x, intersection.y, q2x, q2y);
          polygonB.push(nextIntersection);
          polygonB.push(polygonB[0]);
          polygonBStatus = "done";
        }
      }
      if (polygonAStatus === "adding") {
        polygonA.push(intersection);
        polygonA.push(polygonA[0]);
        polygonAStatus = "done";
      }
    }
  }

  if (polygonAStatus === "done" && polygonBStatus === "done") polygons = [polygonA, polygonB];
  // console.log(polygonAStatus, polygonBStatus, polygons);
  return polygons;
};

// LINE SEGMENT SHOULD INTERSECT WITH POLYGON AT ONLY ONE POINT
const reorderPolygonWithIntersectedLineSegment = (polygon, px, py, qx, qy) => {
  for (let i = 1; i < polygon.length; i++) {
    const p2x = polygon[i - 1].x;
    const p2y = polygon[i - 1].y;
    const q2x = polygon[i].x;
    const q2y = polygon[i].y;
    if (lineSegmentsIntersect2D(px, py, qx, qy, p2x, p2y, q2x, q2y)) {
      const intersection = twoLinesIntersection(px, py, qx, qy, p2x, p2y, q2x, q2y);
      return [intersection].concat(polygon.slice(i)).concat(polygon.slice(0, i)).concat([intersection]);
    }
  }
  console.error("line segment not intersecting with polygon");
  return undefined;
};

// POLYLINE FRONT AND BACK SHOULD INTERSECT WITH CONTOUR AND HOLE
const mergeContourAndHoleWithPolyline = (polygonWithHoles, polyline) => {
  const contour = polygonWithHoles?.contour ?? [];
  const holes = polygonWithHoles?.holes ?? [];
  const c2hPolyline = polyline.slice();
  const h2cPolyline = polyline.slice().reverse();
  if (polylinePolygonIntersections(polyline.slice(polyline.length - 2, polyline.length), contour).length > 0) {
    c2hPolyline.reverse();
    h2cPolyline.reverse();
  } else if (polylinePolygonIntersections(polyline.slice(0, 2), contour).length < 1) {
    console.error("neither front nor back of polyline intersecting with polygon");
    return polygonWithHoles;
  }

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    const intersections = polylinePolygonIntersections(h2cPolyline.slice(0, 2), hole);
    if (intersections.length >= 1) {
      if (intersections.length > 1) console.warn("polyline and hole intersecting more than once");
      const cpx = c2hPolyline[0].x;
      const cpy = c2hPolyline[0].y;
      const cqx = c2hPolyline[1].x;
      const cqy = c2hPolyline[1].y;
      const hpx = h2cPolyline[0].x;
      const hpy = h2cPolyline[0].y;
      const hqx = h2cPolyline[1].x;
      const hqy = h2cPolyline[1].y;
      const reorderedContour = reorderPolygonWithIntersectedLineSegment(contour, cpx, cpy, cqx, cqy);
      const reorderedHole = reorderPolygonWithIntersectedLineSegment(hole, hpx, hpy, hqx, hqy);
      holes.splice(i, 1);
      return { contour: [reorderedContour, c2hPolyline.slice(1, c2hPolyline.length - 1), reorderedHole, h2cPolyline.slice(1, c2hPolyline.length - 1)].flat(), holes };
    }
  }
  console.error("neither front nor back of polyline intersecting with any hole");
  return polygonWithHoles;
};

// POLYLINE FRONT AND BACK SHOULD INTERSECT WITH ONE (BOTH INTERSECTING THE SAME HOLE) OR TWO OF THE HOLES
const handlePolygonWithHolesIntersectedWithPolyline = (polygonWithHoles, polyline) => {
  const contour = polygonWithHoles?.contour ?? [];
  const holes = polygonWithHoles?.holes?.slice() ?? [];
  const a2bPolyline = polyline.slice();
  const b2aPolyline = polyline.slice().reverse();
  let holeA;
  let holeB;
  let holeAIndex;
  let holeBIndex;
  for (let i = holes.length - 1; i >= 0; i--) {
    const hole = holes[i];
    const intersectionA = polylinePolygonIntersections(a2bPolyline.slice(0, 2), hole);
    const intersectionB = polylinePolygonIntersections(b2aPolyline.slice(0, 2), hole);
    if (intersectionA.length >= 1 && intersectionB.length >= 1) {
      holes.splice(i, 1);
      holeA = hole;
      holeB = hole;
      holeAIndex = i;
      holeBIndex = i;
    } else if (intersectionA.length >= 1) {
      holes.splice(i, 1);
      holeA = hole;
      holeAIndex = i;
    } else if (intersectionB.length >= 1) {
      holes.splice(i, 1);
      holeB = hole;
      holeBIndex = i;
    }
  }
  // INTERSECTING WITH TWO DIFFERENT HOLES
  if (holeA && holeB && holeAIndex !== holeBIndex) {
    const apx = a2bPolyline[0].x;
    const apy = a2bPolyline[0].y;
    const aqx = a2bPolyline[1].x;
    const aqy = a2bPolyline[1].y;
    const bpx = b2aPolyline[0].x;
    const bpy = b2aPolyline[0].y;
    const bqx = b2aPolyline[1].x;
    const bqy = b2aPolyline[1].y;
    const reorderedHoleA = reorderPolygonWithIntersectedLineSegment(holeA, apx, apy, aqx, aqy);
    const reorderedHoleB = reorderPolygonWithIntersectedLineSegment(holeB, bpx, bpy, bqx, bqy);
    const mergedHole = [reorderedHoleA, a2bPolyline.slice(1, a2bPolyline.length - 1), reorderedHoleB, b2aPolyline.slice(1, b2aPolyline.length - 1)].flat();
    return [
      {
        contour,
        holes: [mergedHole, ...holes],
      },
    ];
    // INTERSECTING THE SAME HOLE
  } else if (holeA && holeB && holeAIndex === holeBIndex) {
    const polygons = splitPolygonWithPolyline(holeA, polyline);
    // THIS IS COORDINATE DEPENDENT, CURRENTLY ASSUMING P5 COORDINATE (X TO THE EAST, Y TO THE SOUTH)
    const newHole = polygons.filter((polygon) => pathOrientation(polygon) > 0)?.at(0) ?? [];
    const cutoutContour = polygons.filter((polygon) => pathOrientation(polygon) < 0)?.at(0);
    const cutoutHoles = [];
    const updatedHoles = [];
    holes.forEach((hole) => {
      polygonInPolygon(hole, cutoutContour) ? cutoutHoles.push(hole) : updatedHoles.push(hole);
    });
    updatedHoles.push(newHole);
    return [
      { contour, holes: updatedHoles },
      { contour: cutoutContour, holes: cutoutHoles },
    ];
  } else {
    console.error("polyline front and back intersecting less than once");
  }
  return [polygonWithHoles];
};

const applyPolylineToPolygonWithHoles = (polygonWithHoles, polyline) => {
  const contour = polygonWithHoles?.contour ?? [];
  const holes = polygonWithHoles?.holes ?? [];
  const pcIntersections = polylinePolygonIntersections(polyline, contour);
  const phIntersections = holes.map((hole) => polylinePolygonIntersections(polyline, hole)).flat();
  if (pcIntersections.length === 2) {
    const contours = splitPolygonWithPolyline(contour, polyline);
    return contours.map((contour) => ({ contour, holes: holes.filter((hole) => polygonInPolygon(hole, contour)) }));
  } else if (phIntersections.length === 2) {
    const updatedPolygonsWithHoles = handlePolygonWithHolesIntersectedWithPolyline(polygonWithHoles, polyline);
    return updatedPolygonsWithHoles;
  } else if (pcIntersections.length + phIntersections.length === 2) {
    const updatedPolygonWithHoles = mergeContourAndHoleWithPolyline(polygonWithHoles, polyline);
    return [updatedPolygonWithHoles];
  } else {
    return [polygonWithHoles];
  }
};

export { getPolygonArea, setPathOrientation, pointInPolygon, polygonInPolygon, pointInPolygonWithHoles, polylineBackSelfIntersection, backSelfIntersectPolylineToPolygon, polylinePolygonIntersections, polylinePolygonWithHolesIntersections, splitPolygonWithPolyline, applyPolylineToPolygonWithHoles };
