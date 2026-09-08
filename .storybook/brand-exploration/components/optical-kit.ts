import * as THREE from "three";
import { OpticalWire } from "./optical-wire";

type ColorMaterial = THREE.Material & { color: THREE.Color };
export type Tint = {
  material: ColorMaterial;
  layer: number;
  kind: "line" | "node" | "plane" | "model" | "halo";
  role?: string;
};

export function createOpticalKit() {
  const textures: THREE.Texture[] = [];
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const context = glowCanvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,.55)");
  gradient.addColorStop(0.35, "rgba(255,255,255,.14)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const glow = new THREE.CanvasTexture(glowCanvas);
  textures.push(glow);
  const pointCanvas = document.createElement("canvas");
  pointCanvas.width = pointCanvas.height = 16;
  const pointContext = pointCanvas.getContext("2d")!;
  pointContext.fillStyle = "white";
  pointContext.beginPath();
  pointContext.arc(8, 8, 6.5, 0, Math.PI * 2);
  pointContext.fill();
  const dot = new THREE.CanvasTexture(pointCanvas);
  textures.push(dot);

  const tints: Tint[] = [];
  const highlights: { line: OpticalWire; opacity: number }[] = [];
  const nodes: {
    mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhysicalMaterial>;
    halo: THREE.Sprite;
    base: number;
    glint: number;
  }[] = [];
  const tint = <T extends ColorMaterial>(
    material: T,
    layer: number,
    kind: Tint["kind"],
    role?: string,
  ) => {
    tints.push({ material, layer, kind, role });
    return material;
  };
  const lineMaterial = (layer: number, opacity = 0.3) =>
    tint(
      new THREE.LineBasicMaterial({
        color: 0xb696e8,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
      layer,
      "line",
    );
  const filament = new THREE.CylinderGeometry(0.0055, 0.0055, 1, 6, 1, true);
  const wire = (points: THREE.Vector3[], parent: THREE.Object3D, layer: number, opacity = 0.3) => {
    const line = new OpticalWire(
      filament,
      tint(
        new THREE.MeshBasicMaterial({
          color: 0xb696e8,
          transparent: true,
          opacity,
          depthWrite: false,
          toneMapped: false,
        }),
        layer,
        "line",
      ),
    );
    line.setEndpoints(points[0]!, points[1]!);
    parent.add(line);
    highlights.push({ line, opacity });
    return line;
  };
  const sphere = new THREE.SphereGeometry(0.058, 28, 20);
  const addNode = (
    parent: THREE.Object3D,
    layer: number,
    x: number,
    y: number,
    z: number,
    base = 1,
    glint = 0,
  ) => {
    const material = tint(
      new THREE.MeshPhysicalMaterial({
        color: 0xc3a7e7,
        metalness: 0.5,
        roughness: 0.16,
        clearcoat: 1,
        emissive: 0xb98eea,
        emissiveIntensity: 0.07,
      }),
      layer,
      "node",
    );
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(base);
    parent.add(mesh);
    const halo = new THREE.Sprite(
      tint(
        new THREE.SpriteMaterial({
          map: glow,
          color: 0xb782ff,
          transparent: true,
          opacity: 0.24,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
        layer,
        "halo",
      ),
    );
    halo.position.copy(mesh.position);
    halo.scale.setScalar(0.38 * base);
    parent.add(halo);
    nodes.push({ mesh, halo, base, glint });
  };

  return { textures, glow, dot, tints, nodes, highlights, tint, lineMaterial, wire, addNode };
}
export type OpticalKit = ReturnType<typeof createOpticalKit>;
