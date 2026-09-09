import * as THREE from "three";
import type { createGlassPlate } from "./glass-plate";

type GlassPlate = ReturnType<typeof createGlassPlate>;

/** Hide only a lower platform's rear corner, preserving the glass's translucent contents. */
export function createPlatformOcclusion(
  plate: GlassPlate,
  above: GlassPlate,
  camera: THREE.Camera,
) {
  const { width, height } = above.geometry.parameters;
  const local = [
    new THREE.Vector3(-width / 2, 0, -height / 2),
    new THREE.Vector3(-width / 2, 0, height / 2),
    new THREE.Vector3(width / 2, 0, height / 2),
    new THREE.Vector3(width / 2, 0, -height / 2),
  ];
  const corners = local.map(() => new THREE.Vector3());
  const planes = Array.from({ length: 5 }, () => new THREE.Plane());
  const eye = new THREE.Vector3();
  const center = new THREE.Vector3();
  const behind = new THREE.Vector3();
  for (const material of plate.occlusionMaterials) {
    material.clippingPlanes = planes;
    material.clipIntersection = true;
    material.needsUpdate = true;
  }

  return {
    update() {
      camera.getWorldPosition(eye);
      center.setFromMatrixPosition(above.matrixWorld);
      behind.copy(center).sub(eye).multiplyScalar(0.01).add(center);
      corners.forEach((corner, i) => corner.copy(local[i]!).applyMatrix4(above.matrixWorld));
      for (let i = 0; i < 4; i++)
        planes[i]!.setFromCoplanarPoints(eye, corners[i]!, corners[(i + 1) % 4]!);
      planes[4]!.setFromCoplanarPoints(corners[0]!, corners[1]!, corners[2]!);
      // The five inward half-spaces form the camera's view volume behind the upper plate.
      for (const plane of planes) if (plane.distanceToPoint(behind) > 0) plane.negate();
    },
  };
}
