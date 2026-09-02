import type { PortalLocale } from "./routing";

type LocalizedValue = Record<PortalLocale, string>;

const geographyPrecision: Record<string, LocalizedValue> = {
  country: { "zh-CN": "国家", en: "Country", de: "Land", fr: "Pays" },
  province: {
    "zh-CN": "省或区域",
    en: "Province or region",
    de: "Provinz oder Region",
    fr: "Province ou région",
  },
  city: { "zh-CN": "城市", en: "City", de: "Stadt", fr: "Ville" },
  other: { "zh-CN": "其他范围", en: "Other area", de: "Anderer Raumbezug", fr: "Autre périmètre" },
  unknown: {
    "zh-CN": "范围未说明",
    en: "Area not specified",
    de: "Raumbezug nicht angegeben",
    fr: "Périmètre non précisé",
  },
};

const matchReasons: Record<string, LocalizedValue> = {
  exact_id: {
    "zh-CN": "精确标识",
    en: "Exact identifier",
    de: "Genaue Kennung",
    fr: "Identifiant exact",
  },
  name: { "zh-CN": "名称", en: "Name", de: "Name", fr: "Nom" },
  classification: {
    "zh-CN": "分类",
    en: "Classification",
    de: "Klassifikation",
    fr: "Classification",
  },
  cas: { "zh-CN": "CAS 号", en: "CAS number", de: "CAS-Nummer", fr: "Numéro CAS" },
  full_text: { "zh-CN": "文本内容", en: "Text content", de: "Textinhalt", fr: "Contenu textuel" },
  lexical_public_projection: {
    "zh-CN": "关键词相关",
    en: "Related keywords",
    de: "Passende Stichwörter",
    fr: "Mots-clés associés",
  },
  semantic_public_projection: {
    "zh-CN": "描述与需求相关",
    en: "Description matches your need",
    de: "Beschreibung passt zum Bedarf",
    fr: "Description adaptée au besoin",
  },
};

const reviewStatuses: Record<string, LocalizedValue> = {
  "Dependent internal review": {
    "zh-CN": "内部相关方审核",
    en: "Dependent internal review",
    de: "Abhängige interne Prüfung",
    fr: "Revue interne non indépendante",
  },
  "Independent internal review": {
    "zh-CN": "独立内部审核",
    en: "Independent internal review",
    de: "Unabhängige interne Prüfung",
    fr: "Revue interne indépendante",
  },
  "Independent external review": {
    "zh-CN": "独立外部审核",
    en: "Independent external review",
    de: "Unabhängige externe Prüfung",
    fr: "Revue externe indépendante",
  },
  "Accredited third party review": {
    "zh-CN": "经认可的第三方审核",
    en: "Accredited third-party review",
    de: "Prüfung durch akkreditierte Dritte",
    fr: "Revue par un tiers accrédité",
  },
  "Independent review panel": {
    "zh-CN": "独立审核组审核",
    en: "Independent review panel",
    de: "Unabhängiges Prüfgremium",
    fr: "Comité de revue indépendant",
  },
  "Not reviewed": {
    "zh-CN": "尚未审核",
    en: "Not reviewed",
    de: "Nicht geprüft",
    fr: "Non revu",
  },
  reviewed: {
    "zh-CN": "已审核",
    en: "Reviewed",
    de: "Geprüft",
    fr: "Revu",
  },
};

const latestVersion: LocalizedValue = {
  "zh-CN": "最新公开版本",
  en: "Latest public version",
  de: "Neueste öffentliche Version",
  fr: "Dernière version publique",
};

const genericPublicEvidence: LocalizedValue = {
  "zh-CN": "公开信息可用",
  en: "Public information available",
  de: "Öffentliche Angaben verfügbar",
  fr: "Informations publiques disponibles",
};

const publicEvidenceReasons: Record<string, LocalizedValue> = {
  state_100_public: {
    "zh-CN": "已公开发布",
    en: "Published for public use",
    de: "Für die öffentliche Nutzung veröffentlicht",
    fr: "Publié pour un usage public",
  },
  state_200_metadata_only: {
    "zh-CN": "公开信息可浏览，数值未开放",
    en: "Public information is available; values are not open",
    de: "Öffentliche Angaben sind verfügbar; Werte sind nicht freigegeben",
    fr: "Les informations sont publiques ; les valeurs ne sont pas ouvertes",
  },
};

export function localizeGeographyPrecision(value: string, locale: PortalLocale): string {
  return geographyPrecision[value]?.[locale] ?? geographyPrecision.unknown![locale];
}

export function localizeMatchReasons(values: readonly string[], locale: PortalLocale): string {
  const labels = values.map((value) => matchReasons[value]?.[locale]).filter(Boolean);
  return labels.length > 0 ? labels.join(" · ") : matchReasons.full_text![locale];
}

export function localizeReviewStatus(
  value: string | null | undefined,
  locale: PortalLocale,
): string | undefined {
  if (!value) return undefined;
  return reviewStatuses[value]?.[locale] ?? value;
}

export function localizePublicEvidence(values: readonly string[], locale: PortalLocale): string {
  const labels = values.map((value) => publicEvidenceReasons[value]?.[locale]).filter(Boolean);
  return labels.length > 0 ? labels.join(" · ") : genericPublicEvidence[locale];
}

export function localizeLatestVersion(locale: PortalLocale): string {
  return latestVersion[locale];
}

export function formatDatasetCitation(
  locale: PortalLocale,
  input: { name: string; ref: string; url: string },
): string {
  const [id, version = input.ref] = input.ref.split("@", 2);
  const identifier = id ? `${id}@${version}` : input.ref;
  switch (locale) {
    case "zh-CN":
      return `天工 LCA 平台，数据集：${input.name}，版本 ${version}，标识 ${identifier}，访问地址：${input.url}`;
    case "de":
      return `TianGong LCA Platform, Datensatz: ${input.name}, Version ${version}, Kennung ${identifier}, verfügbar unter ${input.url}`;
    case "fr":
      return `Plateforme TianGong LCA, jeu de données : ${input.name}, version ${version}, identifiant ${identifier}, disponible sur ${input.url}`;
    default:
      return `TianGong LCA Platform, dataset: ${input.name}, version ${version}, identifier ${identifier}, available at ${input.url}`;
  }
}
