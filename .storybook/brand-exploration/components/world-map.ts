import * as THREE from "three";
import landPoints from "../land-points.json";
import type { OpticalKit } from "./optical-kit";

/** Geographic cells share real geometry, so their size and foreshortening follow the plate. */
export function createWorldMap(parent: THREE.Group, kit: OpticalKit) {
  const geometry = new THREE.BoxGeometry(0.022, 0.01, 0.022);
  const normals = geometry.getAttribute("normal");
  const faceColors: number[] = [];
  for (let i = 0; i < normals.count; i++) {
    const shade = 0.6 + Math.max(0, normals.getY(i)) * 0.4;
    faceColors.push(shade, shade, shade);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(faceColors, 3));
  const map = new THREE.InstancedMesh(
    geometry,
    kit.tint(
      new THREE.MeshBasicMaterial({ color: 0xc6abe8, vertexColors: true, toneMapped: false }),
      4,
      "node",
      "map",
    ),
    landPoints.length,
  );
  const transform = new THREE.Matrix4();
  const tint = new THREE.Color();
  landPoints.forEach(([x = 0, z = 0], i) => {
    const horizontal = x * 1.18 + z * 0.7 + 0.38;
    const depth = z * 1.75 + horizontal * 0.2 + 1.08;
    // Skew along the plate's diagonal and compress outer corners smoothly.
    // A positive radial derivative keeps islands distinct near the cut edge.
    const reach = Math.abs(horizontal) + Math.abs(depth);
    const extent = reach > 2.25 ? 2.25 + 0.55 * (1 - Math.exp(-(reach - 2.25) / 0.55)) : reach;
    const fit = reach > 0 ? extent / reach : 1;
    transform.makeTranslation(
      ((horizontal + depth) * fit) / Math.SQRT2,
      0.009,
      ((depth - horizontal) * fit) / Math.SQRT2,
    );
    map.setMatrixAt(i, transform);
    const brightness = 0.82 + Math.abs(Math.sin(i * 19.7)) * 0.28;
    map.setColorAt(i, tint.setRGB(brightness, brightness, brightness));
  });
  map.instanceMatrix.needsUpdate = true;
  map.instanceColor!.needsUpdate = true;
  map.computeBoundingBox();
  map.computeBoundingSphere();
  map.name = "Geographic point cloud";
  parent.add(map);
  return map;
}
