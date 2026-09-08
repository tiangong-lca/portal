import * as THREE from "three";
import type { OpticalKit } from "./optical-kit";

// Independent junctions follow each layer's equipment, rather than an extruded grid.
// Coordinates are authored in model space; no reference pixels enter the renderer.
const JUNCTIONS = [
  [],
  [
    [1.541, 0.43, 1.541],
    [-1.912, 0.04, 0.704],
    [1.184, 0.04, -0.253],
    [0.803, 0.04, -2.06],
    [0.89, 0.04, -1.278],
    [-0.386, 0.04, -0.386],
  ],
  [
    [0.938, 0.06, 0.919],
    [-0.939, 0.04, 1.232],
    [1.363, 0.04, -1.07],
    [-1.796, 0.04, -0.718],
    [0.304, 0.04, -1.893],
    [-0.693, 0.04, -0.714],
  ],
  [
    [0.884, 1.04, 0.825],
    [-0.768, 0.32, 0.92],
    [0.828, 0.32, -0.884],
    [0.46, 0.04, 1.98],
    [1.99, 0.04, 0.55],
  ],
  [
    [0.382, 0.04, 0.362],
    [-1.261, 0.04, 0.448],
    [0.625, 0.04, -1.161],
  ],
];

/** A small spatial graph between the five authored layers. */
export function createLayerJunctions(
  layers: THREE.Group[],
  network: THREE.Vector3[],
  kit: OpticalKit,
) {
  const points = JUNCTIONS.map((vertices) =>
    vertices.map(([x = 0, y = 0, z = 0]) => new THREE.Vector3(x, y, z)),
  );
  points[0] = [network[9]!, network[10]!, network[8]!, network[13]!, network[11]!, network[6]!];
  for (let i = 1; i < layers.length; i++) {
    for (let j = 0; j < points[i]!.length; j++) {
      const point = points[i]![j]!;
      kit.addNode(
        layers[i]!,
        i,
        point.x,
        point.y,
        point.z,
        j === 0 ? (i === 1 ? 1.65 : i === 3 ? 0.6 : 1.4) : i === 3 ? 0.8 : 1,
        i === 1 && j === 3 ? 0.5 : 0,
      );
    }
  }
  return points;
}

// [start junction, end junction], for each consecutive pair of layers.
export const LAYER_LINKS = [
  [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 3],
    [4, 4],
    [5, 5],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 3],
    [1, 1],
    [2, 0],
    [2, 2],
    [3, 2],
    [4, 4],
    [5, 5],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 1],
    [4, 2],
  ],
];
