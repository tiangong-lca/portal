import type { ComponentProps } from "react";
import en from "../src/i18n/messages/en.json";
import zh from "../src/i18n/messages/zh-CN.json";
import de from "../src/i18n/messages/de.json";
import fr from "../src/i18n/messages/fr.json";
import { isPortalLocale, type PortalLocale } from "../src/i18n/routing";
import type { SearchResultLabels } from "../src/features/catalog/search-results";
import type { CatalogResultViewModel, ExchangeViewModel } from "../src/features/catalog/view-model";
import type { CompareWorkbench } from "../src/features/compare/compare-workbench";
import type { CompareSelectionProvider } from "../src/features/compare/selection";
import type { CompareCandidate } from "../src/features/compare/compatibility";

export const dictionaries = { "zh-CN": zh, en, de, fr };
export function storyLocale(globals: { locale?: unknown }): PortalLocale {
  return typeof globals.locale === "string" && isPortalLocale(globals.locale)
    ? globals.locale
    : "zh-CN";
}

// Synthetic identities and metadata: no fixture is a claim about a released dataset.
export const refs = [
  "11111111-1111-4111-8111-111111111111@01.00.000",
  "22222222-2222-4222-8222-222222222222@01.00.000",
  "33333333-3333-4333-8333-333333333333@01.00.000",
  "44444444-4444-4444-8444-444444444444@01.00.000",
  "55555555-5555-4555-8555-555555555555@01.00.000",
] as const;

export const sampleNames: Record<PortalLocale, string[]> = {
  "zh-CN": [
    "工业用电；区域电网组合；高压输配电；2022 年示例数据集",
    "再生铝生产；回收材料与不同来源的混合原料；示例数据集",
    "二氧化碳；排放至空气",
  ],
  en: [
    "Electricity for industry; regional grid mix; high-voltage transmission; 2022 example dataset",
    "Recycled aluminium production; mixed feedstock from recovered materials; example dataset",
    "Carbon dioxide; emissions to air",
  ],
  de: [
    "Industriestromversorgung; regionaler Strommix; Hochspannungsübertragung; Beispieldatensatz 2022",
    "Sekundäraluminiumherstellung; gemischte Ausgangsstoffe aus zurückgewonnenen Materialien; Beispieldatensatz",
    "Kohlendioxid; Emissionen in die Luft",
  ],
  fr: [
    "Électricité industrielle ; réseau régional ; transport à haute tension ; jeu de données d’exemple 2022",
    "Production d’aluminium recyclé ; matières premières mixtes issues de matériaux récupérés ; exemple",
    "Dioxyde de carbone ; émissions dans l’air",
  ],
};

export function catalogItems(locale: PortalLocale): CatalogResultViewModel[] {
  return sampleNames[locale].map((name, index) => ({
    ref: refs[index]!,
    name,
    kind: index === 2 ? "flow" : "process",
    accessLevel: index === 1 ? "metadata_only" : "open",
    capabilities: { exchangesVisible: index === 0, lciaVisible: index === 0 },
    functionalUnit: index === 0 ? "1 kWh" : "1 kg",
    referenceProduct: index < 2 ? name : undefined,
    referenceFlowProperty: index === 2 ? "Mass · kg" : undefined,
    geography: "CN",
    referenceYear: "2022",
    source: "Storybook fixture",
    description:
      index === 0
        ? {
            "zh-CN": "用于组件审阅的合成电力数据，展示发电与输配电过程的描述摘要。",
            en: "Synthetic electricity data for component review, describing generation, transmission and distribution.",
            de: "Synthetische Stromdaten zur Komponentenprüfung mit einer Beschreibung von Erzeugung, Übertragung und Verteilung.",
            fr: "Données électriques fictives pour examiner les composants, décrivant la production, le transport et la distribution.",
          }[locale]
        : undefined,
  }));
}

export function resultLabels(locale: PortalLocale): SearchResultLabels {
  const { Common: c, Search: s, Detail: d } = dictionaries[locale];
  return {
    publicContentLabels: dictionaries[locale].CatalogReference,
    collect: d.collect,
    compare: d.compare,
    copied: d.citationCopied,
    copyCitation: d.copyCitation,
    copyFailure: d.copyFailed,
    details: c.details,
    emptyDescription: s.emptyDescription,
    emptyTitle: s.emptyTitle,
    functionalUnit: d.functionalUnit,
    geography: d.geography,
    match: s.matchEvidence,
    metadataOnly: c.metadataOnly,
    flow: c.flow,
    process: c.process,
    public: c.public,
    quality: d.quality,
    reference: d.referenceProduct,
    referenceYear: d.referenceYear,
    selectForCompare: s.selectForCompare,
    source: d.sourceDatabase,
    technology: d.technology,
    matchingVersions: s.matchingVersions,
    version: s.version,
    referenceFlowProperty: d.referenceFlowProperty,
    exchangesAvailable: c.exchangesAvailable,
    lciaAvailable: c.lciaAvailable,
  };
}

export function selectionLabels(
  locale: PortalLocale,
): ComponentProps<typeof CompareSelectionProvider>["labels"] {
  const c = dictionaries[locale].Compare;
  return {
    count: c.selectionCount,
    clear: c.clearSelection,
    remove: c.removeSelection,
    continue: c.continueSelecting,
    selectedItems: c.selectedItems,
    compare: c.openComparison,
    hint: c.selectionHint,
    limit: c.limitReached,
  };
}

export function compareLabels(
  locale: PortalLocale,
): ComponentProps<typeof CompareWorkbench>["labels"] {
  const { Common: c, Compare: m, Detail: d } = dictionaries[locale];
  return {
    attentionFields: m.attentionFields,
    dimension: m.dimension,
    emptyDescription: m.emptyDescription,
    emptyTitle: m.emptyTitle,
    matrix: m.matrix,
    member: (index) => m.member.replace("{index}", String(index)),
    metadataOnly: m.metadataOnly,
    notProvided: c.notProvided,
    numericContext: m.numericContext,
    numericTitle: m.numericTitle,
    impactCategory: m.impactCategory,
    method: d.methodVersion,
    publication: d.publication,
    package: d.package,
    evidence: d.verificationCode,
    unit: d.unit,
    value: d.value,
    evidenceNotice: m.evidenceNotice,
    resultStatus: m.resultStatus,
    status: {
      direct: m.statusDirect,
      converted: m.statusConverted,
      reference_only: m.statusReference,
      incompatible: m.statusIncompatible,
      insufficient: m.statusInsufficient,
    },
  };
}

export function compareCandidates(locale: PortalLocale): CompareCandidate[] {
  return [0, 1].map((index) => ({
    ref: refs[index]!,
    name: `${sampleNames[locale][0]} · ${index + 1}`,
    functionalUnit: "1 kWh",
    referenceProduct: "Electricity (fixture)",
    referenceUnit: "kWh",
    allocationMethod: "Physical (fixture)",
    modelingApproach: "Attributional (fixture)",
    geography: "CN",
    geographyPrecision: "country",
    referenceYear: "2022",
    technology: "Regional grid mix (fixture)",
    cutoffRule: "1% (fixture)",
    lciaMethodRef: "fixture-method@1",
    publicationRef: "fixture-publication@1",
    lciaValue: { value: index === 0 ? "0.005" : "0.012", unit: "kg CO₂ eq" },
  }));
}

export function exchangeRows(locale: PortalLocale): ExchangeViewModel[] {
  return [0, 1, 2].map((index) => ({
    id: `fixture-exchange-${index}`,
    processRef: refs[0],
    flowRef: refs[index]!,
    flowName: sampleNames[locale][index]!,
    direction: index === 0 ? "input" : "output",
    kind: index === 0 ? "technosphere" : index === 1 ? "waste" : "elementary",
    amount: index === 0 ? "1" : index === 1 ? "0.005" : "123456.789",
    unit: "kg",
    functionalUnit: "1 kWh",
    capabilityPolicyVersion: "fixture-public-display-policy-v1",
    isQuantitativeReference: index === 0,
  }));
}

export const mobileGlobals = { viewport: { value: "mobile", isRotated: false } };
