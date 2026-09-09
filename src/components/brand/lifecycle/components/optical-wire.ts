import * as THREE from "three";

const up = new THREE.Vector3(0, 1, 0);

/** A fine cylindrical filament retains its apparent weight at different pixel densities. */
export class OpticalWire extends THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial> {
  private readonly direction = new THREE.Vector3();

  setEndpoints(start: THREE.Vector3, end: THREE.Vector3) {
    this.direction.subVectors(end, start);
    const length = this.direction.length();
    this.position.copy(start).lerp(end, 0.5);
    this.scale.y = length;
    if (length > 0) this.quaternion.setFromUnitVectors(up, this.direction.divideScalar(length));
  }
}
