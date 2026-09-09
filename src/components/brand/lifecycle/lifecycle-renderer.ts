import * as THREE from "three";
import type { ModelTemplate } from "./model-template";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createStudioEnvironment } from "./components/studio-environment";
import { createOpticalKit } from "./components/optical-kit";
import { createGlassPlate, createProductPlatform } from "./components/glass-plate";
import { createNodeNetwork } from "./components/node-network";
import { createLayerJunctions, LAYER_LINKS } from "./components/layer-junctions";
import { createWorldMap } from "./components/world-map";
import { prepareModel } from "./components/model-materials";
import { createContactShadows } from "./components/contact-shadows";
import { createProductLighting } from "./components/product-lighting";
import { createModelReflection } from "./components/model-reflection";
import { createPlatformOcclusion } from "./components/platform-occlusion";
import type { OpticalWire } from "./components/optical-wire";

import type { SceneState, SceneViewport, SculpturePart } from "./lifecycle-types";
const LEVELS = [4.36, 2.18, 0, -2.18, -4.36];

function release(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
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

/** Authored miniature models and a calibrated procedural optical rig, shared by the homepage and isolated reviews. */
export function createLifecycleRenderer(
  surface: {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    pixelRatio: number;
    viewport: SceneViewport;
    onFrame(): void;
    presentAfterGpu?: boolean;
  },
  initial: SceneState,
  modelUrl = "/brand/lifecycle/lifecycle-models.glb",
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
    canvas: surface.canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: Boolean(surface.presentAfterGpu),
    powerPreference: "low-power",
  });
  // Respect a 1x display; forced supersampling adds substantial software-rendering cost.
  renderer.setPixelRatio(Math.min(Math.max(surface.pixelRatio, 1), 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  renderer.setClearColor(0x000000, 0);
  const root = new THREE.Group();
  scene.add(root);
  // A tight depth range preserves fine panel seams at the calibrated camera distance.
  const camera = new THREE.PerspectiveCamera(22, 1, 10, 100);
  // A closer, lower assembly view matches the changing plate depth from top to bottom.
  // The isolated network keeps the top layer's low viewing angle above its glass sheet.
  camera.position.set(
    assembly ? 30.5 : 35.36,
    assembly ? 21.3 : part === "network" ? 22 : 35,
    assembly ? 30.5 : 35.36,
  );
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
  const plates: ReturnType<typeof createGlassPlate>[] = [];
  const turbines: THREE.Object3D[] = [];
  const contactShadows: THREE.ShaderMaterial[] = [];

  for (let i = 0; i < LEVELS.length; i++) {
    const group = new THREE.Group();
    group.position.y = assembly ? LEVELS[i]! : 0;
    group.visible = assembly || i === focusedLayer;
    root.add(group);
    layers.push(group);
    if (part !== "product") plates.push(createGlassPlate(group, i, optics));
    for (let k = 0; part !== "product" && k < 12; k++) {
      const x = Math.sin(k * 29.4 + i) * 1.72;
      const z = Math.cos(k * 11.8 + i) * 1.72;
      addNode(group, i, x, 0.018, z, 0.16);
    }
  }
  const { vertices: network, group: networkModel } = createNodeNetwork(layers[0]!, optics);
  const productLighting = createProductLighting(layers[3]!);
  const junctions =
    part === "plate" || part === "product" ? [] : createLayerJunctions(layers, network, optics);
  // Connections follow authored junctions, including the suspended product-layer columns.
  const links: { a: number; b: number; start: number; end: number; line: OpticalWire }[] = [];
  for (let i = 0; assembly && i < 4; i++) {
    for (const [a, b, opacity] of LAYER_LINKS[i]!) {
      links.push({
        a,
        b,
        start: i,
        end: i + 1,
        line: wire([new THREE.Vector3(), new THREE.Vector3()], root, i, opacity),
      });
    }
  }
  const pulseRoutes = LEVELS.slice(0, -1).map((_, i) => links.filter((link) => link.start === i));
  const productPlatform = part !== "plate" ? createProductPlatform(layers[3]!, optics) : undefined;
  const reflections: ReturnType<typeof createModelReflection>[] = [];
  if (assembly || part === "network")
    reflections.push(
      createModelReflection(renderer, camera, scene, plates[0]!, networkModel, 0.7, 0.35),
    );
  const occlusions = assembly
    ? plates.slice(1).map((plate, i) => createPlatformOcclusion(plate, plates[i]!, camera))
    : [];
  if (assembly && productPlatform)
    occlusions.push(createPlatformOcclusion(productPlatform, plates[2]!, camera));
  createWorldMap(layers[4]!, optics);
  const aura = new THREE.Sprite(
    tint(
      new THREE.SpriteMaterial({
        map: glow,
        color: 0x6b5de8,
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
  aura.position.set(0, assembly ? -6.7 : -0.15, 0);
  aura.visible = assembly || part === "map";
  aura.scale.set(14.5, 4.9, 1);
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
  shadow.position.set(0, assembly ? -5.6 : -0.15, 0);
  shadow.scale.set(8.4, 3.3, 1);
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
  let contentReady = false;
  let inView = true;
  let frame = 0;
  let dirty = true;
  // The pinned Three.js renderer requires WebGL 2; its type still includes legacy contexts.
  const gl = renderer.getContext() as WebGL2RenderingContext;
  let pendingDraw: WebGLSync | null = null;
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
  const linkStart = new THREE.Vector3();
  const linkEnd = new THREE.Vector3();
  const color = new THREE.Color();
  const palettes = {
    dark: ["#9aafff", "#73c9ee", "#7ed9bb", "#edb582", "#d895e6"],
    light: ["#476ccc", "#267f9d", "#358763", "#b36931", "#a24ea5"],
  };
  const finishes = {
    dark: {
      Shell: "#7b698d",
      Trim: "#88719f",
      Cavity: "#191220",
      Screen: "#0d0b12",
      Glass: "#37283f",
    },
    light: {
      Shell: "#f8f7fb",
      Trim: "#dedbe4",
      Cavity: "#5b5461",
      Screen: "#35303b",
      Glass: "#73657f",
    },
  };
  const finishColor = new THREE.Color();
  function paint(dt: number, settled = false) {
    const dark = state.theme === "dark";
    productLighting.update(dark);
    (scene.background as THREE.Color).set(dark ? "#090a0d" : "#fcfcfe");
    const alpha = state.reduced || settled ? 1 : 1 - Math.exp(-dt * 6);
    for (const entry of tints) {
      color.set(
        state.colorful ? palettes[state.theme][entry.layer]! : dark ? "#c2a7e6" : "#7341b2",
      );
      if (entry.kind === "model") {
        const role = (entry.role ?? "Shell") as keyof typeof finishes.dark;
        finishColor.set(finishes[state.theme][role] ?? finishes[state.theme].Shell);
        if (entry.layer === 3 && role === "Shell") finishColor.set(dark ? "#4f3a65" : "#d7d4dd");
        if (entry.layer === 3 && role === "Trim" && dark) finishColor.set("#705487");
        if (!dark && entry.layer !== 3 && (role === "Shell" || role === "Trim"))
          finishColor.set(role === "Shell" ? "#b4afbd" : "#c4bece");
        if (entry.layer === 2) {
          if (role === "Glass") finishColor.set(dark ? "#4c365d" : "#3d3b43");
          if (role === "Shell") finishColor.set(dark ? "#78618e" : "#ecebef");
          if (role === "Trim") finishColor.set(dark ? "#aa8bc4" : "#f8f7fb");
        }
        if (entry.layer === 1 && (role === "Shell" || role === "Trim"))
          finishColor.set(
            dark
              ? role === "Shell"
                ? "#978bac"
                : "#b2a7c5"
              : role === "Shell"
                ? "#c8c3d2"
                : "#dbd7e1",
          );
        color.lerp(
          finishColor,
          role === "Cavity" || role === "Screen" || role === "Glass"
            ? 0.98
            : state.colorful
              ? 0.55
              : 0.8,
        );
      }
      if (entry.kind === "node" && !state.colorful) color.set(dark ? "#b48bdc" : "#8050c8");
      if (entry.kind === "plane" && !state.colorful && dark) color.set("#9b78ff");
      if (entry.role === "map" && !state.colorful) color.set(dark ? "#d6bbee" : "#756b83");
      if (entry.kind === "halo" && !state.colorful)
        color.set(entry.role === "aura" ? "#6b5de8" : "#9c42ee");
      if (entry.kind === "line") {
        if (!state.colorful && !dark) color.set("#9b8abd");
        color.multiplyScalar(dark ? 1.12 : 1);
        if (entry.role === "cut-edge") entry.material.opacity = dark ? 0.3 : 0.14;
        if (entry.role === "model-edge") {
          if (!state.colorful) color.set(dark ? "#c1a4dd" : "#e8e7ed");
          entry.material.opacity = dark ? 0.42 : 0.55;
        }
      }
      entry.material.color.lerp(color, alpha);
      if (entry.kind === "model" && entry.material instanceof THREE.MeshPhysicalMaterial) {
        const solid = entry.layer === 3;
        if (solid) entry.material.metalness = dark ? 0.4 : 0.15;
        else if (entry.layer === 2 && entry.role === "Glass") {
          // Alpha glazing keeps overlapping transparent structure visible inside the enclosure.
          entry.material.opacity = dark ? 0.6 : 0.7;
        } else if (entry.material.transmission > 0) {
          entry.material.opacity = 1;
          entry.material.transmission = dark ? (entry.layer === 2 ? 0.9 : 0.72) : 0.48;
          entry.material.attenuationColor.set(dark ? "#aa91c8" : "#b8adc5");
        } else {
          entry.material.opacity =
            entry.role === "Cavity" || entry.role === "Screen"
              ? 0.7
              : entry.role === "Shell"
                ? dark
                  ? entry.layer === 2
                    ? 0.3
                    : 0.22
                  : 0.48
                : entry.role === "Glass" && entry.layer === 1
                  ? dark
                    ? 0.14
                    : 0.16
                  : dark
                    ? 0.33
                    : 0.75;
        }
        entry.material.emissive.copy(entry.material.color);
        entry.material.emissiveIntensity =
          entry.role !== "Cavity" && entry.role !== "Screen"
            ? dark
              ? entry.layer === 1
                ? 0.085
                : entry.layer === 2 && entry.role !== "Glass"
                  ? 0.14
                  : 0.035
              : solid
                ? 0.05
                : 0
            : 0;
      }
      if (entry.kind === "node" && entry.material instanceof THREE.MeshPhysicalMaterial) {
        entry.material.metalness = 0.12;
        entry.material.roughness = dark ? 0.25 : 0.3;
      }
      if (entry.kind === "plane" && entry.material instanceof THREE.ShaderMaterial)
        entry.material.uniforms.strength!.value = dark
          ? entry.layer < 3
            ? 2.85
            : entry.layer === 4
              ? 1.7
              : 1
          : entry.role === "display-plinth"
            ? 0.2
            : 0.55;
      if (entry.kind === "halo") entry.material.visible = dark;
    }
    shadow.visible = !dark && (assembly || part === "map");
    for (const material of contactShadows) material.uniforms.opacity!.value = dark ? 0.12 : 0.22;
    key.intensity = dark ? 1.8 : 2.1;
    ambient.intensity = dark ? 0.16 : 0.5;
    rim.intensity = dark ? 0.7 : 1.2;
    rim.color.set(dark ? 0xb793ff : 0xffffff);
    key.color.set(dark ? 0xf3e9ff : 0xffffff);
    scene.environmentIntensity = dark ? 0.7 : 1.0;
    renderer.toneMappingExposure = dark ? 1 : 1.28;
  }
  function render(now: number, force = false) {
    frame = 0;
    // Start with the complete geometry instead of compiling an intermediate empty scene.
    if (disposed || !contentReady || (!force && !inView)) return;
    // Poll without blocking: software WebGL must finish its last frame before we submit more.
    if (pendingDraw && !force && gl.clientWaitSync(pendingDraw, 0, 0) === gl.TIMEOUT_EXPIRED) {
      frame = requestAnimationFrame(render);
      return;
    }
    if (pendingDraw) {
      gl.deleteSync(pendingDraw);
      pendingDraw = null;
      if (surface.presentAfterGpu && !force) {
        surface.onFrame();
        if (!dirty && (state.paused || state.reduced) && now >= transitionUntil) return;
      }
    }
    dirty = false;
    const elapsed = Math.max(0, (now - last) / 1000 || 0.016);
    const dt = Math.min(elapsed, 0.05);
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
      linkStart
        .copy(junctions[link.start]![link.a]!)
        .multiply(layers[link.start]!.scale)
        .add(layers[link.start]!.position);
      linkEnd
        .copy(junctions[link.end]![link.b]!)
        .multiply(layers[link.end]!.scale)
        .add(layers[link.end]!.position);
      link.line.setEndpoints(linkStart, linkEnd);
    }
    for (let i = 0; i < pulses.length; i++) {
      if (!assembly) {
        pulses[i]!.visible = false;
        continue;
      }
      const p = (time * 0.16 + i) % 4;
      const level = Math.floor(p);
      const routes = pulseRoutes[level]!;
      const link = routes[i % routes.length];
      if (!link) {
        pulses[i]!.visible = false;
        continue;
      }
      const a = junctions[level]![link.a]!;
      const b = junctions[level + 1]![link.b]!;
      const start = layers[level]!;
      const end = layers[level + 1]!;
      pulses[i]!.position.set(
        THREE.MathUtils.lerp(
          a.x * start.scale.x + start.position.x,
          b.x * end.scale.x + end.position.x,
          p - level,
        ),
        THREE.MathUtils.lerp(
          start.position.y + a.y * start.scale.y,
          end.position.y + b.y * end.scale.y,
          p - level,
        ),
        THREE.MathUtils.lerp(
          a.z * start.scale.z + start.position.z,
          b.z * end.scale.z + end.position.z,
          p - level,
        ),
      );
      pulses[i]!.visible = moving && state.theme === "dark";
    }
    for (const rotor of turbines) rotor.rotation.z = time * 0.25;
    root.updateMatrixWorld(true);
    for (const occlusion of occlusions) occlusion.update();
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
        (state.theme === "dark" ? 0.06 : 0.12) +
        proximity * 0.7 +
        wave * 1.5 +
        node.glint * (state.theme === "dark" ? 0.45 : 0.06);
      // Only a few bead junctions carry a resting optical glint.
      const glint = node.glint || (node.base > 1.4 ? 0.18 : 0.025);
      node.halo.material.opacity = Math.min(1, glint * 1.3 + proximity * 0.65 + wave * 0.8);
      node.halo.scale.setScalar(
        (0.3 + proximity * 0.2 + wave * 0.35 + node.glint * 0.8) * node.base,
      );
    }
    for (const entry of highlights) {
      entry.line.getWorldPosition(projected).project(camera);
      const proximity =
        pointerInside && moving
          ? Math.max(0, 1 - Math.hypot(projected.x - pointer.x, projected.y - pointer.y) / 0.28)
          : 0;
      entry.line.material.opacity =
        entry.opacity * (state.theme === "light" ? 1.15 : 1) + proximity * 0.4;
    }
    paint(elapsed, now >= transitionUntil);
    for (const reflection of reflections) reflection.render(state.theme === "dark");
    renderer.render(scene, camera);
    pendingDraw = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    if (surface.presentAfterGpu) {
      // Present only completed frames; page composition never waits on an in-flight WebGL buffer.
      frame = requestAnimationFrame(render);
    } else {
      surface.onFrame();
      // A slow render may finish after the transition deadline; do not queue a late frame.
      if (moving || performance.now() < transitionUntil) requestRender();
    }
  }
  function requestRender() {
    dirty = true;
    if (!disposed && contentReady && inView && !frame) frame = requestAnimationFrame(render);
  }
  let measuredWidth = 0;
  let measuredHeight = 0;
  function resize({ width, height }: SceneViewport) {
    if (!width || !height || (width === measuredWidth && height === measuredHeight)) return;
    measuredWidth = width;
    measuredHeight = height;
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
    // Resizing clears WebGL's buffer. Repaint now even if an embedded preview
    // has already frozen RAF or was mounted outside the visible review area.
    if (frame) cancelAnimationFrame(frame);
    render(performance.now(), true);
  }
  function setVisible(visible: boolean) {
    inView = visible;
    if (!inView && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    last = performance.now();
    requestRender();
  }
  resize(surface.viewport);
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
      contactShadows.push(...createContactShadows(model));
      model.traverse((object) => {
        if (object.name === "Rotor0" || object.name === "Rotor1") turbines.push(object);
      });
      if (layer === 3) {
        model.position.set(0.75, 0.01, 0.83);
        model.scale.setScalar(1.08);
      }
      if (part === "plate") {
        release(model);
      } else {
        layers[layer]!.add(model);
        const surface = layer === 3 ? productPlatform : plates[layer];
        if (surface && (assembly || focusedLayer === layer))
          reflections.push(
            createModelReflection(
              renderer,
              camera,
              scene,
              surface,
              model,
              layer === 3 ? 1 : layer === 1 ? 0.22 : 0.4,
            ),
          );
      }
    }
    // Imported materials were cloned per layer for independent palette transitions.
    importedMaterials.forEach((material) => material.dispose());
    paint(1);
  }
  let ready: Promise<void>;
  if (template) {
    installModels(template.instantiate());
    contentReady = true;
    // The first real 3D frame is part of mounting, before an embedded preview freezes RAF.
    if (frame) cancelAnimationFrame(frame);
    render(performance.now(), true);
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
        if (!disposed) {
          contentReady = true;
          requestRender();
        }
      });
  }

  return {
    ready,
    resize,
    setVisible,
    invalidate: requestRender,
    update(next: SceneState) {
      const appearanceChanged = next.theme !== state.theme || next.colorful !== state.colorful;
      state = next;
      if (next.reduced) transitionUntil = 0;
      else if (appearanceChanged) transitionUntil = performance.now() + 1200;
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
      if (pendingDraw) gl.deleteSync(pendingDraw);
      pendingDraw = null;
      reflections.forEach((reflection) => reflection.dispose());
      release(scene);
      textures.forEach((texture) => texture.dispose());
      environmentTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
