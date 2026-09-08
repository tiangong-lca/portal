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
      clipping: true,
      uniforms: {
        glassColor: { value: color },
        strength: { value: 1 },
        gain: { value: gain },
        reflectionMap: { value: null },
        reflectionProjection: { value: new THREE.Matrix4() },
        reflectionTexel: { value: new THREE.Vector2() },
        reflectionStrength: { value: 0 },
        reflectionBlur: { value: 1.4 },
      },
      vertexShader: `
        #include <clipping_planes_pars_vertex>
        uniform mat4 reflectionProjection;
        varying vec4 vReflection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vUv = uv;
          vReflection = reflectionProjection * vec4(position, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vView = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
          #include <clipping_planes_vertex>
        }
      `,
      fragmentShader: `
        #include <clipping_planes_pars_fragment>
        uniform vec3 glassColor;
        uniform float strength;
        uniform float gain;
        uniform sampler2D reflectionMap;
        uniform vec2 reflectionTexel;
        uniform float reflectionStrength;
        uniform float reflectionBlur;
        varying vec4 vReflection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          #include <clipping_planes_fragment>
          float facing = abs(dot(normalize(vNormal), normalize(vView)));
          float fresnel = pow(1.0 - facing, 3.0);
          float sheen = exp(-dot(vUv - vec2(0.86, 0.14), vUv - vec2(0.86, 0.14)) * 6.0);
          float edge = min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y));
          float rim = exp(-edge * 170.0);
          float a = min(0.9, (0.012 + 0.13 * sheen + 0.04 * fresnel + rim * 0.13) * strength * gain);
          vec3 reflection = mix(glassColor, vec3(0.93, 0.87, 1.0), pow(sheen, 4.0) * 0.38);
          gl_FragColor = vec4(reflection, a);
          if (reflectionStrength > 0.0 && vReflection.w > 0.0) {
            vec2 uv = vReflection.xy / vReflection.w;
            vec2 blur = reflectionTexel * reflectionBlur;
            vec4 reflected = texture2D(reflectionMap, uv) * 0.32;
            reflected += texture2D(reflectionMap, uv + vec2(blur.x, 0.0)) * 0.17;
            reflected += texture2D(reflectionMap, uv - vec2(blur.x, 0.0)) * 0.17;
            reflected += texture2D(reflectionMap, uv + vec2(0.0, blur.y)) * 0.17;
            reflected += texture2D(reflectionMap, uv - vec2(0.0, blur.y)) * 0.17;
            reflected.rgb /= max(reflected.a, 0.001);
            #ifdef TONE_MAPPING
              reflected.rgb = toneMapping(reflected.rgb);
            #endif
            float coverage = reflected.a * reflectionStrength * (0.55 + 0.45 * fresnel);
            float combined = coverage + a * (1.0 - coverage);
            gl_FragColor = vec4(
              (reflected.rgb * coverage + reflection * a * (1.0 - coverage)) / max(combined, 0.001),
              combined
            );
          }
          #include <colorspace_fragment>
        }
      `,
    }),
    { color },
  );
  kit.tint(material, layer, "plane", gain > 1 ? "display-plinth" : undefined);
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
  return Object.assign(plate, {
    occlusionMaterials: [material, edge.material, bandMaterial] as THREE.Material[],
  });
}

export function createProductPlatform(parent: THREE.Group, kit: OpticalKit) {
  const platform = new THREE.Group();
  platform.position.set(1, 0.012, 1);
  platform.scale.set(2.14 / 4.15, 1, 2.14 / 4.15);
  const plate = createGlassPlate(platform, 3, kit, 4);
  const lattice: THREE.Vector3[] = [];
  for (let i = -2; i <= 2; i++) {
    lattice.push(new THREE.Vector3(i * 0.7, 0.004, -2), new THREE.Vector3(i * 0.7, 0.004, 2));
    lattice.push(new THREE.Vector3(-2, 0.004, i * 0.7), new THREE.Vector3(2, 0.004, i * 0.7));
  }
  const latticeMaterial = kit.lineMaterial(3, 0.16);
  plate.occlusionMaterials.push(latticeMaterial);
  platform.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lattice), latticeMaterial),
  );
  for (const x of [-1.4, 0, 1.4]) {
    for (const z of [-1.4, 0, 1.4]) {
      const point = new THREE.Vector3(x, 0.01, z).multiply(platform.scale).add(platform.position);
      kit.addNode(parent, 3, point.x, point.y, point.z, 0.22);
    }
  }
  parent.add(platform);
  return plate;
}
