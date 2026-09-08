import * as THREE from "three";
import type { OpticalKit } from "./optical-kit";

/** Per-material optical finishes for editable, authored GLB geometry. */
export function prepareModel(model: THREE.Object3D, layer: number, kit: OpticalKit) {
  const outlines: { mesh: THREE.Mesh; line: THREE.LineSegments }[] = [];
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    const materials = originals.map((original) => {
      const role = original.name;
      const solid = layer === 3;
      const cavity = role === "Cavity" || role === "Screen";
      const glass = role === "Glass";
      const material = new THREE.MeshPhysicalMaterial({
        name: role,
        metalness: cavity ? 0.25 : solid ? 0.64 : 0.35,
        roughness: role === "Trim" ? 0.18 : glass ? 0.12 : 0.28,
        clearcoat: solid ? 0.9 : 0.4,
        clearcoatRoughness: 0.14,
        envMapIntensity: solid ? 1.2 : 0.65,
        transparent: !solid || glass,
        opacity: solid ? (glass ? 0.68 : 1) : cavity ? 0.7 : role === "Shell" ? 0.24 : 0.42,
        depthWrite: solid && !glass,
      });
      kit.tint(material, layer, "model", role);
      return material;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0]!;
    // Edge detail is subtle and continuous; the model's highlights come from lighting.
    outlines.push({
      mesh: object,
      line: new THREE.LineSegments(
        new THREE.EdgesGeometry(object.geometry, 38),
        kit.lineMaterial(layer, layer === 3 ? 0.08 : 0.23),
      ),
    });
  });
  for (const { mesh, line } of outlines) mesh.add(line);
}
