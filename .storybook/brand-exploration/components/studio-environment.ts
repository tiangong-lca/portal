import * as THREE from "three";

/** Geometric softboxes create real reflections without an HDR photograph or baked artwork. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#38313f");
  const panels: THREE.Mesh[] = [];
  const panel = (
    width: number,
    height: number,
    position: [number, number, number],
    intensity: number,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setRGB(intensity, intensity * 0.95, intensity),
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    studio.add(mesh);
    panels.push(mesh);
  };
  panel(4.5, 4.5, [-4, 5, -4], 3);
  panel(2.5, 2.5, [1, 7, -3], 2);
  panel(0.6, 5, [4, 2, -3], 3);
  panel(4, 3, [0, 2, 5], 1.7);
  panel(3, 4, [5, 2, 0], 1.1);
  panel(5, 4, [-4, -2, 5], 1.5);
  panel(4, 4, [5, -2, -4], 0.85);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(studio, 0.04);
  generator.dispose();
  for (const mesh of panels) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
  return target;
}
