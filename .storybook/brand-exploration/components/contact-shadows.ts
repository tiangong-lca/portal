import * as THREE from "three";

/** Analytic contact shading from the authored model footprints; no baked image assets. */
export function createContactShadows(model: THREE.Object3D) {
  const raw: unknown = JSON.parse(String(model.userData.contactFootprints ?? "[]"));
  if (!Array.isArray(raw)) throw new Error("Invalid lifecycle model footprints");
  return raw.map((footprint: unknown) => {
    if (!Array.isArray(footprint) || footprint.length !== 4 || !footprint.every(Number.isFinite))
      throw new Error("Invalid lifecycle model footprint");
    const [x, z, width, depth] = footprint as [number, number, number, number];
    const feather = 0.08;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        opacity: { value: 0.16 },
        size: { value: new THREE.Vector2(width + feather * 4, depth + feather * 4) },
        footprint: { value: new THREE.Vector2(width / 2, depth / 2) },
        feather: { value: feather },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 size;
        uniform vec2 footprint;
        uniform float feather;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec2 q = abs((vUv - 0.5) * size) - footprint;
          float outside = length(max(q, 0.0));
          float shade = exp(-outside * outside / (feather * feather * 0.45));
          gl_FragColor = vec4(0.09, 0.065, 0.12, shade * opacity);
          #include <colorspace_fragment>
        }
      `,
    });
    const geometry = new THREE.PlaneGeometry(width + feather * 4, depth + feather * 4);
    geometry.rotateX(-Math.PI / 2);
    const shadow = new THREE.Mesh(geometry, material);
    shadow.name = "Model footprint contact shade";
    shadow.position.set(x, 0.008, z);
    model.add(shadow);
    return material;
  });
}
