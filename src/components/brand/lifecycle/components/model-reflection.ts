import * as THREE from "three";

/** A planar reflection of live model geometry, independent of the reference artwork. */
export function createModelReflection(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  source: THREE.Scene,
  plate: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>,
  model: THREE.Object3D,
  strength = 1,
  blur = 1.4,
) {
  const scene = new THREE.Scene();
  const reflectedModel = model.clone(true);
  reflectedModel.matrixAutoUpdate = false;
  const originals: THREE.Object3D[] = [];
  const copies: THREE.Object3D[] = [];
  model.traverse((object) => originals.push(object));
  reflectedModel.traverse((object) => copies.push(object));
  const transforms = originals.slice(1).map((object, index) => {
    const reflected = copies[index + 1]!;
    reflected.matrixAutoUpdate = false;
    return { source: object, reflected };
  });
  // Geometry and materials are shared with this mounted scene and disposed by its owner.
  const overlays: THREE.Object3D[] = [];
  reflectedModel.traverse((object) => {
    if (object.name === "Model footprint contact shade" || object instanceof THREE.Sprite)
      overlays.push(object);
  });
  // View-facing glow sprites and contact shading are overlays, not reflected solid geometry.
  overlays.forEach((object) => object.removeFromParent());
  scene.add(reflectedModel);
  const lights: { source: THREE.Light; reflected: THREE.Light }[] = [];
  source.traverseVisible((object) => {
    if (!(object instanceof THREE.Light)) return;
    const light = object.clone();
    light.matrixAutoUpdate = false;
    scene.add(light);
    lights.push({ source: object, reflected: light });
  });
  const mirror = new THREE.PerspectiveCamera();
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 });
  const normal = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const position = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const size = new THREE.Vector2();
  const surface = new THREE.Plane();
  const previousColor = new THREE.Color();
  const projection = plate.material.uniforms.reflectionProjection!.value as THREE.Matrix4;
  const texel = plate.material.uniforms.reflectionTexel!.value as THREE.Vector2;
  plate.material.uniforms.reflectionMap!.value = target.texture;
  plate.material.uniforms.reflectionBlur!.value = blur;

  return {
    render(dark: boolean) {
      source.updateMatrixWorld(true);
      camera.updateMatrixWorld();
      normal.set(0, 1, 0).transformDirection(plate.matrixWorld);
      origin.setFromMatrixPosition(plate.matrixWorld);
      surface.setFromNormalAndCoplanarPoint(normal, origin);
      position.setFromMatrixPosition(camera.matrixWorld);
      camera.getWorldDirection(direction);
      lookAt.copy(position).add(direction);
      position.addScaledVector(normal, -2 * surface.distanceToPoint(position));
      lookAt.addScaledVector(normal, -2 * surface.distanceToPoint(lookAt));
      mirror.position.copy(position);
      mirror.up.set(0, 1, 0).transformDirection(camera.matrixWorld).reflect(normal);
      mirror.lookAt(lookAt);
      mirror.near = camera.near;
      mirror.far = camera.far;
      mirror.projectionMatrix.copy(camera.projectionMatrix);
      mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      mirror.updateMatrixWorld();
      projection.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      projection.multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
      projection.multiply(plate.matrixWorld);
      reflectedModel.matrix.copy(model.matrixWorld);
      // Animated child parts, such as turbine rotors, must move in the reflection too.
      for (const { source: object, reflected } of transforms) {
        reflected.matrix.copy(object.matrix);
        reflected.visible = object.visible;
      }
      scene.environment = source.environment;
      scene.environmentIntensity = source.environmentIntensity;
      for (const { source: light, reflected } of lights) {
        reflected.matrix.copy(light.matrixWorld);
        reflected.color.copy(light.color);
        reflected.intensity = light.intensity;
        if (light instanceof THREE.HemisphereLight && reflected instanceof THREE.HemisphereLight)
          reflected.groundColor.copy(light.groundColor);
        if (
          light instanceof THREE.DirectionalLight &&
          reflected instanceof THREE.DirectionalLight
        ) {
          light.target.getWorldPosition(reflected.target.position);
          reflected.target.updateMatrixWorld();
        }
      }
      renderer.getDrawingBufferSize(size);
      const scale = Math.min(1, 768 / Math.max(size.x, size.y));
      const width = Math.max(1, Math.round(size.x * scale));
      const height = Math.max(1, Math.round(size.y * scale));
      if (target.width !== width || target.height !== height) target.setSize(width, height);
      texel.set(1 / width, 1 / height);
      plate.material.uniforms.reflectionStrength!.value = (dark ? 0.4 : 0.24) * strength;
      const previousTarget = renderer.getRenderTarget();
      const previousAlpha = renderer.getClearAlpha();
      renderer.getClearColor(previousColor);
      try {
        renderer.setRenderTarget(target);
        renderer.setClearColor(0, 0);
        renderer.render(scene, mirror);
      } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.setClearColor(previousColor, previousAlpha);
      }
    },
    dispose() {
      plate.material.uniforms.reflectionMap!.value = null;
      plate.material.uniforms.reflectionStrength!.value = 0;
      target.dispose();
      scene.clear();
    },
  };
}
