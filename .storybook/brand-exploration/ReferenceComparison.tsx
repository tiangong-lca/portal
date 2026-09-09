import "./reference.css";
import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/source-sans-3";
import artwork from "./artwork.json";
import {
  LifecycleSculpture,
  type LifecycleSculptureProps,
} from "@/components/brand/lifecycle/LifecycleSculpture";

const copy = {
  "zh-CN": {
    title: "生命周期组件 · 视觉核对",
    reference: "所选视觉稿",
    implementation: "当前组件",
    note: "固定姿态核对构图与材质；点击右侧图形仍可切换色彩。",
  },
  en: {
    title: "Lifecycle sculpture · Visual comparison",
    reference: "Selected reference",
    implementation: "Current component",
    note: "Compare composition and materials in a fixed pose. Click the right sculpture to change color.",
  },
  de: {
    title: "Lebenszyklus · Visueller Vergleich",
    reference: "Ausgewählte Vorlage",
    implementation: "Aktuelle Komponente",
    note: "Komposition und Materialien in fester Position vergleichen. Rechts klicken, um die Farbe zu ändern.",
  },
  fr: {
    title: "Cycle de vie · Comparaison visuelle",
    reference: "Référence retenue",
    implementation: "Composant actuel",
    note: "Comparez la composition et les matériaux en pose fixe. Cliquez à droite pour changer les couleurs.",
  },
};

/**
 * @import import { ReferenceComparison } from '../brand-exploration/ReferenceComparison';
 */
export function ReferenceComparison({
  initialTheme = "dark",
  locale = "zh-CN",
}: LifecycleSculptureProps) {
  const text = copy[locale];
  return (
    <section className="brand-reference" data-theme={initialTheme}>
      <header>
        <h1>{text.title}</h1>
        <p>{text.note}</p>
      </header>
      <div className="brand-reference-columns">
        <figure>
          <figcaption>{text.reference}</figcaption>
          <div
            className="brand-reference-crop"
            style={{ aspectRatio: `${artwork.crop.width} / ${artwork.crop.height}` }}
          >
            {/* Display an unmodified crop of the selected board; the original asset is retained. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.references[initialTheme].url}
              style={{
                width: `${(artwork.width / artwork.crop.width) * 100}%`,
                left: `${(-artwork.crop.left / artwork.crop.width) * 100}%`,
                top: `${(-artwork.crop.top / artwork.crop.height) * 100}%`,
              }}
              alt={text.reference}
              draggable={false}
            />
          </div>
        </figure>
        <figure>
          <figcaption>{text.implementation}</figcaption>
          <div
            className="brand-reference-live"
            style={{ aspectRatio: `${artwork.crop.width} / ${artwork.crop.height}` }}
          >
            <LifecycleSculpture initialTheme={initialTheme} locale={locale} reducedMotion />
          </div>
        </figure>
      </div>
    </section>
  );
}
