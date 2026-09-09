import { createLifecycleRenderer } from "./lifecycle-renderer";
import { observeLifecycleHost } from "./observe-lifecycle-host";
import type { ModelTemplate } from "./model-template";
import type { LifecycleScene, SceneState, SculpturePart } from "./lifecycle-types";
export type { SculptureTheme, SculpturePart, SceneState } from "./lifecycle-types";

/** Main-thread adapter also supports Storybook's synchronous, frozen review previews. */
export function createLifecycleScene(
  host: HTMLElement,
  initial: SceneState,
  modelUrl = "/brand/lifecycle/lifecycle-models.glb",
  part: SculpturePart = "assembly",
  template?: ModelTemplate,
): LifecycleScene {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const renderer = createLifecycleRenderer(
    {
      canvas,
      pixelRatio: window.devicePixelRatio,
      viewport: host.getBoundingClientRect(),
      onFrame() {
        host.dataset.frame = String(Number(host.dataset.frame ?? 0) + 1);
      },
      onRenderPending(pending) {
        host.dataset.renderPending = String(pending);
      },
    },
    initial,
    modelUrl,
    part,
    template,
  );
  host.appendChild(canvas);
  const stopObserving = observeLifecycleHost(host, renderer.resize, renderer.setVisible);
  return {
    ...renderer,
    dispose() {
      stopObserving();
      renderer.dispose();
      canvas.remove();
    },
  };
}
