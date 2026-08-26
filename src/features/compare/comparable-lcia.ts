import type { PublicDatasetEnvelope } from "@/server/contracts/portal";
import type { ComparablePublishedLciaResult } from "@/server/lcia/compare";

import { localizedText } from "@/features/catalog/map-public-data";

import type { ComparableLciaPresentation } from "./compare-workbench";
import { evaluateCompatibility, type CompareCandidate } from "./compatibility";

type AvailableComparableData = Extract<
  ComparablePublishedLciaResult,
  { status: "available" }
>["data"];

export function shouldRequestComparableLcia(
  impactCategoryId: string | null,
  candidates: CompareCandidate[],
  datasets: Array<PublicDatasetEnvelope | null>,
): boolean {
  const compatibility = evaluateCompatibility(candidates);
  return Boolean(
    impactCategoryId &&
    candidates.length >= 2 &&
    candidates.length <= 4 &&
    datasets.length === candidates.length &&
    datasets.every((dataset) => dataset?.metadata.kind === "process") &&
    datasets.every((dataset) => dataset?.capabilities.lciaVisible) &&
    (compatibility.status === "direct" || compatibility.status === "converted"),
  );
}

export function applyComparableLcia(
  candidates: CompareCandidate[],
  datasets: Array<PublicDatasetEnvelope | null>,
  data: AvailableComparableData,
  locale: "zh-CN" | "en",
): { candidates: CompareCandidate[]; context: ComparableLciaPresentation } | null {
  if (candidates.length !== data.orderedRows.length || datasets.length !== candidates.length) {
    return null;
  }

  const rowsMatchMetadata = data.orderedRows.every((row, index) => {
    const candidate = candidates[index];
    const dataset = datasets[index];
    const rowRef = `${row.process.id}@${row.process.version}`;
    const methodRef = `${row.method.id}@${row.method.version}`;
    return Boolean(
      candidate &&
      dataset?.metadata.kind === "process" &&
      rowRef === candidate.ref &&
      `${row.functionalUnit.amount} ${row.functionalUnit.unit}` === candidate.functionalUnit &&
      row.geography.code === candidate.geography &&
      row.geography.precision === candidate.geographyPrecision &&
      row.referenceYear.toString() === candidate.referenceYear &&
      methodRef === candidate.lciaMethodRef &&
      data.publication.publicationId === candidate.publicationRef &&
      data.publication.packageId === dataset.publication?.packageId &&
      data.publication.packageVersion === dataset.publication?.packageVersion &&
      row.evidenceStatus === "verified",
    );
  });
  if (!rowsMatchMetadata) return null;

  const withValues = candidates.map((candidate) => {
    const row = data.valuesByRef[candidate.ref];
    return row ? { ...candidate, lciaValue: { unit: row.unit, value: row.value } } : candidate;
  });
  if (!evaluateCompatibility(withValues).canAlignLcia) return null;

  return {
    candidates: withValues,
    context: {
      evidenceHash: data.publication.evidenceHash,
      impactName: localizedText(data.impact.name, locale) ?? data.impact.id,
      methodRef: `${data.method.id}@${data.method.version}`,
      packageRef: `${data.publication.packageId}@${data.publication.packageVersion}`,
      publicationRef: data.publication.publicationId,
      publishedAt: data.publication.publishedAt,
      unit: data.unit,
    },
  };
}
