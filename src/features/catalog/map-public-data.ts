import type {
  LocalizedText,
  PublishedLciaPage,
  PublicDatasetEnvelope,
  PublicExchangePage,
  PublicSearchPage,
  PublicVersionPage,
} from "@/server/contracts/portal";

import type {
  CatalogResultViewModel,
  DatasetDetailViewModel,
  ExchangeViewModel,
  LciaViewModel,
  VersionViewModel,
} from "./view-model";
import type { CompareCandidate } from "@/features/compare/compatibility";

type Locale = "zh-CN" | "en";

export function localizedText(items: LocalizedText, locale: Locale): string | undefined {
  const displayable = items
    .map((item) => ({ ...item, value: item.value.trim() }))
    .filter((item) => item.value.length > 0);
  if (displayable.length === 0) return undefined;
  const exact = displayable.find((item) => item.language.toLowerCase() === locale.toLowerCase());
  if (exact) return exact.value;
  const sameBase = displayable.find(
    (item) =>
      item.language.split("-", 1)[0]?.toLowerCase() === locale.split("-", 1)[0]?.toLowerCase(),
  );
  if (sameBase) return sameBase.value;
  const english = displayable.find((item) => item.language.toLowerCase().startsWith("en"));
  const fallback = english ?? displayable[0];
  return fallback ? `${fallback.value} [${fallback.language}]` : undefined;
}

function exactRef(id: string, version: string): string {
  return `${id}@${version}`;
}

function formatFunctionalUnit(
  unit: { amount: string | null; unit: string | null; description: LocalizedText },
  locale: Locale,
): string | undefined {
  if (unit.amount && unit.unit) return `${unit.amount} ${unit.unit}`;
  return localizedText(unit.description, locale);
}

function formatGeography(
  geography: { code: string | null; label: LocalizedText; precision: string },
  locale: Locale,
): string {
  return [localizedText(geography.label, locale) ?? geography.code, geography.precision]
    .filter(Boolean)
    .join(" · ");
}

export function mapSearchItem(
  item: PublicSearchPage["items"][number],
  locale: Locale,
): CatalogResultViewModel {
  return {
    accessLevel: item.accessLevel,
    evidence: item.match.reasonCodes.join(", "),
    geography: formatGeography(item.geography, locale),
    kind: item.key.kind,
    name: localizedText(item.names, locale) ?? exactRef(item.key.id, item.key.version),
    ref: exactRef(item.key.id, item.key.version),
    referenceYear: item.referenceYear?.toString(),
  };
}

export function mapDataset(
  dataset: PublicDatasetEnvelope,
  locale: Locale,
  canonicalUrl: string,
): DatasetDetailViewModel {
  const metadata = dataset.metadata;
  const ref = exactRef(dataset.key.id, dataset.key.version);
  const name = localizedText(metadata.names, locale) ?? ref;
  const provider = localizedText(metadata.source.providerName, locale) ?? "TianGong LCA";
  const citation = `${provider}. ${name}. ${dataset.key.kind} dataset, ${ref}. TianGong LCA Data Portal. ${canonicalUrl}`;

  if (metadata.kind === "process") {
    return {
      accessLevel: dataset.accessLevel,
      canonicalUrl,
      citation,
      evidence: dataset.capabilities.reasonCodes.join(", "),
      functionalUnit: formatFunctionalUnit(metadata.functionalUnit, locale),
      geography: formatGeography(metadata.geography, locale),
      kind: "process",
      license: metadata.source.licenseId ?? metadata.administration.licenseType ?? undefined,
      name,
      ref,
      referenceProduct: localizedText(metadata.referenceProduct, locale),
      referenceYear: metadata.referenceYear?.toString(),
      source:
        localizedText(metadata.source.providerName, locale) ??
        metadata.source.databaseId ??
        undefined,
      technology: localizedText(metadata.technology, locale),
    };
  }

  return {
    accessLevel: dataset.accessLevel,
    canonicalUrl,
    citation,
    evidence: dataset.capabilities.reasonCodes.join(", "),
    geography:
      [
        localizedText(metadata.locationOfSupply.label, locale) ?? metadata.locationOfSupply.code,
        "supply",
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    kind: "flow",
    license: metadata.source.licenseId ?? metadata.administration.licenseType ?? undefined,
    name,
    ref,
    referenceProduct: metadata.referenceFlowProperty
      ? localizedText(metadata.referenceFlowProperty.name, locale)
      : undefined,
    source:
      localizedText(metadata.source.providerName, locale) ??
      metadata.source.databaseId ??
      undefined,
  };
}

export function mapExchangePage(
  page: PublicExchangePage,
  locale: Locale,
  expectedProcessRef: string,
): ExchangeViewModel[] {
  if (
    exactRef(page.process.id, page.process.version) !== expectedProcessRef ||
    !page.processContext.functionalUnit.amount ||
    !page.processContext.functionalUnit.unit
  ) {
    return [];
  }
  const functionalUnit = `${page.processContext.functionalUnit.amount} ${page.processContext.functionalUnit.unit}`;
  const processRef = exactRef(page.process.id, page.process.version);
  return page.rows.map((row) => ({
    amount: row.amount,
    capabilityPolicyVersion: page.processContext.capabilityPolicyVersion,
    direction: row.direction,
    flowName: localizedText(row.flow.name, locale) ?? exactRef(row.flow.id, row.flow.version),
    flowRef: exactRef(row.flow.id, row.flow.version),
    functionalUnit,
    id: row.internalId,
    isQuantitativeReference: row.isQuantitativeReference,
    kind: row.kind,
    processRef,
    unit: row.unit,
  }));
}

export function mapLciaPage(
  page: PublishedLciaPage,
  locale: Locale,
  expectedProcessRef: string,
): LciaViewModel {
  if (page.mode !== "process_all_impacts" || page.rows.length === 0) {
    return { status: "unavailable" };
  }

  const rows = page.rows.map((row) => ({
    evidenceStatus: row.evidenceStatus,
    functionalUnit: `${row.functionalUnit.amount} ${row.functionalUnit.unit}`,
    geography: `${row.geography.code} · ${row.geography.precision}`,
    impactId: row.impact.id,
    impactName: localizedText(row.impact.name, locale) ?? row.impact.id,
    methodRef: exactRef(row.method.id, row.method.version),
    processRef: exactRef(row.process.id, row.process.version),
    referenceYear: row.referenceYear.toString(),
    unit: row.unit,
    value: row.value,
  }));
  const contextKeys = rows.map((row) =>
    [row.processRef, row.functionalUnit, row.geography, row.referenceYear].join("\u0000"),
  );
  if (
    rows.some((row) => row.processRef !== expectedProcessRef) ||
    new Set(contextKeys).size !== 1
  ) {
    return { status: "unavailable" };
  }

  return {
    publication: page.publication,
    rows,
    status: "available",
  };
}

export function mapVersions(page: PublicVersionPage, locale: Locale): VersionViewModel[] {
  return page.items.map((item) => {
    const ref = exactRef(item.key.id, item.key.version);
    return {
      href: `/${locale}/${item.key.kind}/${encodeURIComponent(ref)}`,
      modifiedAt: item.modifiedAt,
      ref,
      summary: item.isLatest ? "latest" : undefined,
    };
  });
}

export function mapCompareCandidate(
  dataset: PublicDatasetEnvelope,
  locale: Locale,
): CompareCandidate {
  const metadata = dataset.metadata;
  const ref = exactRef(dataset.key.id, dataset.key.version);
  if (metadata.kind !== "process") return { name: ref, ref };

  const allocationAndModeling = localizedText(metadata.allocationAndModeling, locale);
  const lciaMethod =
    dataset.publication?.lciaMethods.length === 1 ? dataset.publication.lciaMethods[0] : undefined;

  return {
    allocationMethod: allocationAndModeling,
    cutoffRule: localizedText(metadata.cutoffRules, locale),
    functionalUnit:
      metadata.functionalUnit.amount && metadata.functionalUnit.unit
        ? `${metadata.functionalUnit.amount} ${metadata.functionalUnit.unit}`
        : undefined,
    geography: metadata.geography.code ?? localizedText(metadata.geography.label, locale),
    geographyPrecision: metadata.geography.precision,
    lciaMethodRef: lciaMethod ? exactRef(lciaMethod.id, lciaMethod.version) : undefined,
    modelingApproach: allocationAndModeling,
    name: localizedText(metadata.names, locale) ?? ref,
    publicationRef: dataset.publication?.publicationId,
    ref,
    referenceUnit: metadata.functionalUnit.unit ?? undefined,
    referenceYear: metadata.referenceYear?.toString(),
    technology: localizedText(metadata.technology, locale),
  };
}
