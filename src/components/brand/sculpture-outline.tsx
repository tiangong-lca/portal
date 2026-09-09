/**
 * A lightweight, image-free silhouette while the optional 3D artwork is unavailable.
 * @import import { SculptureOutline } from "@/components/brand/sculpture-outline";
 */
export function SculptureOutline() {
  return (
    <svg className="sculpture-outline" viewBox="0 0 520 680" fill="none" aria-hidden="true">
      <path
        d="M260 93v445M113 185v298M407 185v298"
        stroke="currentColor"
        strokeDasharray="2 9"
        opacity=".25"
      />
      {[90, 188, 286, 384, 482].map((y, index) => (
        <g key={y} transform={`translate(0 ${y})`} opacity={0.7 - index * 0.08}>
          <path
            d="m260 0 175 80-175 88L85 80Z"
            fill="currentColor"
            fillOpacity=".035"
            stroke="currentColor"
          />
          <path d="M85 80v8l175 88 175-88v-8M260 168v8" stroke="currentColor" opacity=".55" />
          {[
            [-95, 81],
            [0, 127],
            [95, 81],
            [0, 34],
          ].map(([x, cy]) => (
            <circle key={`${x}:${cy}`} cx={260 + x!} cy={cy} r="3" fill="currentColor" />
          ))}
        </g>
      ))}
      <path
        d="m165 144 95-46 95 46-95 49Z M165 144l190 0 M260 98v95"
        stroke="currentColor"
        opacity=".45"
      />
    </svg>
  );
}
