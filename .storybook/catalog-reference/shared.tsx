import { BookOpenIcon, SearchIcon } from "lucide-react";
import { Button } from "../../src/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../src/components/ui/empty";
import type { PortalLocale } from "../../src/i18n/routing";
import { dictionaries } from "../fixtures";
import type { ReferenceDataset } from "./data";

export type ReferenceLabels = (typeof dictionaries)["en"];

export function Metadata({
  record,
  labels,
  expanded = false,
}: {
  record: ReferenceDataset;
  labels: ReferenceLabels;
  expanded?: boolean;
}) {
  const d = labels.Detail;
  return (
    <dl className={expanded ? "cr-summary-grid" : "cr-row-meta"}>
      {(expanded
        ? [
            [d.referenceProduct, record.product],
            [d.functionalUnit, record.unit],
            [d.geography, `${record.geography} (${record.region})`],
            [d.referenceYear, record.year],
          ]
        : [
            [d.geography, record.geography],
            [d.referenceYear, record.year],
            [d.functionalUnit, record.unit],
          ]
      ).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd data-missing={!value || undefined}>{value ?? labels.Common.notProvided}</dd>
        </div>
      ))}
    </dl>
  );
}

export function NoResults({ labels, onReset }: { labels: ReferenceLabels; onReset?: () => void }) {
  return (
    <Empty className="cr-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{labels.Search.emptyTitle}</EmptyTitle>
        <EmptyDescription>{labels.Search.emptyDescription}</EmptyDescription>
      </EmptyHeader>
      {onReset && (
        <Button variant="outline" onClick={onReset}>
          {labels.CatalogReference.resetSearch}
        </Button>
      )}
    </Empty>
  );
}

export function ReferenceFooter({
  locale,
  labels,
}: {
  locale: PortalLocale;
  labels: ReferenceLabels;
}) {
  return (
    <footer className="cr-footer">
      <p>{labels.CatalogReference.fixtureNotice}</p>
      <a
        href={`https://portal.tiangong.earth/${locale}/methodology`}
        target="_blank"
        rel="noreferrer"
      >
        <BookOpenIcon aria-hidden="true" />
        {labels.Common.methodology}
      </a>
    </footer>
  );
}
