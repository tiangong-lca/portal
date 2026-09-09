export type SculpturePart =
  "assembly" | "plate" | "network" | "energy" | "factory" | "product" | "map";
export type SculptureTheme = "light" | "dark";
export type SceneState = {
  theme: SculptureTheme;
  colorful: boolean;
  paused: boolean;
  reduced: boolean;
};

export type SceneViewport = { width: number; height: number };
export type LifecycleScene = {
  ready: Promise<void>;
  update(state: SceneState): void;
  activate(x?: number, y?: number): void;
  pointer(x: number, y: number): void;
  leave(): void;
  reset(): void;
  dispose(): void;
};

export type WorkerRequest =
  | {
      type: "init";
      pixelRatio: number;
      viewport: SceneViewport;
      state: SceneState;
      modelUrl: string;
      part: SculpturePart;
    }
  | { type: "resize"; viewport: SceneViewport }
  | { type: "visible"; visible: boolean }
  | { type: "update"; state: SceneState }
  | { type: "activate" | "pointer"; x: number; y: number }
  | { type: "leave" | "reset" | "dispose" | "presented" };
export type WorkerResponse =
  { type: "frame"; count: number; bitmap: ImageBitmap } | { type: "error" } | { type: "disposed" };
