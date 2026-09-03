import { ShieldAlertIcon, SigmaIcon } from "lucide-react";

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
import type { LciaViewModel } from "@/features/catalog/view-model";

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
    unavailable: string;
    unit: string;
    value: string;
    verificationCode: string;
  };
  locale: string;
  result: LciaViewModel;
};

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
      <ul className="flex flex-col gap-3 md:hidden">
        {result.rows.map((row) => (
          <li key={`${row.processRef}:${row.methodRef}:${row.impactId}`}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{row.impactName}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  {[
                    [labels.value, `${row.value} ${row.unit}`],
                    [labels.method, row.methodRef],
                    [labels.process, row.processRef],
                    [labels.functionalUnit, row.functionalUnit],
                    [labels.geography, row.geography],
                    [labels.referenceYear, row.referenceYear],
                  ].map(([label, value]) => (
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2" key={label}>
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="text-sm break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
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
              <TableHead scope="col">{labels.value}</TableHead>
              <TableHead scope="col">{labels.unit}</TableHead>
              <TableHead scope="col">{labels.method}</TableHead>
              <TableHead scope="col">{labels.process}</TableHead>
              <TableHead scope="col">{labels.functionalUnit}</TableHead>
              <TableHead scope="col">{labels.geography}</TableHead>
              <TableHead scope="col">{labels.referenceYear}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={`${row.processRef}:${row.methodRef}:${row.impactId}`}>
                <TableCell>
                  <SigmaIcon aria-hidden="true" /> {row.impactName}
                </TableCell>
                <TableCell className="font-mono font-semibold">{row.value}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell className="font-mono text-xs">{row.methodRef}</TableCell>
                <TableCell className="font-mono text-xs">{row.processRef}</TableCell>
                <TableCell>{row.functionalUnit}</TableCell>
                <TableCell>{row.geography}</TableCell>
                <TableCell>{row.referenceYear}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
