import { observeLifecycleHost } from "./observe-lifecycle-host";
import type {
  LifecycleScene,
  SceneState,
  SculpturePart,
  WorkerRequest,
  WorkerResponse,
} from "./lifecycle-types";

/** Keep the complete optical rig off the page's input, layout and navigation thread. */
export function createWorkerLifecycleScene(
  host: HTMLElement,
  initial: SceneState,
  modelUrl = "/brand/lifecycle/lifecycle-models.glb",
  part: SculpturePart = "assembly",
): LifecycleScene {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const presentation = canvas.getContext("bitmaprenderer");
  if (!presentation) throw new Error("Canvas presentation is unavailable");
  const worker = new Worker(new URL("./lifecycle.worker.ts", import.meta.url), { type: "module" });
  let disposed = false;
  let rendered = false;
  let terminateTimer: ReturnType<typeof setTimeout> | undefined;
  const { promise: ready, resolve, reject } = Promise.withResolvers<void>();
  const send = (message: WorkerRequest) => {
    if (!disposed) worker.postMessage(message);
  };
  const fail = () => {
    if (disposed) return;
    reject(new Error("Lifecycle worker could not render the artwork"));
    if (rendered) canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  };
  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    if (data.type === "disposed") {
      clearTimeout(terminateTimer);
      worker.terminate();
    } else if (data.type === "frame") {
      if (disposed) {
        data.bitmap.close();
        return;
      }
      if (canvas.width !== data.bitmap.width) canvas.width = data.bitmap.width;
      if (canvas.height !== data.bitmap.height) canvas.height = data.bitmap.height;
      presentation.transferFromImageBitmap(data.bitmap);
      host.dataset.frame = String(data.count);
      send({ type: "presented" });
      rendered = true;
      resolve();
    } else if (data.type === "error") fail();
  };
  worker.onerror = (event) => {
    event.preventDefault();
    fail();
  };
  worker.onmessageerror = fail;
  const { width, height } = host.getBoundingClientRect();
  worker.postMessage({
    type: "init",
    pixelRatio: window.devicePixelRatio,
    viewport: { width, height },
    state: initial,
    modelUrl: new URL(modelUrl, window.location.href).href,
    part,
  } satisfies WorkerRequest);
  host.appendChild(canvas);
  const stopObserving = observeLifecycleHost(
    host,
    (viewport) => send({ type: "resize", viewport }),
    (visible) => send({ type: "visible", visible }),
  );
  return {
    ready,
    update: (state) => send({ type: "update", state }),
    pointer: (x, y) => send({ type: "pointer", x, y }),
    activate: (x = 0, y = 0) => send({ type: "activate", x, y }),
    leave: () => send({ type: "leave" }),
    reset: () => send({ type: "reset" }),
    dispose() {
      if (disposed) return;
      stopObserving();
      send({ type: "dispose" });
      disposed = true;
      canvas.remove();
      // Normal disposal releases GPU resources first; terminate a stalled/lost context too.
      terminateTimer = setTimeout(() => worker.terminate(), 1000);
    },
  };
}
