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
    "zh-CN": "地理精度未说明",
    en: "Geographic precision not specified",
    de: "Geografische Genauigkeit nicht angegeben",
    fr: "Précision géographique non précisée",
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
    "zh-CN": "已收录于公开目录",
    en: "Listed in the public catalog",
    de: "Im öffentlichen Katalog aufgeführt",
    fr: "Répertorié dans le catalogue public",
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
  input: { name: string; ref: string; url: string; provider?: string },
): string {
  const [id, version = input.ref] = input.ref.split("@", 2);
  const identifier = id ? `${id}@${version}` : input.ref;
  switch (locale) {
    case "zh-CN":
      return `${input.provider ? `数据提供方：${input.provider}。` : ""}天工 LCA 平台，数据集：${input.name}，版本 ${version}，标识 ${identifier}，访问地址：${input.url}`;
    case "de":
      return `${input.provider ? `Datenanbieter: ${input.provider}. ` : ""}TianGong LCA Platform, Datensatz: ${input.name}, Version ${version}, Kennung ${identifier}, verfügbar unter ${input.url}`;
    case "fr":
      return `${input.provider ? `Fournisseur de données : ${input.provider}. ` : ""}Plateforme TianGong LCA, jeu de données : ${input.name}, version ${version}, identifiant ${identifier}, disponible sur ${input.url}`;
    default:
      return `${input.provider ? `Data provider: ${input.provider}. ` : ""}TianGong LCA Platform, dataset: ${input.name}, version ${version}, identifier ${identifier}, available at ${input.url}`;
  }
}

const flowTypes: Record<string, LocalizedValue> = {
  product: { "zh-CN": "产品流", en: "Product flow", de: "Produktfluss", fr: "Flux de produit" },
  elementary: {
    "zh-CN": "基本流",
    en: "Elementary flow",
    de: "Elementarfluss",
    fr: "Flux élémentaire",
  },
  waste: { "zh-CN": "废物流", en: "Waste flow", de: "Abfallfluss", fr: "Flux de déchet" },
  technosphere: {
    "zh-CN": "技术流",
    en: "Technosphere flow",
    de: "Technosphärenfluss",
    fr: "Flux de technosphère",
  },
  other: { "zh-CN": "其他流", en: "Other flow", de: "Sonstiger Fluss", fr: "Autre flux" },
  unknown: {
    "zh-CN": "类型未说明",
    en: "Type not specified",
    de: "Typ nicht angegeben",
    fr: "Type non précisé",
  },
};

export function localizeFlowType(value: string, locale: PortalLocale): string {
  return flowTypes[value]?.[locale] ?? flowTypes.unknown![locale];
}

export function localizeDirection(value: "input" | "output", locale: PortalLocale): string {
  const labels = {
    input: { "zh-CN": "输入", en: "Input", de: "Eingang", fr: "Entrée" },
    output: { "zh-CN": "输出", en: "Output", de: "Ausgang", fr: "Sortie" },
  };
  return labels[value][locale];
}

export function localizeFieldOrigin(value: string, locale: PortalLocale): string {
  const labels: Record<string, LocalizedValue> = {
    original: {
      "zh-CN": "原始记录",
      en: "Source record",
      de: "Quelldatensatz",
      fr: "Enregistrement source",
    },
    normalized: { "zh-CN": "标准化处理", en: "Normalized", de: "Normalisiert", fr: "Normalisé" },
    derived: {
      "zh-CN": "规则派生",
      en: "Rule-derived",
      de: "Regelbasiert abgeleitet",
      fr: "Dérivé par une règle",
    },
    ai_inferred: {
      "zh-CN": "AI 推断",
      en: "AI-inferred",
      de: "KI-abgeleitet",
      fr: "Inféré par IA",
    },
  };
  return labels[value]?.[locale] ?? value;
}

export function localizeConfidence(value: string, locale: PortalLocale): string {
  const labels: Record<string, LocalizedValue> = {
    high: { "zh-CN": "高", en: "High", de: "Hoch", fr: "Élevée" },
    medium: { "zh-CN": "中", en: "Medium", de: "Mittel", fr: "Moyenne" },
    low: { "zh-CN": "低", en: "Low", de: "Niedrig", fr: "Faible" },
  };
  return labels[value]?.[locale] ?? value;
}
