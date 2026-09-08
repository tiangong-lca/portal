"use client";

import { ChevronDownIcon, LoaderCircleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import "./results-continuation.css";

/** Cursor-list continuation. Counts are already localized by the caller; total counts are optional.
 * @import import { ResultsContinuation } from '@/features/catalog/results-continuation';
 */
export function ResultsContinuation({
  state,
  summary,
  labels,
  onLoadMore,
}: {
  state: "ready" | "loading" | "error" | "complete";
  summary: string;
  labels: { loadMore: string; loadingMore: string; pageError: string; retry: string };
  onLoadMore: () => void;
}) {
  return (
    <div className="catalog-continuation">
      <output aria-live="polite" aria-atomic="true">
        {state === "loading" ? `${summary} · ${labels.loadingMore}` : summary}
      </output>
      {state === "error" && (
        <p role="alert" className="catalog-continuation-error">
          {labels.pageError}
        </p>
      )}
      {state !== "complete" && (
        <Button variant="outline" disabled={state === "loading"} onClick={onLoadMore}>
          {state === "loading" ? (
            <LoaderCircleIcon className="motion-safe:animate-spin" aria-hidden="true" />
          ) : state === "error" ? (
            <RotateCcwIcon aria-hidden="true" />
          ) : (
            <ChevronDownIcon aria-hidden="true" />
          )}
          {state === "loading"
            ? labels.loadingMore
            : state === "error"
              ? labels.retry
              : labels.loadMore}
        </Button>
      )}
    </div>
  );
}
