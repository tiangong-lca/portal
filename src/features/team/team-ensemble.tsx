"use client";

import Image from "next/image";
import { MailIcon, XIcon } from "lucide-react";
import { type CSSProperties, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { teamEnsembleMembers } from "./team-data";
import "./team-ensemble.css";
import defaultLayout from "./team-ensemble-layout.json";

type TeamLabels = (typeof import("@/i18n/messages/en.json"))["Team"];
type EnsembleMember = (typeof teamEnsembleMembers)[number];

export type EnsemblePosition = {
  x: number;
  bottom: number;
  width: number;
  z: number;
  band: string;
  cropTop?: number;
  cropRight?: number;
  cropBottom?: number;
  cropLeft?: number;
};

type FaceGeometry = {
  x: number;
  y: number;
  size: number;
};

// Display-only corrections: RGB gains neutralize source lighting, never skin identity.
const portraitGrades: Record<
  string,
  { rgb: [number, number, number]; exposure: number; saturation: number }
> = {
  "ziqi-wang": { rgb: [0.92, 1, 1.14], exposure: 1.16, saturation: 0.66 },
  "ayazhan-nurpeiis": { rgb: [0.97, 1, 1.08], exposure: 1.15, saturation: 0.76 },
  "ruoxi-xiong": { rgb: [1, 1.01, 1.04], exposure: 1.15, saturation: 0.76 },
  "bixuan-wu": { rgb: [1.03, 1, 0.99], exposure: 1.08, saturation: 0.8 },
  "ming-xu": { rgb: [0.99, 1, 1.03], exposure: 1.05, saturation: 0.76 },
  "sangwon-suh": { rgb: [1, 1, 1.025], exposure: 1.035, saturation: 0.78 },
  "yuanyi-huang": { rgb: [1, 1, 1.03], exposure: 1.09, saturation: 0.78 },
  "nan-li": { rgb: [1, 1.015, 1], exposure: 1.025, saturation: 0.76 },
  "jianchuan-qi": { rgb: [1.025, 1, 0.99], exposure: 1, saturation: 0.76 },
  "chenling-fu": { rgb: [0.985, 1, 1.035], exposure: 1, saturation: 0.78 },
  "huimin-chang": { rgb: [1, 1, 1.02], exposure: 1, saturation: 0.78 },
  "jing-guo": { rgb: [1, 1.01, 1], exposure: 0.99, saturation: 0.76 },
};
const neutralGrade = { rgb: [1, 1, 1] as const, exposure: 1, saturation: 0.8 };

const portraitCanvas = { width: 804, height: 752 } as const;

const faceGeometry = {
  "ayazhan-nurpeiis": { x: 272, y: 77, size: 216 },
  "bin-shui": { x: 286, y: 122, size: 229 },
  "bixuan-wu": { x: 235, y: 152, size: 328 },
  "chao-zhang": { x: 285, y: 267, size: 209 },
  "chenling-fu": { x: 245, y: 253, size: 192 },
  "huimin-chang": { x: 312, y: 73, size: 181 },
  "jianchuan-qi": { x: 290, y: 105, size: 172 },
  "jiayi-yuan": { x: 260, y: 92, size: 185 },
  "jinbiao-lyu": { x: 141, y: 102, size: 507 },
  "jing-guo": { x: 225, y: 133, size: 312 },
  "ming-xu": { x: 198, y: 118, size: 401 },
  "nan-li": { x: 260, y: 96, size: 238 },
  "ruiqiao-li": { x: 231, y: 155, size: 319 },
  "ruoxi-xiong": { x: 243, y: 121, size: 252 },
  "sangwon-suh": { x: 195, y: 112, size: 391 },
  "si-zhang": { x: 288, y: 110, size: 223 },
  "yan-qin": { x: 224, y: 129, size: 381 },
  "yi-cao": { x: 283, y: 110, size: 159 },
  "ying-zheng": { x: 210, y: 172, size: 308 },
  "yuanyi-huang": { x: 282, y: 81, size: 255 },
  "yushi-chen": { x: 204, y: 140, size: 319 },
  "zimeng-cai": { x: 244, y: 148, size: 310 },
  "ziqi-wang": { x: 225, y: 96, size: 355 },
} satisfies Record<EnsembleMember["slug"], FaceGeometry>;

/** @import import { TeamEnsemble } from "@/features/team/team-ensemble"; */
export function TeamEnsemble({
  labels,
  initialMemberSlug,
  layout = defaultLayout,
  hoverOnly = false,
}: {
  labels: TeamLabels;
  initialMemberSlug?: EnsembleMember["slug"];
  layout?: Record<string, EnsemblePosition>;
  hoverOnly?: boolean;
}) {
  const gradeId = useId().replace(/:/g, "");
  const [selectedSlug, setSelectedSlug] = useState<EnsembleMember["slug"] | null>(
    initialMemberSlug ?? null,
  );
  const [hint, setHint] = useState<{ member: EnsembleMember; x: number; y: number } | null>(null);
  function showHint(member: EnsembleMember, target: HTMLButtonElement) {
    const face = target.getBoundingClientRect();
    const shell = target.closest(".team-ensemble-shell")!.getBoundingClientRect();
    setHint({
      member,
      x: Math.max(110, Math.min(shell.width - 110, face.left + face.width / 2 - shell.left)),
      y: face.top - shell.top - 8,
    });
  }
  const selectedMember = teamEnsembleMembers.find((member) => member.slug === selectedSlug);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedSlug(null);
        setHint(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="team-ensemble-shell" data-has-selection={selectedMember ? "true" : "false"}>
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute" }}
      >
        <defs>
          {Object.entries(portraitGrades).map(([slug, grade]) => (
            <filter id={`${gradeId}-${slug}`} key={slug} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values={`${grade.rgb[0]} 0 0 0 0 0 ${grade.rgb[1]} 0 0 0 0 0 ${grade.rgb[2]} 0 0 0 0 0 1 0`}
              />
            </filter>
          ))}
        </defs>
      </svg>
      <section
        className="team-ensemble"
        data-has-selection={selectedMember ? "true" : "false"}
        aria-label={labels.ensembleLabel}
      >
        <div className="team-ensemble-aura" aria-hidden="true" />
        <div className="team-ensemble-orbit team-ensemble-orbit-one" aria-hidden="true" />
        <div className="team-ensemble-orbit team-ensemble-orbit-two" aria-hidden="true" />

        <div className="team-ensemble-cast">
          {teamEnsembleMembers.map((member) => {
            const selected = member.slug === selectedSlug;
            const position: EnsemblePosition = layout[member.slug] ?? defaultLayout[member.slug];
            const face = faceGeometry[member.slug];
            const faceCenterX = ((face.x + face.size / 2) / portraitCanvas.width) * 100;
            const faceCenterY = ((face.y + face.size / 2) / portraitCanvas.height) * 100;
            const faceSize = (face.size / portraitCanvas.width) * 100;
            const grade = portraitGrades[member.slug] ?? neutralGrade;
            return (
              <div
                className="team-ensemble-person"
                data-member={member.slug}
                data-band={position.band}
                data-selected={selected ? "true" : "false"}
                key={member.slug}
                style={
                  {
                    "--portrait-balance": portraitGrades[member.slug]
                      ? `url("#${gradeId}-${member.slug}")`
                      : "brightness(1)",
                    "--portrait-exposure": grade.exposure,
                    "--portrait-saturation": grade.saturation,
                    "--ensemble-x": `${position.x}%`,
                    "--ensemble-bottom": `${position.bottom}%`,
                    "--ensemble-width": `${position.width}%`,
                    "--ensemble-z": position.z,
                    "--ensemble-crop": `inset(${position.cropTop ?? 0}% ${position.cropRight ?? 0}% ${position.cropBottom ?? 0}% ${position.cropLeft ?? 0}%)`,
                    "--ensemble-face-x": `${faceCenterX}%`,
                    "--ensemble-face-y": `${faceCenterY}%`,
                    "--ensemble-face-size": `${faceSize}%`,
                  } as CSSProperties
                }
              >
                <span
                  className="team-ensemble-portrait"
                  style={{
                    clipPath:
                      position.cropTop ||
                      position.cropRight ||
                      position.cropBottom ||
                      position.cropLeft
                        ? "var(--ensemble-crop)"
                        : undefined,
                  }}
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 680px) 29vw, 300px"
                    src={`/team/cutouts/${member.slug}.png`}
                  />
                </span>
                <button
                  type="button"
                  className="team-ensemble-person-hit"
                  aria-pressed={hoverOnly ? undefined : selected}
                  aria-label={
                    hoverOnly
                      ? `${member.name}, ${labels.roles[member.role]}`
                      : labels.ensembleOpen.replace("{name}", member.name)
                  }
                  aria-describedby={
                    hint?.member.slug === member.slug ? `${gradeId}-hint` : undefined
                  }
                  onPointerEnter={(event) => showHint(member, event.currentTarget)}
                  onPointerLeave={() => setHint(null)}
                  onFocus={(event) => showHint(member, event.currentTarget)}
                  onBlur={() => setHint(null)}
                  onClick={hoverOnly ? undefined : () => setSelectedSlug(member.slug)}
                />
              </div>
            );
          })}
        </div>

        <div className="team-ensemble-ground" aria-hidden="true" />
      </section>

      {hint ? (
        <div
          id={`${gradeId}-hint`}
          role="tooltip"
          className="team-ensemble-caption"
          style={{ left: hint.x, top: hint.y }}
        >
          <strong>{hint.member.name}</strong>
          <span>{labels.roles[hint.member.role]}</span>
        </div>
      ) : null}
      {selectedMember ? (
        <aside className="team-ensemble-card" aria-live="polite">
          <div>
            <p>{labels.roles[selectedMember.role]}</p>
            <h3>{selectedMember.name}</h3>
            <span>{labels.institutions[selectedMember.institution]}</span>
          </div>
          <div className="team-ensemble-card-actions">
            {selectedMember.email ? (
              <Button asChild variant="outline" size="icon-sm">
                <a
                  href={`mailto:${selectedMember.email}`}
                  aria-label={labels.emailMember.replace("{name}", selectedMember.name)}
                >
                  <MailIcon />
                </a>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={labels.ensembleClose}
              onClick={() => setSelectedSlug(null)}
            >
              <XIcon />
            </Button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
