import { createContext } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type ModelTemplate = { instantiate: () => THREE.Group };
export const ModelTemplateContext = createContext<ModelTemplate | undefined>(undefined);

/** Story loaders finish I/O before Storybook freezes its embedded review thumbnails. */
export async function loadModelTemplate(): Promise<ModelTemplate> {
  const response = await fetch("./brand-exploration/lifecycle-models.glb");
  if (!response.ok) throw new Error("Lifecycle model could not be loaded");
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "");
  return {
    instantiate() {
      const model = gltf.scene.clone(true);
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry = object.geometry.clone();
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone();
      });
      return model;
    },
  };
}
