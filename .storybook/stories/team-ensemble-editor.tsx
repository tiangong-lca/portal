/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The labelled composition canvas is an application with arrow-key editing and equivalent numeric controls. */
import { useRef, useState } from "react";
import { TeamEnsemble, type EnsemblePosition } from "@/features/team/team-ensemble";
import initialLayout from "@/features/team/team-ensemble-layout.json";
import { teamEnsembleMembers } from "@/features/team/team-data";
import { dictionaries } from "../fixtures";
import "./team-ensemble-editor.css";

type Layout = Record<string, EnsemblePosition>;
export function TeamEnsembleEditor() {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [selected, setSelected] = useState("ming-xu");
  const [mobile, setMobile] = useState(false);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState<Layout[]>([]);
  const [inputDraft, setInputDraft] = useState<{ key: string; value: string } | null>(null);
  const [exported, setExported] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    start: EnsemblePosition;
    width: number;
    height: number;
  } | null>(null);
  const xKey = "x";
  const yKey = "bottom";
  const wKey = "width";
  function checkpoint() {
    setHistory((h) => [...h, structuredClone(layout)]);
  }
  function update(key: keyof EnsemblePosition, value: number) {
    if (key.startsWith("crop")) {
      const opposite = {
        cropTop: "cropBottom",
        cropBottom: "cropTop",
        cropLeft: "cropRight",
        cropRight: "cropLeft",
      } as const;
      const other = opposite[key as keyof typeof opposite];
      value = Math.max(0, Math.min(99 - (layout[selected]![other] ?? 0), value));
    }
    setLayout((l) => ({
      ...l,
      [selected]: { ...l[selected]!, [key]: Math.round(value * 100) / 100 },
    }));
  }
  return (
    <div className="ensemble-editor">
      <header>
        <strong>Portrait composition studio</strong>
        <button onClick={() => setMobile(!mobile)}>{mobile ? "Desktop" : "Mobile"}</button>
        <button onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</button>
        <button
          disabled={!history.length}
          onClick={() => {
            setLayout(history[history.length - 1]!);
            setHistory((h) => h.slice(0, -1));
          }}
        >
          Undo
        </button>
        <button onClick={() => setExported(JSON.stringify(layout, null, 2))}>Export layout</button>
      </header>
      <div className="ensemble-editor-tools">
        <label>
          Person{" "}
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {teamEnsembleMembers.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Depth
          <select
            aria-label="Depth"
            value={layout[selected]!.band}
            onChange={(e) => {
              checkpoint();
              setLayout((l) => ({ ...l, [selected]: { ...l[selected]!, band: e.target.value } }));
            }}
          >
            <option value="back">Back</option>
            <option value="middle">Middle</option>
            <option value="front">Front</option>
          </select>
        </label>
        {(
          [
            [xKey, "X"],
            [yKey, "Bottom"],
            [wKey, "Size"],
            ["z", "Layer"],
            ["cropTop", "Crop top"],
            ["cropRight", "Crop right"],
            ["cropBottom", "Crop bottom"],
            ["cropLeft", "Crop left"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              aria-label={label}
              type="number"
              step="0.5"
              value={inputDraft?.key === key ? inputDraft.value : (layout[selected]![key] ?? 0)}
              onBlur={() => setInputDraft(null)}
              onFocus={checkpoint}
              onChange={(e) => {
                setInputDraft({ key, value: e.target.value });
                if (e.target.value !== "") update(key, Number(e.target.value));
              }}
            />
          </label>
        ))}
      </div>
      <div
        role="application"
        aria-label="Portrait arrangement canvas"
        tabIndex={0}
        onKeyDown={(e) => {
          if (preview || !e.key.startsWith("Arrow")) return;
          e.preventDefault();
          checkpoint();
          const step = e.shiftKey ? 1 : 0.2;
          if (e.key === "ArrowLeft") update(xKey, layout[selected]![xKey] - step);
          if (e.key === "ArrowRight") update(xKey, layout[selected]![xKey] + step);
          if (e.key === "ArrowUp") update(yKey, layout[selected]![yKey] + step);
          if (e.key === "ArrowDown") update(yKey, layout[selected]![yKey] - step);
        }}
        className="ensemble-editor-stage"
        data-mobile={mobile}
        data-editing={!preview}
        ref={stage}
        onPointerDown={(e) => {
          if (preview || !(e.target instanceof Element)) return;
          const person = e.target.closest<HTMLElement>("[data-member]");
          if (!person) return;
          const slug = person.dataset.member!;
          setSelected(slug);
          checkpoint();
          const bounds = stage
            .current!.querySelector(".team-ensemble-cast")!
            .getBoundingClientRect();
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            start: layout[slug]!,
            width: bounds.width,
            height: bounds.height,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setLayout((l) => ({
            ...l,
            [selected]: {
              ...d.start,
              [xKey]: d.start[xKey] + ((e.clientX - d.x) / d.width) * 100,
              [yKey]: d.start[yKey] - ((e.clientY - d.y) / d.height) * 100,
            },
          }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (!preview) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <TeamEnsemble labels={dictionaries.en.Team} layout={layout} />
        {!preview && (
          <style>{`.ensemble-editor [data-member="${selected}"] .team-ensemble-person-hit { outline: 2px solid #b68af5; }`}</style>
        )}
      </div>
      <p>
        Drag a face to move. Select any person from the menu to adjust size and layer. Desktop and
        mobile previews share one proportional composition. Crop values trim each portrait in
        percent without stretching it. Export saves the complete layout as JSON.
      </p>
      {exported && (
        <label>
          Layout JSON
          <textarea aria-label="Layout JSON" readOnly value={exported} />
        </label>
      )}
    </div>
  );
}
