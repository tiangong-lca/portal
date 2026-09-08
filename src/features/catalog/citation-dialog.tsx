"use client";

import { useEffect, useRef, useState } from "react";
import { QuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CitationCopy } from "./citation-copy";
import styles from "./detail.module.css";

type CitationLabels = {
  title: string;
  close: string;
  unavailable: string;
  exactVersion: string;
  copyCitation: string;
  citationCopied: string;
  copyVersionId: string;
  versionCopied: string;
  copyFailed: string;
};

/** A single citation action with exact-version copy and support for existing citation links.
 * @import import { CitationDialog } from "@/features/catalog/citation-dialog";
 */
export function CitationDialog({
  citation,
  refValue,
  labels,
}: {
  citation?: string;
  refValue: string;
  labels: CitationLabels;
}) {
  const [open, setOpen] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const syncHash = () => setOpen(window.location.hash === "#citation");
    const frame = requestAnimationFrame(() => {
      if (window.location.hash === "#citation") setOpen(true);
    });
    window.addEventListener("hashchange", syncHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && window.location.hash === "#citation") {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <QuoteIcon data-icon="inline-start" />
          {labels.title}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={labels.close}
        className={styles.citationDialog}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          title.current?.focus({ preventScroll: true });
        }}
      >
        <DialogTitle ref={title} tabIndex={-1} className={styles.citationTitle}>
          {labels.title}
        </DialogTitle>
        <div className={styles.citation}>
          <p>{citation ?? labels.unavailable}</p>
          <div className={styles.exactIdentity}>
            <span>{labels.exactVersion}</span>
            <code>{refValue}</code>
          </div>
          <div className={styles.copyActions}>
            {citation ? (
              <CitationCopy
                citation={citation}
                copyLabel={labels.copyCitation}
                copiedLabel={labels.citationCopied}
                failureLabel={labels.copyFailed}
                showText={false}
              />
            ) : null}
            <CitationCopy
              citation={refValue}
              copyLabel={labels.copyVersionId}
              copiedLabel={labels.versionCopied}
              failureLabel={labels.copyFailed}
              showText={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
