import * as THREE from "three";
import mapPoints from "../map-points.json";
import type { OpticalKit } from "./optical-kit";

/** Authored cells share real geometry, so their size and foreshortening follow the plate. */
export function createWorldMap(parent: THREE.Group, kit: OpticalKit) {
  const geometry = new THREE.BoxGeometry(0.027, 0.012, 0.027);
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
    mapPoints.length,
  );
  const transform = new THREE.Matrix4();
  const tint = new THREE.Color();
  mapPoints.forEach(([x = 0, z = 0, size = 1], i) => {
    transform.makeScale(size, size, size).setPosition(x, 0.009, z);
    map.setMatrixAt(i, transform);
    const brightness = 0.82 + Math.abs(Math.sin(i * 19.7)) * 0.28;
    map.setColorAt(i, tint.setRGB(brightness, brightness, brightness));
  });
  map.instanceMatrix.needsUpdate = true;
  map.instanceColor!.needsUpdate = true;
  map.computeBoundingBox();
  map.computeBoundingSphere();
  map.name = "Authored world-map cells";
  parent.add(map);
  return map;
}
