"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CitationCopyProps = {
  citation: string;
  copyLabel: string;
  copiedLabel: string;
  failureLabel: string;
  showText?: boolean;
};

/** @import import { CitationCopy } from "@/features/catalog/citation-copy"; */
export function CitationCopy({
  citation,
  copiedLabel,
  copyLabel,
  failureLabel,
  showText = true,
}: CitationCopyProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {failed ? (
        <p className="text-destructive text-sm" role="alert">
          {failureLabel}
        </p>
      ) : null}
      {showText || failed ? (
        <p className="font-mono text-sm leading-6 break-words">{citation}</p>
      ) : null}
      <div className="flex flex-1 flex-wrap items-stretch gap-3">
        <Button
          className={showText ? undefined : "flex-1"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(citation);
              setCopied(true);
              setFailed(false);
            } catch {
              setCopied(false);
              setFailed(true);
            }
          }}
          type="button"
          variant="outline"
        >
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? copiedLabel : copyLabel}
        </Button>
        <span aria-live="polite" className="sr-only">
          {copied ? copiedLabel : ""}
        </span>
      </div>
    </div>
  );
}
