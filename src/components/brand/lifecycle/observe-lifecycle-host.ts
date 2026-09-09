import type { SceneViewport } from "./lifecycle-types";

/** The render core receives dimensions and visibility without depending on the DOM. */
export function observeLifecycleHost(
  host: HTMLElement,
  resize: (viewport: SceneViewport) => void,
  setVisible: (visible: boolean) => void,
) {
  let inView = true;
  const visibility = () => setVisible(inView && !document.hidden);
  const observer = new ResizeObserver(([entry]) => {
    if (entry) resize({ width: entry.contentRect.width, height: entry.contentRect.height });
  });
  const intersection = new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting);
    visibility();
  });
  observer.observe(host);
  intersection.observe(host);
  document.addEventListener("visibilitychange", visibility);
  visibility();
  return () => {
    observer.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", visibility);
  };
}
