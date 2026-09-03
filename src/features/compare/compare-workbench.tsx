import { GitCompareArrowsIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { localePath, type PortalLocale } from "@/i18n/routing";
import { formatGeographyCode } from "@/i18n/geography";
import { localizeGeographyPrecision } from "@/i18n/domain-vocabulary";

import {
  evaluateCompatibility,
  type CompareCandidate,
  type CompatibilityDimension,
  type CompatibilityStatus,
} from "./compatibility";

type CompareLabels = {
  dimension: string;
  emptyDescription: string;
  emptyTitle: string;
  matrix: string;
  member: (index: number) => string;
  metadataOnly: string;
  notProvided: string;
  numericContext: string;
  numericTitle: string;
  impactCategory: string;
  method: string;
  publication: string;
  package: string;
  evidence: string;
  unit: string;
  value: string;
  evidenceNotice: string;
  resultStatus: string;
  status: Record<CompatibilityStatus, string>;
};

export type ComparableLciaPresentation = {
  evidenceHash: string;
  impactName: string;
  methodRef: string;
  packageRef: string;
  publicationRef: string;
  publishedAt: string;
  unit: string;
};

const dimensionLabels: Record<CompatibilityDimension, Record<PortalLocale, string>> = {
  referenceProduct: {
    "zh-CN": "参考产品",
    en: "Reference product",
    de: "Referenzprodukt",
    fr: "Produit de référence",
  },
  allocationMethod: {
    "zh-CN": "分配方法",
    en: "Allocation method",
    de: "Allokationsmethode",
    fr: "Méthode d’allocation",
  },
  cutoffRule: {
    "zh-CN": "截止规则",
    en: "Cutoff rule",
    de: "Abschneideregel",
    fr: "Règle de coupure",
  },
  functionalUnit: {
    "zh-CN": "功能单位",
    en: "Functional unit",
    de: "Funktionelle Einheit",
    fr: "Unité fonctionnelle",
  },
  geography: { "zh-CN": "地区", en: "Geography", de: "Region", fr: "Région" },
  geographyPrecision: {
    "zh-CN": "地区精度",
    en: "Geographic precision",
    de: "Geografische Genauigkeit",
    fr: "Précision géographique",
  },
  lciaMethodRef: {
    "zh-CN": "LCIA 方法",
    en: "LCIA method",
    de: "LCIA-Methode",
    fr: "Méthode d’ÉICV",
  },
  modelingApproach: {
    "zh-CN": "建模方法",
    en: "Modeling approach",
    de: "Modellierungsansatz",
    fr: "Approche de modélisation",
  },
  publicationRef: {
    "zh-CN": "发布批次",
    en: "Publication",
    de: "Veröffentlichung",
    fr: "Publication",
  },
  referenceUnit: {
    "zh-CN": "参考流单位",
    en: "Reference-flow unit",
    de: "Einheit des Referenzflusses",
    fr: "Unité du flux de référence",
  },
  referenceYear: {
    "zh-CN": "参考年",
    en: "Reference year",
    de: "Referenzjahr",
    fr: "Année de référence",
  },
  technology: { "zh-CN": "技术描述", en: "Technology", de: "Technologie", fr: "Technologie" },
};

export function CompareWorkbench({
  candidates,
  labels,
  locale,
  numericContext,
}: {
  candidates: CompareCandidate[];
  labels: CompareLabels;
  locale: PortalLocale;
  numericContext?: ComparableLciaPresentation;
}) {
  if (candidates.length < 2) {
    return (
      <Empty className="min-h-72">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitCompareArrowsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
          <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const result = evaluateCompatibility(candidates);

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <GitCompareArrowsIcon aria-hidden="true" />
        <AlertTitle>{labels.status[result.status]}</AlertTitle>
        <AlertDescription>
          <p>{labels.evidenceNotice}</p>
          {!result.canAlignLcia ? <p>{labels.metadataOnly}</p> : null}
        </AlertDescription>
      </Alert>
      <div className="hidden md:block">
        <Table>
          <TableCaption>{labels.matrix}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{labels.dimension}</TableHead>
              {candidates.map((candidate, index) => (
                <TableHead key={candidate.ref} scope="col">
                  <Link
                    className="block max-w-xs whitespace-normal"
                    href={localePath(locale, `process/${encodeURIComponent(candidate.ref)}`)}
                  >
                    {candidate.name || labels.member(index + 1)}
                  </Link>
                  <span className="text-muted-foreground block font-mono text-xs">
                    {candidate.ref.split("@")[1]}
                  </span>
                </TableHead>
              ))}
              <TableHead scope="col">{labels.resultStatus}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={row.dimension}>
                <TableHead scope="row">{dimensionLabels[row.dimension][locale]}</TableHead>
                {row.values.map((value, index) => (
                  <TableCell className="font-mono text-xs" key={candidates[index]?.ref}>
                    {row.dimension === "geography"
                      ? (formatGeographyCode(value, locale) ?? labels.notProvided)
                      : row.dimension === "geographyPrecision" && value
                        ? localizeGeographyPrecision(value, locale)
                        : (value ?? labels.notProvided)}
                  </TableCell>
                ))}
                <TableCell>
                  <Badge variant="outline">{labels.status[row.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {result.rows.map((row) => (
          <section className="rounded-xl border p-4" key={row.dimension}>
            <h3 className="font-medium">{dimensionLabels[row.dimension][locale]}</h3>
            <dl className="mt-3 flex flex-col gap-2">
              {row.values.map((value, index) => (
                <div className="grid gap-1 rounded-lg border p-3" key={candidates[index]?.ref}>
                  <dt className="text-muted-foreground text-xs break-words">
                    <Link
                      href={localePath(
                        locale,
                        `process/${encodeURIComponent(candidates[index]!.ref)}`,
                      )}
                    >
                      {candidates[index]?.name ?? labels.member(index + 1)}
                    </Link>
                    <span className="block font-mono">{candidates[index]?.ref.split("@")[1]}</span>
                  </dt>
                  <dd className="text-sm break-words">
                    {row.dimension === "geography"
                      ? (formatGeographyCode(value, locale) ?? labels.notProvided)
                      : row.dimension === "geographyPrecision" && value
                        ? localizeGeographyPrecision(value, locale)
                        : (value ?? labels.notProvided)}
                  </dd>
                </div>
              ))}
            </dl>
            <Badge className="mt-3" variant="outline">
              {labels.status[row.status]}
            </Badge>
          </section>
        ))}
      </div>
      {result.canAlignLcia && numericContext ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{labels.numericTitle}</h2>
            </CardTitle>
            <CardDescription>{labels.numericContext}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [labels.impactCategory, numericContext.impactName],
                [labels.method, numericContext.methodRef],
                [
                  labels.publication,
                  `${numericContext.publicationRef} · ${numericContext.publishedAt}`,
                ],
                [labels.package, numericContext.packageRef],
                [labels.evidence, numericContext.evidenceHash],
              ].map(([label, value]) => (
                <div className="flex flex-col gap-1" key={label}>
                  <dt className="text-muted-foreground text-xs uppercase">{label}</dt>
                  <dd className="font-mono text-xs break-all">{value}</dd>
                </div>
              ))}
            </dl>
            <Table>
              <TableCaption>{labels.numericTitle}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{labels.dimension}</TableHead>
                  <TableHead scope="col">{labels.value}</TableHead>
                  <TableHead scope="col">{labels.unit}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.ref}>
                    <TableHead scope="row">{candidate.name}</TableHead>
                    <TableCell className="font-mono font-semibold">
                      {candidate.lciaValue?.value}
                    </TableCell>
                    <TableCell>{candidate.lciaValue?.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
