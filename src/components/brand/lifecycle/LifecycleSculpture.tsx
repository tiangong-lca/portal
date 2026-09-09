"use client";

import {
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Moon, Sun, Pause, Play, RotateCcw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLifecycleScene, type SculptureTheme, type SculpturePart } from "./lifecycle-scene";
import { createWorkerLifecycleScene } from "./lifecycle-worker-scene";
import "./lifecycle-sculpture.css";
import { useSiteTheme } from "@/components/shell/use-site-theme";
import { useTranslations } from "next-intl";
import type { PortalLocale } from "@/i18n/routing";
import { SculptureOutline } from "../sculpture-outline";
import { ModelTemplateContext } from "./model-template";

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => false;

export type LifecycleSculptureProps = {
  /** Focus one independently authored part for geometry and material review. */
  part?: SculpturePart;
  initialTheme?: SculptureTheme;
  initialColorful?: boolean;
  reducedMotion?: boolean;
  unavailable?: boolean;
  /** Model URL, exposed here for the isolated asset-failure review scenario. */
  assetUrl?: string;
  locale?: PortalLocale;
  /** Embed the accepted artwork without the study heading and theme controls. */
  presentation?: "study" | "hero";
  /** A controlled theme for embedding in the public site. */
  theme?: SculptureTheme;
};

/**
 * @import import { LifecycleSculpture } from "@/components/brand/lifecycle/LifecycleSculpture";
 */
export function LifecycleSculpture({
  part = "assembly",
  initialTheme = "dark",
  initialColorful = false,
  reducedMotion = false,
  unavailable = false,
  assetUrl,
  locale = "zh-CN",
  presentation = "study",
  theme: controlledTheme,
}: LifecycleSculptureProps) {
  const t = useTranslations("Sculpture");
  const hero = presentation === "hero";
  const template = useContext(ModelTemplateContext);
  const [localTheme, setTheme] = useState(initialTheme);
  const siteTheme = useSiteTheme();
  const theme = controlledTheme ?? (hero ? siteTheme : localTheme);
  const [colorful, setColorful] = useState(initialColorful);
  const [paused, setPaused] = useState(hero);
  const motionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemReduced = useSyncExternalStore(subscribeMotion, getMotion, serverMotion);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const host = useRef<HTMLSpanElement>(null);
  const scene = useRef<ReturnType<typeof createLifecycleScene> | null>(null);
  const down = useRef({ x: 0, y: 0 });
  const hintId = useId();
  const reduced = reducedMotion || systemReduced;
  const current = useRef({ theme, colorful, paused, reduced });
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const lost = (event: Event) => {
      if (!mounted || !scene.current) return;
      event.preventDefault();
      scene.current?.dispose();
      scene.current = null;
      setStatus("unavailable");
    };
    let canvas: HTMLCanvasElement | null = null;
    let mounted = true;
    const initialize = () => {
      setStatus("loading");
      if (unavailable) {
        setStatus("unavailable");
        return;
      }
      try {
        const useWorker =
          hero &&
          !template &&
          typeof OffscreenCanvas !== "undefined" &&
          typeof ImageBitmapRenderingContext !== "undefined";
        const instance = useWorker
          ? createWorkerLifecycleScene(element, current.current, assetUrl, part)
          : createLifecycleScene(element, current.current, assetUrl, part, template);
        scene.current = instance;
        if (template) setStatus("ready");
        canvas = element.querySelector("canvas");
        canvas?.addEventListener("webglcontextlost", lost);
        instance.ready
          .then(() => {
            if (mounted && scene.current === instance) setStatus("ready");
          })
          .catch(() => {
            if (mounted && scene.current === instance) {
              instance.dispose();
              scene.current = null;
              setStatus("failed");
            }
          });
      } catch {
        setStatus("unavailable");
      }
    };
    initialize();
    return () => {
      mounted = false;
      canvas?.removeEventListener("webglcontextlost", lost);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [unavailable, assetUrl, attempt, part, template, hero]);
  useEffect(() => {
    current.current = { theme, colorful, paused, reduced };
    scene.current?.update(current.current);
  }, [theme, colorful, paused, reduced]);
  useEffect(
    () => () => {
      if (motionTimer.current !== null) clearTimeout(motionTimer.current);
    },
    [],
  );
  // The public hero has no playback toolbar: motion follows input, then settles.
  const animateHeroInteraction = () => {
    if (!hero || reduced) return;
    setPaused(false);
    if (motionTimer.current !== null) clearTimeout(motionTimer.current);
    motionTimer.current = setTimeout(() => setPaused(true), 1500);
  };
  const leaveArtwork = () => {
    scene.current?.leave();
    animateHeroInteraction();
  };
  const toggle = () => {
    scene.current?.activate();
    setColorful((value) => !value);
  };

  return (
    <section
      className={`lifecycle-study ${theme === "dark" ? "dark" : ""}`}
      lang={locale}
      data-presentation={presentation}
      data-part={part}
      data-theme={theme}
      data-color={colorful ? "multi" : "purple"}
      data-motion={reduced ? "reduced" : paused ? "paused" : "running"}
      data-renderer={status}
    >
      {!hero && (
        <header className="lifecycle-toolbar">
          <div className="lifecycle-heading">
            <p>{t("subtitle")}</p>
            <h1>{part === "assembly" ? t("title") : t(`parts.${part}`)}</h1>
          </div>
          <div className="lifecycle-controls">
            <Button
              variant="outline"
              size="icon"
              aria-label={t("theme")}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            >
              <Sun className="lifecycle-light-icon" aria-hidden />
              <Moon className="lifecycle-dark-icon" aria-hidden />
            </Button>
            <Button
              variant="outline"
              aria-label={t("color")}
              aria-pressed={colorful}
              onClick={toggle}
              disabled={status !== "ready"}
            >
              <Palette aria-hidden />
              {colorful ? t("multi") : t("purple")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("pause")}
              aria-pressed={paused || reduced}
              disabled={reduced || status !== "ready"}
              onClick={() => setPaused((value) => !value)}
            >
              {paused || reduced ? <Play aria-hidden /> : <Pause aria-hidden />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("reset")}
              disabled={status !== "ready"}
              onClick={() => {
                setColorful(false);
                setPaused(false);
                scene.current?.reset();
              }}
            >
              <RotateCcw aria-hidden />
            </Button>
          </div>
        </header>
      )}
      <div className="lifecycle-stage">
        {hero && status !== "ready" && <SculptureOutline />}
        <button
          type="button"
          className="lifecycle-object"
          aria-label={t("object")}
          aria-describedby={hintId}
          aria-pressed={colorful}
          disabled={status !== "ready"}
          onPointerDown={(event) => {
            down.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            if (event.pointerType === "touch") return;
            animateHeroInteraction();
            const rect = event.currentTarget.getBoundingClientRect();
            scene.current?.pointer(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              -(((event.clientY - rect.top) / rect.height) * 2 - 1),
            );
          }}
          onPointerLeave={leaveArtwork}
          onBlur={leaveArtwork}
          onClick={(event) => {
            if (
              event.detail === 0 ||
              Math.hypot(event.clientX - down.current.x, event.clientY - down.current.y) < 12
            ) {
              animateHeroInteraction();
              const rect = event.currentTarget.getBoundingClientRect();
              if (event.detail === 0) scene.current?.activate();
              else
                scene.current?.activate(
                  ((event.clientX - rect.left) / rect.width) * 2 - 1,
                  -(((event.clientY - rect.top) / rect.height) * 2 - 1),
                );
              setColorful((value) => !value);
            }
          }}
        >
          <span ref={host} className="lifecycle-canvas" />
        </button>
        {status !== "ready" && !hero && (
          <div className="lifecycle-fallback">
            <output>
              {status === "loading"
                ? t("loading")
                : status === "failed"
                  ? t("failed")
                  : t("unavailable")}
            </output>
            {status === "failed" && (
              <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                {t("retry")}
              </Button>
            )}
          </div>
        )}
      </div>
      {hero ? (
        <p id={hintId} className="sr-only">
          {reduced ? t("reduced") : t("hint")}
        </p>
      ) : (
        <footer className="lifecycle-footer">
          <p id={hintId}>{reduced ? t("reduced") : t("hint")}</p>
          <span>{t("concept")}</span>
        </footer>
      )}
    </section>
  );
}
