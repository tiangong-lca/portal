import { ArrowRightLeftIcon, BookOpenIcon, FileTextIcon, SearchIcon } from "lucide-react";
import { Tooltip } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../src/components/ui/badge";
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

/** Public content indicator with a text label or accessible, touch-readable explanation.
 * @import import { Availability } from '../catalog-reference/shared';
 */
export function Availability({
  record,
  labels,
  compact = false,
}: {
  record: ReferenceDataset;
  labels: ReferenceLabels;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pendingOpen = useRef(0);
  useEffect(() => () => cancelAnimationFrame(pendingOpen.current), []);
  const changeOpen = (next: boolean) => {
    cancelAnimationFrame(pendingOpen.current);
    setOpen(next);
  };
  const showAfterFocusScroll = () => {
    cancelAnimationFrame(pendingOpen.current);
    // Let native focus scrolling finish before Radix begins dismissing on scroll.
    pendingOpen.current = requestAnimationFrame(() => setOpen(true));
  };
  const m = labels.CatalogReference;
  const label = record.open ? m.availabilityExchanges : m.availabilityMetadata;
  const description = record.open ? m.exchangesHelp : m.metadataHelp;
  const Icon = record.open ? ArrowRightLeftIcon : FileTextIcon;
  if (compact) {
    return (
      <Tooltip.Provider delayDuration={250}>
        <Tooltip.Root open={open} onOpenChange={changeOpen}>
          <Tooltip.Trigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="cr-availability-icon"
              aria-label={`${m.publicContent}: ${label}`}
              onFocus={(event) => {
                event.preventDefault();
                showAfterFocusScroll();
              }}
              onBlur={() => changeOpen(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") changeOpen(false);
              }}
              onClick={(event) => {
                // Radix dismisses on click by default. Also expose the explanation on touch.
                event.preventDefault();
                showAfterFocusScroll();
              }}
            >
              <Icon aria-hidden="true" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="cr-surface cr-availability-tip"
              side="top"
              sideOffset={6}
              collisionPadding={16}
            >
              <strong>{label}</strong>
              <p>{description}</p>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }
  return (
    <Badge variant="secondary" className="cr-availability">
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

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
