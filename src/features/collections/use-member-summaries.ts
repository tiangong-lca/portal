"use client";

import { useEffect, useState } from "react";
import { collectionMemberKey, type DatasetIdentity } from "./storage-v2";
import {
  collectionSummaryResponseSchema,
  type CollectionSummaryResult,
} from "@/lib/collection-summaries";
import type { PortalLocale } from "@/i18n/routing";

export function useMemberSummaries(identities: DatasetIdentity[], locale: PortalLocale) {
  const [summaries, setSummaries] = useState<Record<string, CollectionSummaryResult>>({});
  const [retry, setRetry] = useState(0);
  const serialized = JSON.stringify(identities.map(({ kind, ref }) => ({ kind, ref })));
  useEffect(() => {
    const controller = new AbortController();
    const requested = JSON.parse(serialized) as DatasetIdentity[];
    // Only the visible ten-row window is resolved. Notes/name/purpose never enter this request.
    if (requested.length === 0) return;
    void (async () => {
      let next: CollectionSummaryResult[];
      try {
        const response = await fetch("/internal/dataset-summaries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, items: requested }),
          credentials: "omit",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("unavailable");
        const data = collectionSummaryResponseSchema.parse(await response.json());
        if (
          data.items.length !== requested.length ||
          data.items.some(
            (item, index) => collectionMemberKey(item) !== collectionMemberKey(requested[index]!),
          )
        )
          throw new Error("unbound_summary");
        next = data.items;
      } catch {
        if (controller.signal.aborted) return;
        next = requested.map((item) => ({
          ...item,
          status: "temporarily_unavailable",
          matches: [],
        }));
      }
      if (!controller.signal.aborted)
        setSummaries(Object.fromEntries(next.map((item) => [collectionMemberKey(item), item])));
    })();
    return () => controller.abort();
  }, [serialized, locale, retry]);
  return { summaries, retry: () => setRetry((value) => value + 1) };
}
