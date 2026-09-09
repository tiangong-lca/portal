"use client";

import { CheckIcon, CopyIcon, FingerprintIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CitationCopyProps = {
  citation: string;
  copyLabel: string;
  copiedLabel: string;
  failureLabel: string;
  showText?: boolean;
  iconOnly?: boolean;
  identity?: boolean;
};

/** @import import { CitationCopy } from "@/features/catalog/citation-copy"; */
export function CitationCopy({
  citation,
  copiedLabel,
  copyLabel,
  failureLabel,
  showText = true,
  iconOnly = false,
  identity = false,
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
          className={iconOnly || showText ? undefined : "flex-1"}
          size={iconOnly ? "icon" : "default"}
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
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
          variant={iconOnly ? "ghost" : "outline"}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : identity ? (
            <FingerprintIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {!iconOnly && (copied ? copiedLabel : copyLabel)}
        </Button>
        <span aria-live="polite" className="sr-only">
          {copied ? copiedLabel : ""}
        </span>
      </div>
    </div>
  );
}
