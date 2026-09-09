import { EyeIcon, GitCompareArrowsIcon, HistoryIcon, ScanSearchIcon } from "lucide-react";
import { PortalPage } from "@/components/shell/portal-page";
/** @import import { MethodologyOverview } from "@/features/catalog/methodology-overview"; */
export function MethodologyOverview({
  labels,
}: {
  labels: (typeof import("@/i18n/messages/en.json"))["Methodology"];
}) {
  const sections = [
    ["visibility", EyeIcon],
    ["comparability", GitCompareArrowsIcon],
    ["provenance", ScanSearchIcon],
    ["withdrawal", HistoryIcon],
    ["licensing", EyeIcon],
    ["searchHelp", ScanSearchIcon],
    ["selectionHelp", GitCompareArrowsIcon],
  ] as const;
  return (
    <PortalPage title={labels.title} description={labels.description}>
      <div className="methodology-layout">
        <nav className="methodology-index" aria-label={labels.title}>
          {sections.map(([key], index) => (
            <a href={`#${key}`} key={key}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {labels[key]}
            </a>
          ))}
        </nav>
        <div className="methodology-sections">
          {sections.map(([key, Icon]) => (
            <section id={key} key={key}>
              <div className="methodology-section-icon">
                <Icon aria-hidden="true" />
              </div>
              <div>
                <h2>{labels[key]}</h2>
                <p>{labels[`${key}Body`]}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </PortalPage>
  );
}
