export type CatalogKind = "process" | "flow";
export type AccessLevel = "open" | "metadata_only";

export type CatalogResultViewModel = {
  ref: string;
  kind: CatalogKind;
  name: string;
  originalName?: string;
  referenceProduct?: string;
  functionalUnit?: string;
  geography?: string;
  referenceYear?: string;
  technology?: string;
  source?: string;
  quality?: string;
  match?: string;
  accessLevel: AccessLevel;
  evidence?: string;
};

export type DatasetDetailViewModel = CatalogResultViewModel & {
  license?: string;
  citation?: string;
  canonicalUrl?: string;
};

export type ExchangeViewModel = {
  id: string;
  processRef: string;
  flowRef: string;
  flowName: string;
  direction: "input" | "output";
  kind: "technosphere" | "elementary" | "waste";
  amount: string;
  unit: string;
  functionalUnit: string;
  capabilityPolicyVersion: string;
  isQuantitativeReference: boolean;
};

export type LciaValueViewModel = {
  processRef: string;
  impactId: string;
  impactName: string;
  value: string;
  unit: string;
  functionalUnit: string;
  geography: string;
  referenceYear: string;
  methodRef: string;
  evidenceStatus: "verified";
};

export type LciaViewModel =
  | {
      status: "available";
      publication: {
        publicationId: string;
        packageId: string;
        packageVersion: string;
        publishedAt: string;
        evidenceHash: string;
      };
      rows: LciaValueViewModel[];
    }
  | { status: "unavailable" }
  | { status: "temporarily_unavailable" };

export type VersionViewModel = {
  href: string;
  ref: string;
  modifiedAt?: string;
  summary?: string;
};
