import "server-only";

import { parseExactDatasetRef } from "@/features/catalog/exact-ref";
import { localizedText } from "@/features/catalog/map-public-data";
import type { CollectionSummaryRequest, CollectionSummaryResult } from "@/lib/collection-summaries";
import { collectionSummaryResponseSchema } from "@/lib/collection-summaries";
import { getPublicDataset } from "@/server/data/catalog";
import { createPortalRpcClient } from "@/server/data/supabase-rpc";

export async function resolveCollectionSummaries(
  input: CollectionSummaryRequest,
  signal: AbortSignal,
  lookup?: typeof getPublicDataset,
): Promise<{ items: CollectionSummaryResult[] }> {
  const client = lookup
    ? undefined
    : createPortalRpcClient({
        locale: input.locale,
        fetchImplementation: (target, init) =>
          fetch(target, {
            ...init,
            signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : [])]),
          }),
      });
  const read = lookup ?? ((identity) => getPublicDataset(identity, client));
  const jobs = input.items.flatMap((item, index) =>
    (item.kind ? [item.kind] : (["process", "flow"] as const)).map((kind) => ({
      index,
      kind,
      ref: item.ref,
    })),
  );
  const matches: CollectionSummaryResult["matches"][] = input.items.map(() => []);
  const failed = new Set<number>();
  let next = 0;
  // Four public RPCs maximum in flight, including unresolved legacy identities.
  await Promise.all(
    Array.from({ length: Math.min(4, jobs.length) }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++]!;
        if (signal.aborted) {
          failed.add(job.index);
          continue;
        }
        try {
          const dataset = await read({ kind: job.kind, ...parseExactDatasetRef(job.ref)! });
          if (dataset) {
            // The public facade binds kind/id/version and validates its closed DTO.
            if (
              `${dataset.key.id}@${dataset.key.version}` !== job.ref ||
              dataset.key.kind !== job.kind
            )
              throw new Error("unbound_public_record");
            matches[job.index]!.push({
              kind: job.kind,
              ref: job.ref,
              name: localizedText(dataset.metadata.names, input.locale) ?? job.ref,
            });
          }
        } catch {
          failed.add(job.index);
        }
      }
    }),
  );
  return collectionSummaryResponseSchema.parse({
    items: input.items.map((item, index) => {
      const visible = matches[index]!.sort((a, b) => a.kind.localeCompare(b.kind));
      // Never resolve an unknown kind using a partial success from only one table.
      return {
        ...item,
        status:
          failed.has(index) || signal.aborted
            ? "temporarily_unavailable"
            : visible.length === 2
              ? "ambiguous"
              : visible.length === 1
                ? "resolved"
                : "unavailable",
        matches: failed.has(index) || signal.aborted ? [] : visible,
      };
    }),
  });
}
