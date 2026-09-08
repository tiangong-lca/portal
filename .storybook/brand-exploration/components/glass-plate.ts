import * as THREE from "three";
import type { OpticalKit } from "./optical-kit";

/** Thin optical glass: view-dependent sheen, an engraved surface and a fine cut edge. */
export function createGlassPlate(parent: THREE.Group, layer: number, kit: OpticalKit, gain = 1) {
  const color = new THREE.Color("#a98bce");
  const material = Object.assign(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { glassColor: { value: color }, strength: { value: 1 }, gain: { value: gain } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vUv = uv;
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          vView = -p.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * p;
        }
      `,
      fragmentShader: `
        uniform vec3 glassColor;
        uniform float strength;
        uniform float gain;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float facing = abs(dot(normalize(vNormal), normalize(vView)));
          float fresnel = pow(1.0 - facing, 3.0);
          float sheen = exp(-dot(vUv - vec2(0.86, 0.14), vUv - vec2(0.86, 0.14)) * 6.0);
          float edge = min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y));
          float rim = exp(-edge * 170.0);
          float a = (0.018 + 0.23 * sheen + 0.04 * fresnel + rim * 0.13) * strength * gain;
          vec3 reflection = mix(glassColor, vec3(0.93, 0.87, 1.0), pow(sheen, 4.0) * 0.38);
          gl_FragColor = vec4(reflection, a);
          #include <colorspace_fragment>
        }
      `,
    }),
    { color },
  );
  kit.tint(material, layer, "plane");
  const geometry = new THREE.PlaneGeometry(4.15, 4.15);
  geometry.rotateX(-Math.PI / 2);
  const plate = new THREE.Mesh(geometry, material);
  plate.name = "Optical glass plate";
  parent.add(plate);
  const path = [
    new THREE.Vector3(-2.075, 0, -2.075),
    new THREE.Vector3(2.075, 0, -2.075),
    new THREE.Vector3(2.075, 0, 2.075),
    new THREE.Vector3(-2.075, 0, 2.075),
  ];
  const edge = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(path),
    kit.lineMaterial(layer, 0.4),
  );
  parent.add(edge);
  // A real cut edge gives the optical sheet thickness when the view moves.
  const band = new THREE.PlaneGeometry(4.15, 0.024);
  const bandMaterial = kit.tint(
    new THREE.MeshBasicMaterial({
      color: 0xbca2db,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    layer,
    "line",
    "cut-edge",
  );
  for (let side = 0; side < 4; side++) {
    const wall = new THREE.Mesh(band, bandMaterial);
    const angle = (side * Math.PI) / 2;
    wall.position.set(Math.sin(angle) * 2.075, -0.012, Math.cos(angle) * 2.075);
    wall.rotation.y = angle;
    parent.add(wall);
  }
  return plate;
}

export function createProductPlatform(parent: THREE.Group, kit: OpticalKit) {
  const platform = new THREE.Group();
  platform.position.set(0.54, 0.012, 0.84);
  platform.scale.set(2.18 / 4.15, 1, 1.85 / 4.15);
  createGlassPlate(platform, 3, kit, 1.6);
  const lattice: THREE.Vector3[] = [];
  for (let i = -2; i <= 2; i++) {
    lattice.push(new THREE.Vector3(i * 0.7, 0.004, -2), new THREE.Vector3(i * 0.7, 0.004, 2));
    lattice.push(new THREE.Vector3(-2, 0.004, i * 0.7), new THREE.Vector3(2, 0.004, i * 0.7));
  }
  platform.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(lattice),
      kit.lineMaterial(3, 0.16),
    ),
  );
  parent.add(platform);
}
