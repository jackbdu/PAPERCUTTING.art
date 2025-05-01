import { expect, test } from "vitest";
import { simplifyPath } from "./simplify-path.js";

const originalPath = [
  { x: 2, y: 4 },
  { x: 0, y: 10 },
  { x: 7, y: 3 },
  { x: 10, y: 0 },
];
const simplifiedPath = simplifyPath(originalPath);

test("start and end of path remain the same after simplification", () => {
  expect(simplifiedPath[0]).toEqual(originalPath[0]);
  expect(simplifiedPath.at(-1)).toEqual(originalPath.at(-1));
});

test("simplified path is not longer than original path", () => {
  expect(simplifiedPath.length).toBeLessThanOrEqual(originalPath.length);
});
