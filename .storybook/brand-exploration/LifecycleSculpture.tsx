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
import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/source-sans-3";
import "./lifecycle-sculpture.css";
import { ModelTemplateContext } from "./model-template";

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => false;

const copy = {
  "zh-CN": {
    title: "生命周期 · 交互探索",
    subtitle: "Tiangong LCA",
    hint: "移动鼠标探索层次，点击图形切换色彩",
    theme: "暗色模式",
    color: "多彩模式",
    pause: "暂停动效",
    reset: "重置",
    object: "生命周期分层图形，点击切换多彩模式",
    loading: "正在构建场景…",
    failed: "场景资源暂时无法加载，请重试。",
    retry: "重新加载",
    unavailable: "当前浏览器无法显示交互图形，请启用硬件加速或使用支持 WebGL 的浏览器。",
    reduced: "已遵循减少动态效果设置",
    purple: "品牌紫",
    multi: "多彩",
    concept: "视觉概念，非数据或计算结果",
  },
  en: {
    title: "Lifecycle · Interactive study",
    subtitle: "Tiangong LCA",
    hint: "Move to explore depth. Click the sculpture to change color.",
    theme: "Dark mode",
    color: "Multicolor mode",
    pause: "Pause motion",
    reset: "Reset",
    object: "Layered lifecycle sculpture, activate to toggle multicolor",
    loading: "Building the scene…",
    failed: "The scene could not be loaded. Please try again.",
    retry: "Reload scene",
    unavailable:
      "This browser cannot display the interactive artwork. Enable hardware acceleration or use a WebGL-capable browser.",
    reduced: "Reduced motion preference respected",
    purple: "Brand purple",
    multi: "Multicolor",
    concept: "Visual concept, not data or calculation results",
  },
  de: {
    title: "Lebenszyklus · Interaktive Studie",
    subtitle: "Tiangong LCA",
    hint: "Maus bewegen, um die Tiefe zu erkunden. Klicken, um die Farbe zu wechseln.",
    theme: "Dunkler Modus",
    color: "Mehrfarbiger Modus",
    pause: "Animation pausieren",
    reset: "Zurücksetzen",
    object: "Lebenszyklus in Schichten, aktivieren für den Farbwechsel",
    loading: "Szene wird aufgebaut…",
    failed: "Die Szene konnte nicht geladen werden. Bitte erneut versuchen.",
    retry: "Szene neu laden",
    unavailable:
      "Dieser Browser kann die interaktive Grafik nicht anzeigen. Aktivieren Sie die Hardwarebeschleunigung oder verwenden Sie einen Browser mit WebGL.",
    reduced: "Einstellung für reduzierte Bewegung berücksichtigt",
    purple: "Markenviolett",
    multi: "Mehrfarbig",
    concept: "Visuelles Konzept, keine Daten oder Berechnungsergebnisse",
  },
  fr: {
    title: "Cycle de vie · Étude interactive",
    subtitle: "Tiangong LCA",
    hint: "Déplacez la souris pour explorer la profondeur. Cliquez pour changer les couleurs.",
    theme: "Mode sombre",
    color: "Mode multicolore",
    pause: "Suspendre l’animation",
    reset: "Réinitialiser",
    object: "Structure du cycle de vie, activer pour changer les couleurs",
    loading: "Création de la scène…",
    failed: "La scène n’a pas pu être chargée. Veuillez réessayer.",
    retry: "Recharger la scène",
    unavailable:
      "Ce navigateur ne peut pas afficher l’illustration interactive. Activez l’accélération matérielle ou utilisez un navigateur compatible WebGL.",
    reduced: "Préférence de mouvement réduit respectée",
    purple: "Violet de marque",
    multi: "Multicolore",
    concept: "Concept visuel, sans données ni résultats de calcul",
  },
};
const partNames = {
  "zh-CN": {
    plate: "透明板",
    network: "节点网络",
    energy: "能源设备",
    factory: "制造建筑",
    product: "产品模型",
    map: "点阵地图",
  },
  en: {
    plate: "Optical glass",
    network: "Node network",
    energy: "Energy equipment",
    factory: "Manufacturing",
    product: "Product model",
    map: "Geographic points",
  },
  de: {
    plate: "Optisches Glas",
    network: "Knotennetz",
    energy: "Energieanlagen",
    factory: "Fertigung",
    product: "Produktmodell",
    map: "Geografische Punkte",
  },
  fr: {
    plate: "Verre optique",
    network: "Réseau de nœuds",
    energy: "Équipements énergétiques",
    factory: "Fabrication",
    product: "Modèle de produit",
    map: "Points géographiques",
  },
};
export type LifecycleSculptureProps = {
  /** Focus one independently authored part for geometry and material review. */
  part?: SculpturePart;
  initialTheme?: SculptureTheme;
  initialColorful?: boolean;
  reducedMotion?: boolean;
  unavailable?: boolean;
  /** Model URL, exposed here for the isolated asset-failure review scenario. */
  assetUrl?: string;
  locale?: keyof typeof copy;
};

/**
 * @import import { LifecycleSculpture } from '../brand-exploration/LifecycleSculpture';
 */
export function LifecycleSculpture({
  part = "assembly",
  initialTheme = "dark",
  initialColorful = false,
  reducedMotion = false,
  unavailable = false,
  assetUrl,
  locale = "zh-CN",
}: LifecycleSculptureProps) {
  const text = copy[locale];
  const template = useContext(ModelTemplateContext);
  const [theme, setTheme] = useState(initialTheme);
  const [colorful, setColorful] = useState(initialColorful);
  const [paused, setPaused] = useState(false);
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
        const instance = createLifecycleScene(element, current.current, assetUrl, part, template);
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
  }, [unavailable, assetUrl, attempt, part, template]);
  useEffect(() => {
    current.current = { theme, colorful, paused, reduced };
    scene.current?.update(current.current);
  }, [theme, colorful, paused, reduced]);
  const toggle = () => {
    scene.current?.activate();
    setColorful((value) => !value);
  };

  return (
    <section
      className={`lifecycle-study ${theme === "dark" ? "dark" : ""}`}
      data-part={part}
      data-theme={theme}
      data-color={colorful ? "multi" : "purple"}
      data-motion={reduced ? "reduced" : paused ? "paused" : "running"}
      data-renderer={status}
    >
      <header className="lifecycle-toolbar">
        <div className="lifecycle-heading">
          <p>{text.subtitle}</p>
          <h1>{part === "assembly" ? text.title : partNames[locale][part]}</h1>
        </div>
        <div className="lifecycle-controls">
          <Button
            variant="outline"
            size="icon"
            aria-label={text.theme}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
          >
            <Sun className="lifecycle-light-icon" aria-hidden />
            <Moon className="lifecycle-dark-icon" aria-hidden />
          </Button>
          <Button
            variant="outline"
            aria-label={text.color}
            aria-pressed={colorful}
            onClick={toggle}
            disabled={status !== "ready"}
          >
            <Palette aria-hidden />
            {colorful ? text.multi : text.purple}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={text.pause}
            aria-pressed={paused || reduced}
            disabled={reduced || status !== "ready"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused || reduced ? <Play aria-hidden /> : <Pause aria-hidden />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={text.reset}
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
      <div className="lifecycle-stage">
        <button
          type="button"
          className="lifecycle-object"
          aria-label={text.object}
          aria-describedby={hintId}
          aria-pressed={colorful}
          disabled={status !== "ready"}
          onPointerDown={(event) => {
            down.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            if (event.pointerType === "touch") return;
            const rect = event.currentTarget.getBoundingClientRect();
            scene.current?.pointer(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              -(((event.clientY - rect.top) / rect.height) * 2 - 1),
            );
          }}
          onPointerLeave={() => scene.current?.leave()}
          onBlur={() => scene.current?.leave()}
          onClick={(event) => {
            if (
              event.detail === 0 ||
              Math.hypot(event.clientX - down.current.x, event.clientY - down.current.y) < 12
            ) {
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
        {status !== "ready" && (
          <div className="lifecycle-fallback">
            <output>
              {status === "loading"
                ? text.loading
                : status === "failed"
                  ? text.failed
                  : text.unavailable}
            </output>
            {status === "failed" && (
              <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                {text.retry}
              </Button>
            )}
          </div>
        )}
      </div>
      <footer className="lifecycle-footer">
        <p id={hintId}>{reduced ? text.reduced : text.hint}</p>
        <span>{text.concept}</span>
      </footer>
    </section>
  );
}
