import { GitCompareArrowsIcon } from "lucide-react";

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

const dimensionLabels: Record<CompatibilityDimension, { en: string; zh: string }> = {
  allocationMethod: { en: "Allocation method", zh: "分配方法" },
  cutoffRule: { en: "Cutoff rule", zh: "截止规则" },
  functionalUnit: { en: "Functional unit", zh: "功能单位" },
  geography: { en: "Geographic identity", zh: "地区身份" },
  geographyPrecision: { en: "Geographic precision", zh: "地区精度" },
  lciaMethodRef: { en: "LCIA method", zh: "LCIA 方法" },
  modelingApproach: { en: "Modeling approach", zh: "建模方法" },
  publicationRef: { en: "Publication", zh: "Publication" },
  referenceUnit: { en: "Reference-flow unit", zh: "参考流单位" },
  referenceYear: { en: "Reference year", zh: "参考年" },
  technology: { en: "Technology route", zh: "技术路线" },
};

export function CompareWorkbench({
  candidates,
  labels,
  locale,
  numericContext,
}: {
  candidates: CompareCandidate[];
  labels: CompareLabels;
  locale: "zh-CN" | "en";
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
          {result.canAlignLcia ? labels.status[result.status] : labels.metadataOnly}
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
                  {candidate.name || labels.member(index + 1)}
                </TableHead>
              ))}
              <TableHead scope="col">{labels.matrix}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={row.dimension}>
                <TableHead scope="row">
                  {dimensionLabels[row.dimension][locale === "zh-CN" ? "zh" : "en"]}
                </TableHead>
                {row.values.map((value, index) => (
                  <TableCell className="font-mono text-xs" key={candidates[index]?.ref}>
                    {value ?? labels.notProvided}
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
            <h3 className="font-medium">
              {dimensionLabels[row.dimension][locale === "zh-CN" ? "zh" : "en"]}
            </h3>
            <dl className="mt-3 flex flex-col gap-2">
              {row.values.map((value, index) => (
                <div
                  className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2"
                  key={candidates[index]?.ref}
                >
                  <dt className="text-muted-foreground text-xs">{labels.member(index + 1)}</dt>
                  <dd className="font-mono text-xs break-all">{value ?? labels.notProvided}</dd>
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
            <CardTitle>{labels.numericTitle}</CardTitle>
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
