import { ChevronDownIcon, ShieldAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LciaValueViewModel, LciaViewModel } from "@/features/catalog/view-model";

type LciaPanelProps = {
  labels: {
    guardUnavailable: string;
    unavailableTitle: string;
    failureTitle: string;
    functionalUnit: string;
    geography: string;
    impact: string;
    method: string;
    package: string;
    process: string;
    publication: string;
    published: string;
    referenceYear: string;
    releaseDetails: string;
    context: string;
    unavailable: string;
    unit: string;
    value: string;
    verificationCode: string;
  };
  locale: string;
  result: LciaViewModel;
};

function ResultContext({
  row,
  labels,
}: {
  row: LciaValueViewModel;
  labels: LciaPanelProps["labels"];
}) {
  return (
    <details className="group/result min-w-0">
      <summary className="text-link focus-visible:outline-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open/result:rotate-180"
        />
        {labels.context}
      </summary>
      <dl className="mt-2 grid gap-3 border-l pl-3">
        {[
          [labels.method, row.methodRef],
          [labels.process, row.processRef],
        ].map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="mt-1 font-mono text-xs [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function ResultValue({ row }: { row: LciaValueViewModel }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="max-w-full overflow-x-auto font-mono font-semibold whitespace-nowrap tabular-nums">
        {row.value}
      </span>
      <span className="text-muted-foreground text-sm">{row.unit}</span>
    </span>
  );
}

/** @import import { LciaPanel } from "@/features/catalog/lcia-panel"; */
export function LciaPanel({ labels, locale, result }: LciaPanelProps) {
  if (result.status !== "available") {
    return (
      <Alert>
        <ShieldAlertIcon aria-hidden="true" />
        <AlertTitle>
          {result.status === "temporarily_unavailable"
            ? labels.failureTitle
            : labels.unavailableTitle}
        </AlertTitle>
        <AlertDescription>
          {result.status === "temporarily_unavailable"
            ? labels.guardUnavailable
            : labels.unavailable}
        </AlertDescription>
      </Alert>
    );
  }

  const publishedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(result.publication.publishedAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{labels.publication}</Badge>
        <span className="text-muted-foreground text-sm">
          {labels.published}: {publishedAt}
        </span>
      </div>
      <details className="group rounded-lg border px-4 py-3">
        <summary className="cursor-pointer font-medium">{labels.releaseDetails}</summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [labels.publication, result.publication.publicationId],
            [
              labels.package,
              `${result.publication.packageId}@${result.publication.packageVersion}`,
            ],
            [labels.verificationCode, result.publication.evidenceHash],
          ].map(([label, value]) => (
            <div className="min-w-0" key={label}>
              <dt className="text-muted-foreground text-xs tracking-[0.08em] uppercase">{label}</dt>
              <dd className="mt-1 font-mono text-xs break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
      <ul aria-label={labels.publication} className="flex flex-col gap-3 md:hidden">
        {result.rows.map((row) => (
          <li key={`${row.processRef}:${row.methodRef}:${row.impactId}`}>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="[overflow-wrap:anywhere]">{row.impactName}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl>
                  <dt className="sr-only">{labels.value}</dt>
                  <dd className="text-lg">
                    <ResultValue row={row} />
                  </dd>
                </dl>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    [labels.functionalUnit, row.functionalUnit],
                    [labels.geography, row.geography],
                    [labels.referenceYear, row.referenceYear],
                  ].map(([label, value]) => (
                    <div className="min-w-0" key={label}>
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="mt-1 text-sm [overflow-wrap:anywhere]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border-t">
                  <ResultContext row={row} labels={labels} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableCaption>
            {labels.publication} · {labels.published}: {publishedAt}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{labels.impact}</TableHead>
              <TableHead className="text-right" scope="col">
                {labels.value} / {labels.unit}
              </TableHead>
              <TableHead className="whitespace-normal" scope="col">
                {labels.functionalUnit}
              </TableHead>
              <TableHead scope="col">{labels.geography}</TableHead>
              <TableHead className="whitespace-normal" scope="col">
                {labels.referenceYear}
              </TableHead>
              <TableHead className="w-1/5 whitespace-normal" scope="col">
                {labels.context}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={`${row.processRef}:${row.methodRef}:${row.impactId}`}>
                <TableHead scope="row" className="py-3 [overflow-wrap:anywhere] whitespace-normal">
                  {row.impactName}
                </TableHead>
                <TableCell className="py-3 text-right">
                  <ResultValue row={row} />
                </TableCell>
                <TableCell className="whitespace-normal">{row.functionalUnit}</TableCell>
                <TableCell>{row.geography}</TableCell>
                <TableCell>{row.referenceYear}</TableCell>
                <TableCell className="whitespace-normal">
                  <ResultContext row={row} labels={labels} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
