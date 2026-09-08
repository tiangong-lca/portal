import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

let initialized = false;

/** Finite studio lights produce soft, moving reflections across the product's real surfaces. */
export function createProductLighting(parent: THREE.Group) {
  if (!initialized) {
    RectAreaLightUniformsLib.init();
    initialized = true;
  }
  const front = new THREE.RectAreaLight(0xf4e9ff, 4, 1.8, 2.4);
  front.position.set(-0.75, 1.6, 3.4);
  front.lookAt(0.75, 0.5, 0.83);
  const edge = new THREE.RectAreaLight(0xe5d0ff, 2, 0.45, 1.8);
  edge.position.set(3.1, 1.25, -0.1);
  edge.lookAt(0.75, 0.5, 0.83);
  const top = new THREE.RectAreaLight(0xf6eaff, 6, 0.8, 0.6);
  top.position.set(-0.7, 1.9, -0.8);
  top.lookAt(0.75, 0.9, 0.83);
  parent.add(front, edge, top);
  return {
    update(dark: boolean) {
      front.color.set(dark ? 0xf4e9ff : 0xffffff);
      edge.color.set(dark ? 0xe5d0ff : 0xffffff);
      top.color.set(dark ? 0xf6eaff : 0xffffff);
      front.intensity = 2;
      edge.intensity = dark ? 2 : 1;
      top.intensity = dark ? 6 : 3;
    },
  };
}
