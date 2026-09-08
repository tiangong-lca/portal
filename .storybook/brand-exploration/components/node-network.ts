import * as THREE from "three";
import type { OpticalKit } from "./optical-kit";

/** A restrained, symmetric spatial graph with distinct apex, shoulder and base nodes. */
export function createNodeNetwork(parent: THREE.Group, kit: OpticalKit) {
  // Screen-horizontal and depth axes of the reference's isometric view.
  const point = (horizontal: number, height: number, depth: number) =>
    new THREE.Vector3((horizontal + depth) / Math.SQRT2, height, (depth - horizontal) / Math.SQRT2);
  const vertices = [
    point(0, 1.25, 0),
    point(-1.0, 0.95, 0.48),
    point(0, 0.78, 0.13),
    point(1.0, 0.95, 0.48),
    point(-0.64, 0.52, 0.1),
    point(0.68, 0.5, 0.08),
    point(0, 0.44, 0.72),
    point(-1.0, 0.08, 1),
    point(1.03, 0.09, 1),
    point(0, 0.06, 2.02),
    point(-1.43, 0.04, 0.82),
    point(1.51, 0.06, 1.56),
    point(0.71, 0.2, 0.76),
    point(2.18, 0.04, 0.92),
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [2, 3],
    [1, 3],
    [1, 4],
    [3, 5],
    [1, 7],
    [3, 8],
    [2, 6],
    [4, 6],
    [5, 6],
    [4, 7],
    [5, 8],
    [6, 7],
    [6, 8],
    [6, 9],
    [7, 9],
    [8, 9],
    [7, 8],
    [1, 9],
    [3, 9],
    [4, 8],
    [5, 7],
    [10, 7],
    [8, 11],
    [9, 11],
    [6, 12],
    [3, 12],
    [9, 12],
    [8, 12],
    [11, 13],
    [3, 13],
  ];
  vertices.forEach((v, i) =>
    kit.addNode(
      parent,
      0,
      v.x,
      v.y,
      v.z,
      i === 9 ? 1.55 : i === 4 || i === 5 ? 0.78 : i >= 10 ? 0.95 : 1.35,
      i === 11 || i === 12 ? 0.9 : i === 13 ? 0.65 : 0,
    ),
  );
  for (const [a, b] of edges) kit.wire([vertices[a!]!, vertices[b!]!], parent, 0, 0.26);
  return vertices;
}
