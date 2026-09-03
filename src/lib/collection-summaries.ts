import { z } from "zod";
import { isExactDatasetRef } from "@/features/catalog/exact-ref";
import { locales } from "@/i18n/routing";

export const collectionIdentitySchema = z.strictObject({
  kind: z.enum(["process", "flow"]).nullable(),
  ref: z.string().refine(isExactDatasetRef),
});
export const collectionSummaryRequestSchema = z.strictObject({
  locale: z.enum(locales),
  items: z
    .array(collectionIdentitySchema)
    .min(1)
    .max(10)
    .refine(
      (items) => new Set(items.map((item) => `${item.kind}:${item.ref}`)).size === items.length,
    ),
});
const summarySchema = z.strictObject({
  kind: z.enum(["process", "flow"]),
  ref: z.string().refine(isExactDatasetRef),
  name: z.string().min(1).max(4096),
});
export const collectionSummaryResultSchema = z
  .strictObject({
    ...collectionIdentitySchema.shape,
    status: z.enum(["resolved", "ambiguous", "unavailable", "temporarily_unavailable"]),
    matches: z.array(summarySchema).max(2),
  })
  .refine((item) => {
    if (
      item.matches.some(
        (match) => match.ref !== item.ref || (item.kind !== null && match.kind !== item.kind),
      )
    )
      return false;
    return item.status === "resolved"
      ? item.matches.length === 1
      : item.status === "ambiguous"
        ? item.kind === null &&
          item.matches.length === 2 &&
          new Set(item.matches.map((match) => match.kind)).size === 2
        : item.matches.length === 0;
  });
export const collectionSummaryResponseSchema = z.strictObject({
  items: z.array(collectionSummaryResultSchema).max(10),
});
export type CollectionSummaryResult = z.infer<typeof collectionSummaryResultSchema>;
export type CollectionSummaryRequest = z.infer<typeof collectionSummaryRequestSchema>;
