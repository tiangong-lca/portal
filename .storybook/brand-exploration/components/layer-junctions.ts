import * as THREE from "three";
import type { OpticalKit } from "./optical-kit";

type JunctionLink = readonly [from: number, to: number, opacity: number];

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
    [-1.884, 0.04, -0.785],
    [0.248, 0.04, -1.884],
    [-0.693, 0.04, -0.714],
    [0.818, 0.04, 1.843],
    [1.793, 0.04, 0.829],
    [1.484, 0.04, 1.484],
  ],
  [
    [1.603, 0.025, 1.577],
    [-0.768, 0.32, 0.92],
    [0.828, 0.32, -0.884],
    [0.413, -0.22, 2.067],
    [2.202, -0.22, 0.509],
    [-0.911, 1.05, 0.782],
    [1.013, 1.05, -1.084],
    // The central column passes behind the appliance before meeting its display grid.
    [0.65, 0.025, 0.65],
  ],
  [
    [0.382, 0.04, 0.362],
    [-0.38, 0.02, 1.332],
    [1.46, 0.02, -0.301],
  ],
];

const SURFACE_LINKS: JunctionLink[][] = [
  [],
  [
    [0, 1, 0.16],
    [0, 2, 0.16],
    [0, 3, 0.12],
    [0, 4, 0.09],
    [0, 5, 0.18],
    [1, 5, 0.1],
    [5, 3, 0.1],
    [1, 2, 0.09],
    [2, 4, 0.15],
  ],
  [
    [0, 1, 0.16],
    [0, 2, 0.16],
    [0, 3, 0.07],
    [0, 4, 0.07],
    [0, 5, 0.18],
    [1, 3, 0.1],
    [3, 5, 0.07],
    [5, 4, 0.11],
    [4, 2, 0.14],
    [0, 6, 0.15],
    [0, 7, 0.15],
    [0, 8, 0.16],
    [6, 8, 0.085],
    [7, 8, 0.085],
  ],
  [
    [0, 1, 0.075],
    [0, 2, 0.075],
    [5, 1, 0.12],
    [6, 2, 0.13],
    [1, 3, 0.1],
    [2, 4, 0.1],
    [0, 3, 0.1],
    [0, 4, 0.1],
    [3, 4, 0.06],
    [7, 0, 0.07],
  ],
  [],
];

const NODE_SIZES = [
  [],
  [1.65, 1, 1, 1, 1, 1],
  [1.4, 1, 1, 1, 1, 1, 0.65, 0.38, 0.35],
  [0.24, 0.8, 0.5, 0.32, 0.32, 0.7, 0.8, 0.18],
  [1.4, 0.18, 0.18],
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
        NODE_SIZES[i]![j]!,
        i === 1 && j === 3 ? 0.5 : 0,
        i === 4 && j === 0 ? "ring" : "bead",
      );
    }
    for (const [a, b, opacity] of SURFACE_LINKS[i]!) {
      kit.wire([points[i]![a]!, points[i]![b]!], layers[i]!, i, opacity);
    }
  }
  return points;
}

// Weighted connections follow the suspended junctions instead of crossing to distant plate corners.
export const LAYER_LINKS: JunctionLink[][] = [
  [
    [0, 0, 0.22],
    [0, 2, 0.1],
    [1, 1, 0.14],
    [2, 2, 0.16],
    [3, 3, 0.2],
    [4, 3, 0.12],
    [4, 4, 0.16],
    [5, 5, 0.16],
    [1, 0, 0.08],
  ],
  [
    [0, 0, 0.2],
    [0, 3, 0.1],
    [1, 1, 0.11],
    [2, 0, 0.08],
    [2, 2, 0.18],
    [3, 2, 0.12],
    [4, 4, 0.18],
    [5, 5, 0.14],
  ],
  [
    [8, 7, 0.16],
    [0, 5, 0.055],
    [0, 6, 0.055],
    [1, 5, 0.15],
    [2, 6, 0.15],
    [3, 5, 0.045],
    [4, 6, 0.08],
    [6, 5, 0.1],
    [7, 6, 0.1],
  ],
  [
    [7, 0, 0.16],
    [3, 1, 0.09],
    [4, 2, 0.09],
  ],
];
