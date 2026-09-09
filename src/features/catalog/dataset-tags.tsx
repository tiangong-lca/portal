"use client";

import { ArrowRightLeftIcon, FileTextIcon, ChartNoAxesCombinedIcon } from "lucide-react";
import { Tooltip } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import "./dataset-tags.css";

type PublicContentLabels = {
  publicContent: string;
  availabilityExchanges: string;
  availabilityMetadata: string;
  exchangesHelp: string;
  metadataHelp: string;
};

/** Exact standalone version; the caller supplies the unmodified version and localized label.
 * @import import { DatasetVersionTag } from '@/features/catalog/dataset-tags';
 */
export function DatasetVersionTag({ version, label }: { version: string; label: string }) {
  return (
    <Badge variant="outline" className="dataset-tag dataset-version">
      <span className="sr-only">{label}: </span>v{version}
    </Badge>
  );
}

/** Public content indicator with a text label or accessible, touch-readable explanation.
 * @import import { PublicContentTag } from '@/features/catalog/dataset-tags';
 */
export function PublicContentTag({
  content,
  labels,
  compact = false,
  label: customLabel,
}: {
  content: "exchanges" | "metadata" | "lcia";
  label?: string;
  labels: PublicContentLabels;
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
  const m = labels;
  const label =
    customLabel ?? (content === "exchanges" ? m.availabilityExchanges : m.availabilityMetadata);
  const description =
    content === "lcia" ? "" : content === "exchanges" ? m.exchangesHelp : m.metadataHelp;
  const Icon =
    content === "lcia"
      ? ChartNoAxesCombinedIcon
      : content === "exchanges"
        ? ArrowRightLeftIcon
        : FileTextIcon;
  if (compact) {
    return (
      <Tooltip.Provider delayDuration={250}>
        <Tooltip.Root open={open} onOpenChange={changeOpen}>
          <Tooltip.Trigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="dataset-content-trigger"
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
              <span className="dataset-tag dataset-content-face" aria-hidden="true">
                <Icon />
              </span>
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="dataset-content-tip"
              side="top"
              sideOffset={6}
              collisionPadding={16}
            >
              <strong>{label}</strong>
              {description && <p>{description}</p>}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }
  return (
    <Badge variant="secondary" className="dataset-content-label">
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
