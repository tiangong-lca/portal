import "server-only";

import { z } from "zod";

import { exactDatasetIdentitySchema, publishedLciaPageSchema } from "@/server/contracts/portal";
import {
  PortalLciaInputError,
  queryPublishedLcia,
  type PublishedLciaResult,
} from "@/server/lcia/client";

const comparableLciaInputSchema = z.strictObject({
  processRefs: z
    .array(exactDatasetIdentitySchema)
    .min(2)
    .max(4)
    .refine(
      (values) =>
        new Set(values.map((value) => `${value.id}@${value.version}`)).size === values.length,
      "Process references must be unique",
    ),
  impactCategoryId: z.string().trim().min(1).max(512),
});

type PublishedLciaPage = z.infer<typeof publishedLciaPageSchema>;
export type ComparablePublishedLciaRow = PublishedLciaPage["rows"][number];
export type ComparablePublishedLciaInput = z.input<typeof comparableLciaInputSchema>;
export type ComparablePublishedLciaQuery = (input: {
  mode: "processes_one_impact";
  processRefs: Array<{ id: string; version: string }>;
  impactCategoryId: string;
  cursor: null;
  limit: number;
}) => Promise<PublishedLciaResult>;

export type ComparablePublishedLciaResult =
  | {
      status: "available";
      data: {
        publication: PublishedLciaPage["publication"];
        impact: ComparablePublishedLciaRow["impact"];
        method: ComparablePublishedLciaRow["method"];
        unit: string;
        orderedRows: ComparablePublishedLciaRow[];
        valuesByRef: Record<string, ComparablePublishedLciaRow>;
      };
    }
  | { status: "unavailable"; data: null }
  | { status: "temporarily_unavailable"; data: null };

type ComparablePublishedLciaOptions = {
  query?: ComparablePublishedLciaQuery;
};

function referenceKey(reference: { id: string; version: string }): string {
  return `${reference.id}@${reference.version}`;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function getComparablePublishedLciaValues(
  input: ComparablePublishedLciaInput,
  options: ComparablePublishedLciaOptions = {},
): Promise<ComparablePublishedLciaResult> {
  const parsedInput = comparableLciaInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new PortalLciaInputError();
  }

  let queryResult: PublishedLciaResult;
  try {
    queryResult = await (options.query ?? queryPublishedLcia)({
      mode: "processes_one_impact",
      processRefs: parsedInput.data.processRefs,
      impactCategoryId: parsedInput.data.impactCategoryId,
      cursor: null,
      limit: parsedInput.data.processRefs.length,
    });
  } catch {
    return { status: "temporarily_unavailable", data: null };
  }

  if (queryResult.status !== "available") {
    return queryResult;
  }

  const parsedPage = publishedLciaPageSchema.safeParse(queryResult.data);
  if (
    !parsedPage.success ||
    parsedPage.data.mode !== "processes_one_impact" ||
    parsedPage.data.nextCursor !== null
  ) {
    return { status: "temporarily_unavailable", data: null };
  }

  const expectedKeys = new Set(parsedInput.data.processRefs.map(referenceKey));
  const rowsByKey = new Map<string, ComparablePublishedLciaRow>();
  let sharedImpact: ComparablePublishedLciaRow["impact"] | undefined;
  let sharedMethod: ComparablePublishedLciaRow["method"] | undefined;
  let sharedUnit: string | undefined;

  for (const row of parsedPage.data.rows) {
    const key = referenceKey(row.process);
    if (
      !expectedKeys.has(key) ||
      rowsByKey.has(key) ||
      row.impact.id !== parsedInput.data.impactCategoryId
    ) {
      return { status: "temporarily_unavailable", data: null };
    }

    if (
      sharedImpact &&
      (!sameJsonValue(row.impact, sharedImpact) ||
        !sameJsonValue(row.method, sharedMethod) ||
        row.unit !== sharedUnit)
    ) {
      return { status: "temporarily_unavailable", data: null };
    }

    sharedImpact ??= row.impact;
    sharedMethod ??= row.method;
    sharedUnit ??= row.unit;
    rowsByKey.set(key, row);
  }

  if (rowsByKey.size !== parsedInput.data.processRefs.length) {
    return { status: "unavailable", data: null };
  }

  const orderedRows = parsedInput.data.processRefs.map((reference) =>
    rowsByKey.get(referenceKey(reference))!,
  );
  const valuesByRef = Object.fromEntries(
    orderedRows.map((row) => [referenceKey(row.process), row]),
  );

  return {
    status: "available",
    data: {
      publication: parsedPage.data.publication,
      impact: sharedImpact!,
      method: sharedMethod!,
      unit: sharedUnit!,
      orderedRows,
      valuesByRef,
    },
  };
}
