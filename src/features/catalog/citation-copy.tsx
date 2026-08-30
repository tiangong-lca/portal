"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CitationCopyProps = {
  citation: string;
  copyLabel: string;
  copiedLabel: string;
  showText?: boolean;
};

export function CitationCopy({
  citation,
  copiedLabel,
  copyLabel,
  showText = true,
}: CitationCopyProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {showText ? <p className="font-mono text-sm leading-6 break-words">{citation}</p> : null}
      <div className="flex items-center gap-3">
        <Button
          onClick={async () => {
            await navigator.clipboard.writeText(citation);
            setCopied(true);
          }}
          type="button"
          variant="outline"
        >
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? copiedLabel : copyLabel}
        </Button>
        <span aria-live="polite" className="text-muted-foreground text-sm">
          {copied ? copiedLabel : ""}
        </span>
      </div>
    </div>
  );
}
