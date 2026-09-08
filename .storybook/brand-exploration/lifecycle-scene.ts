import * as THREE from "three";
import type { ModelTemplate } from "./model-template";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createStudioEnvironment } from "./components/studio-environment";
import { createOpticalKit } from "./components/optical-kit";
import { createGlassPlate, createProductPlatform } from "./components/glass-plate";
import { createNodeNetwork } from "./components/node-network";
import { createWorldMap } from "./components/world-map";
import { prepareModel } from "./components/model-materials";

export type SculpturePart =
  "assembly" | "plate" | "network" | "energy" | "factory" | "product" | "map";
export type SculptureTheme = "light" | "dark";
export type SceneState = {
  theme: SculptureTheme;
  colorful: boolean;
  paused: boolean;
  reduced: boolean;
};
const LEVELS = [4.4, 2.2, 0, -2.2, -4.4];
const ANCHORS = [
  [0, 0],
  [-1.45, 0.65],
  [1.3, 0.8],
  [-0.9, -1.2],
  [1.35, -1.12],
];

function release(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points ||
      object instanceof THREE.Sprite
    ) {
      if ("geometry" in object) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

/** Authored miniature models and a calibrated procedural optical rig, isolated to Storybook. */
export function createLifecycleScene(
  host: HTMLElement,
  initial: SceneState,
  modelUrl = "./brand-exploration/lifecycle-models.glb",
  part: SculpturePart = "assembly",
  template?: ModelTemplate,
) {
  const focusedLayer = {
    assembly: -1,
    plate: 3,
    network: 0,
    energy: 1,
    factory: 2,
    product: 3,
    map: 4,
  }[part];
  const assembly = part === "assembly";
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  renderer.setClearColor(0x000000, 0);
  const root = new THREE.Group();
  scene.add(root);
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
  camera.position.set(35.36, assembly ? 26 : 35, 35.36);
  camera.lookAt(0, assembly ? 0 : 0.25, 0);
  root.position.y = assembly ? 0.3 : 0;
  const cameraDistance = camera.position.length();
  const elevation = camera.position.y / cameraDistance;

  const environmentTarget = createStudioEnvironment(renderer);
  scene.environment = environmentTarget.texture;
  const ambient = new THREE.HemisphereLight(0xf3ecff, 0x2f2844, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xf3e9ff, 2.3);
  key.position.set(-3, 8, -1);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb793ff, 3);
  rim.position.set(5, 2, -3);
  scene.add(rim);

  const optics = createOpticalKit();
  const { textures, glow, tints, nodes, highlights, tint, wire, addNode } = optics;
  const layers: THREE.Group[] = [];
  const turbines: THREE.Object3D[] = [];

  for (let i = 0; i < LEVELS.length; i++) {
    const group = new THREE.Group();
    group.position.y = assembly ? LEVELS[i]! : 0;
    group.visible = assembly || i === focusedLayer;
    root.add(group);
    layers.push(group);
    if (part !== "product") createGlassPlate(group, i, optics);
    if (part !== "product" && part !== "plate") {
      for (const [x = 0, z = 0] of ANCHORS) {
        if (i === 0 && x === 0) continue;
        addNode(group, i, x, 0.04, z, x === 0 ? 1.5 : 0.8);
      }
    }
    for (let k = 0; part !== "product" && k < 12; k++) {
      const x = Math.sin(k * 29.4 + i) * 1.72;
      const z = Math.cos(k * 11.8 + i) * 1.72;
      addNode(group, i, x, 0.018, z, 0.16);
    }
  }
  createNodeNetwork(layers[0]!, optics);
  // Sparse diagonal links continue through the clear plates, keeping their centers legible.
  const links: { a: number; b: number; start: number; end: number; line: THREE.Line }[] = [];
  for (let i = 0; assembly && i < 4; i++) {
    for (let a = 0; a < ANCHORS.length; a++) {
      for (const b of [a, ...(a > 0 ? [(a % 4) + 1] : [])]) {
        links.push({
          a,
          b,
          start: i,
          end: i + 1,
          line: wire([new THREE.Vector3(), new THREE.Vector3()], root, i, a === b ? 0.18 : 0.09),
        });
      }
    }
  }
  if (part !== "plate") createProductPlatform(layers[3]!, optics);
  createWorldMap(layers[4]!, optics);
  const aura = new THREE.Sprite(
    tint(
      new THREE.SpriteMaterial({
        map: glow,
        color: 0x8b56d0,
        opacity: 0.34,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
      3,
      "halo",
      "aura",
    ),
  );
  aura.position.set(0, assembly ? -5.65 : -0.15, 0);
  aura.visible = assembly || part === "map";
  aura.scale.set(8.5, 3.9, 1);
  aura.renderOrder = -2;
  root.add(aura);
  const shadow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0x292237,
      opacity: 0.2,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  shadow.position.set(0, assembly ? -4.88 : -0.15, 0);
  shadow.scale.set(6.7, 2.1, 1);
  shadow.renderOrder = -3;
  root.add(shadow);
  const pulses = Array.from({ length: 4 }, (_, i) => {
    const sprite = new THREE.Sprite(
      tint(
        new THREE.SpriteMaterial({
          map: glow,
          color: 0xd5adff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
        i,
        "halo",
      ),
    );
    sprite.scale.setScalar(0.16);
    root.add(sprite);
    return sprite;
  });

  let state = initial;
  let disposed = false;
  let inView = true;
  let frame = 0;
  let last = 0;
  let time = 0;
  let transitionUntil = 0;
  let pointerInside = false;
  let activatedAt = -Infinity;
  const activation = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const cursor = new THREE.Vector2();
  const zero = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const color = new THREE.Color();
  const palettes = {
    dark: ["#9aafff", "#73c9ee", "#7ed9bb", "#edb582", "#d895e6"],
    light: ["#476ccc", "#267f9d", "#358763", "#b36931", "#a24ea5"],
  };
  const finishes = {
    dark: {
      Shell: "#685478",
      Trim: "#a996bf",
      Cavity: "#191220",
      Screen: "#0d0b12",
      Glass: "#37283f",
    },
    light: {
      Shell: "#efedf3",
      Trim: "#dedbe4",
      Cavity: "#5b5461",
      Screen: "#35303b",
      Glass: "#73657f",
    },
  };
  const finishColor = new THREE.Color();
  function paint(dt: number) {
    const dark = state.theme === "dark";
    const alpha = state.reduced ? 1 : 1 - Math.exp(-dt * 6);
    for (const entry of tints) {
      color.set(
        state.colorful ? palettes[state.theme][entry.layer]! : dark ? "#c2a7e6" : "#7341b2",
      );
      if (entry.kind === "model") {
        const role = (entry.role ?? "Shell") as keyof typeof finishes.dark;
        finishColor.set(finishes[state.theme][role] ?? finishes[state.theme].Shell);
        color.lerp(
          finishColor,
          role === "Cavity" || role === "Screen" || role === "Glass"
            ? 0.98
            : state.colorful
              ? 0.55
              : 0.8,
        );
      }
      if (entry.kind === "node" && !state.colorful && !dark) color.set("#9b68c2");
      if (entry.material instanceof THREE.PointsMaterial && !state.colorful)
        color.set(dark ? "#d6bbee" : "#756b83");
      if (entry.kind === "halo" && !state.colorful)
        color.set(entry.role === "aura" ? "#8753ce" : "#bb80ff");
      if (entry.kind === "line") color.multiplyScalar(dark ? 1.12 : 1);
      entry.material.color.lerp(color, alpha);
      if (entry.kind === "model" && entry.material instanceof THREE.MeshPhysicalMaterial) {
        const solid = entry.layer === 3;
        if (solid) entry.material.metalness = dark ? 0.64 : 0.22;
        else {
          entry.material.opacity =
            entry.role === "Cavity" || entry.role === "Screen"
              ? 0.7
              : entry.role === "Shell"
                ? dark
                  ? 0.24
                  : 0.48
                : dark
                  ? 0.42
                  : 0.75;
        }
        entry.material.emissive.copy(entry.material.color);
        entry.material.emissiveIntensity =
          dark && entry.role !== "Cavity" && entry.role !== "Screen" ? 0.035 : 0;
      }
      if (entry.kind === "node" && entry.material instanceof THREE.MeshPhysicalMaterial) {
        entry.material.metalness = dark ? 0.5 : 0.15;
        entry.material.roughness = dark ? 0.16 : 0.25;
      }
      if (entry.kind === "plane" && entry.material instanceof THREE.ShaderMaterial)
        entry.material.uniforms.strength!.value = dark ? 1 : 0.55;
      if (entry.kind === "halo") entry.material.visible = dark;
    }
    shadow.visible = !dark && (assembly || part === "map");
    key.intensity = dark ? 1.8 : 2.1;
    ambient.intensity = dark ? 0.16 : 0.5;
    rim.intensity = dark ? 0.7 : 1.2;
    rim.color.set(dark ? 0xb793ff : 0xffffff);
    key.color.set(dark ? 0xf3e9ff : 0xffffff);
    scene.environmentIntensity = dark ? 0.7 : 1.0;
  }
  function render(now: number) {
    frame = 0;
    if (disposed || !inView || document.hidden) return;
    const dt = Math.max(0, Math.min((now - last) / 1000 || 0.016, 0.05));
    last = now;
    const moving = !state.paused && !state.reduced;
    if (moving) time += dt;
    if (state.reduced) cursor.copy(zero);
    else if (moving) cursor.lerp(pointer, 1 - Math.exp(-dt * 5));
    root.rotation.y = cursor.x * (assembly ? 0.065 : 0.45);
    root.rotation.x = -cursor.y * (assembly ? 0.025 : 0.12);
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]!;
      const height =
        (assembly ? LEVELS[i]! : 0) + (state.reduced ? 0 : Math.sin(time * 0.55 + i * 0.5) * 0.025);
      // Compensate depth scale so the plates keep the reference's equal widths,
      // while perspective reveals progressively more of their upper surfaces.
      const scale = cameraDistance / (cameraDistance + height * elevation);
      layer.scale.setScalar(scale);
      layer.position.y = height * scale;
      layer.position.x = cursor.x * (4 - i) * 0.018;
      layer.position.z = cursor.y * (4 - i) * 0.012;
      if (part === "product") {
        layer.position.x -= 0.54;
        layer.position.z -= 0.62;
      }
    }
    for (const link of links) {
      const attribute = link.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (const [index, level, anchor] of [
        [0, link.start, link.a],
        [1, link.end, link.b],
      ]) {
        const group = layers[level!]!;
        attribute.setXYZ(
          index!,
          ANCHORS[anchor!]![0]! * group.scale.x + group.position.x,
          group.position.y + 0.04 * group.scale.y,
          ANCHORS[anchor!]![1]! * group.scale.z + group.position.z,
        );
      }
      attribute.needsUpdate = true;
      link.line.geometry.computeBoundingSphere();
    }
    for (let i = 0; i < pulses.length; i++) {
      if (!assembly) {
        pulses[i]!.visible = false;
        continue;
      }
      const p = (time * 0.16 + i) % 4;
      const level = Math.floor(p);
      const a = ANCHORS[i + 1]!;
      const start = layers[level]!;
      const end = layers[level + 1]!;
      const scale = THREE.MathUtils.lerp(start.scale.x, end.scale.x, p - level);
      pulses[i]!.position.set(
        a[0]! * scale + THREE.MathUtils.lerp(start.position.x, end.position.x, p - level),
        THREE.MathUtils.lerp(start.position.y, end.position.y, p - level) + 0.04 * scale,
        a[1]! * scale + THREE.MathUtils.lerp(start.position.z, end.position.z, p - level),
      );
      pulses[i]!.visible = moving && state.theme === "dark";
    }
    for (const rotor of turbines) rotor.rotation.z = time * 0.25;
    root.updateMatrixWorld(true);
    for (const node of nodes) {
      node.mesh.getWorldPosition(projected).project(camera);
      const age = (now - activatedAt) / 1000;
      const distance = Math.hypot(projected.x - activation.x, projected.y - activation.y);
      const wave =
        !state.reduced && age >= 0 && age < 1
          ? Math.exp(-Math.pow((distance - age * 2.6) / 0.14, 2)) * (1 - age)
          : 0;
      const proximity =
        pointerInside && moving
          ? Math.max(0, 1 - Math.hypot(projected.x - pointer.x, projected.y - pointer.y) / 0.24)
          : 0;
      node.mesh.scale.setScalar(node.base * (1 + proximity * 0.25));
      node.mesh.material.emissive.copy(node.mesh.material.color);
      node.mesh.material.emissiveIntensity =
        (state.theme === "dark" ? 0.06 : 0) + proximity * 0.7 + wave * 1.5 + node.glint * 1.2;
      // Only a few bead junctions carry a resting optical glint.
      const glint = node.glint || (node.base > 1.4 ? 0.18 : 0.025);
      node.halo.material.opacity = glint + proximity * 0.65 + wave * 0.8;
      node.halo.scale.setScalar(
        (0.3 + proximity * 0.2 + wave * 0.35 + node.glint * 0.6) * node.base,
      );
    }
    for (const entry of highlights) {
      if (entry.line.parent === root) {
        const a = entry.line.geometry.getAttribute("position");
        entry.midpoint.set(
          (a.getX(0) + a.getX(1)) / 2,
          (a.getY(0) + a.getY(1)) / 2,
          (a.getZ(0) + a.getZ(1)) / 2,
        );
      }
      projected.copy(entry.midpoint).applyMatrix4(entry.line.matrixWorld).project(camera);
      const proximity =
        pointerInside && moving
          ? Math.max(0, 1 - Math.hypot(projected.x - pointer.x, projected.y - pointer.y) / 0.28)
          : 0;
      (entry.line.material as THREE.LineBasicMaterial).opacity = entry.opacity + proximity * 0.4;
    }
    paint(dt);
    renderer.render(scene, camera);
    host.dataset.frame = String(Number(host.dataset.frame ?? 0) + 1);
    if (moving || now < transitionUntil) requestRender();
  }
  function requestRender() {
    if (!disposed && inView && !document.hidden && !frame) frame = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const span = assembly
      ? Math.max(11.8, (6.4 * height) / width)
      : Math.max(
          part === "product" ? 3.15 : 4.2,
          ((part === "product" ? 3.8 : 6.3) * height) / width,
        );
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(span / (2 * cameraDistance)));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    requestRender();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting);
    if (!inView && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    last = performance.now();
    requestRender();
  });
  intersection.observe(host);
  const visibility = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    last = performance.now();
    requestRender();
  };
  document.addEventListener("visibilitychange", visibility);
  resize();
  paint(1);

  const abort = new AbortController();
  function installModels(modelRoot: THREE.Group) {
    for (const name of ["EnergyModels", "FactoryModels", "ProductModels"]) {
      if (!modelRoot.getObjectByName(name)) {
        release(modelRoot);
        throw new Error(`Lifecycle asset missing ${name}`);
      }
    }
    const importedMaterials = new Set<THREE.Material>();
    modelRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          importedMaterials.add(material);
      }
    });
    for (const [name, layer] of [
      ["EnergyModels", 1],
      ["FactoryModels", 2],
      ["ProductModels", 3],
    ] as const) {
      const model = modelRoot.getObjectByName(name);
      if (!model) throw new Error(`Lifecycle asset missing ${name}`);
      prepareModel(model, layer, optics);
      model.traverse((object) => {
        if (object.name === "Rotor0" || object.name === "Rotor1") turbines.push(object);
      });
      if (layer === 2) model.position.set(0.15, 0, 0.15);
      if (layer === 3) {
        model.position.set(0.75, 0.01, 0.83);
        model.scale.setScalar(1.08);
      }
      if (part === "plate") {
        release(model);
      } else layers[layer]!.add(model);
    }
    // Imported materials were cloned per layer for independent palette transitions.
    importedMaterials.forEach((material) => material.dispose());
    paint(1);
  }
  let ready: Promise<void>;
  if (template) {
    installModels(template.instantiate());
    // The first real 3D frame is part of mounting, before an embedded preview freezes RAF.
    if (frame) cancelAnimationFrame(frame);
    render(performance.now());
    ready = Promise.resolve();
  } else {
    ready = fetch(modelUrl, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Lifecycle model could not be loaded");
        return response.arrayBuffer();
      })
      .then((buffer) => new GLTFLoader().parseAsync(buffer, ""))
      .then(async (gltf) => {
        if (disposed) {
          release(gltf.scene);
          return;
        }
        installModels(gltf.scene);
        await renderer.compileAsync(scene, camera);
        if (!disposed) requestRender();
      });
  }

  return {
    ready,
    update(next: SceneState) {
      state = next;
      transitionUntil = performance.now() + (next.reduced ? 0 : 1200);
      requestRender();
    },
    activate(x = 0, y = 0) {
      activation.set(x, y);
      activatedAt = performance.now();
      transitionUntil = performance.now() + 1200;
      requestRender();
    },
    pointer(x: number, y: number) {
      pointer.set(x, y);
      pointerInside = true;
      if (!state.paused && !state.reduced) requestRender();
    },
    leave() {
      pointer.set(0, 0);
      pointerInside = false;
      if (!state.paused && !state.reduced) requestRender();
    },
    reset() {
      time = 0;
      activatedAt = -Infinity;
      cursor.copy(zero);
      pointer.copy(zero);
      pointerInside = false;
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      release(scene);
      textures.forEach((texture) => texture.dispose());
      environmentTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
