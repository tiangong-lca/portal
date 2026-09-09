/// <reference lib="webworker" />

import { createLifecycleRenderer } from "./lifecycle-renderer";
import type { WorkerRequest, WorkerResponse } from "./lifecycle-types";

const scope = self as unknown as DedicatedWorkerGlobalScope;
let scene: ReturnType<typeof createLifecycleRenderer> | undefined;
let disposed = false;
let frames = 0;
let inFlight = false;
let presentationPending = false;
const reply = (message: WorkerResponse) => scope.postMessage(message);
const fail = () => {
  if (disposed) return;
  disposed = true;
  scene?.dispose();
  reply({ type: "error" });
};

scope.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  if (disposed) return;
  try {
    switch (data.type) {
      case "init": {
        const canvas = new OffscreenCanvas(1, 1);
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          fail();
        });
        scene = createLifecycleRenderer(
          {
            canvas,
            pixelRatio: data.pixelRatio,
            viewport: data.viewport,
            presentAfterGpu: true,
            onFrame: () => {
              if (inFlight) {
                presentationPending = true;
                return;
              }
              const bitmap = canvas.transferToImageBitmap();
              inFlight = true;
              scope.postMessage(
                { type: "frame", count: ++frames, bitmap } satisfies WorkerResponse,
                [bitmap],
              );
            },
          },
          data.state,
          data.modelUrl,
          data.part,
        );
        void scene.ready.catch(fail);
        break;
      }
      case "presented":
        inFlight = false;
        if (presentationPending) {
          presentationPending = false;
          scene?.invalidate();
        }
        break;
      case "resize":
        scene?.resize(data.viewport);
        break;
      case "visible":
        scene?.setVisible(data.visible);
        break;
      case "update":
        scene?.update(data.state);
        break;
      case "pointer":
        scene?.pointer(data.x, data.y);
        break;
      case "activate":
        scene?.activate(data.x, data.y);
        break;
      case "leave":
        scene?.leave();
        break;
      case "reset":
        scene?.reset();
        break;
      case "dispose":
        disposed = true;
        scene?.dispose();
        reply({ type: "disposed" });
        scope.close();
        break;
    }
  } catch {
    fail();
  }
};
