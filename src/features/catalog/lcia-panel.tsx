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
    evidence: string;
    functionalUnit: string;
    geography: string;
    impact: string;
    method: string;
    package: string;
    process: string;
    publication: string;
    referenceYear: string;
    unavailable: string;
    unit: string;
    value: string;
  };
  result: LciaViewModel;
};

export function LciaPanel({ labels, result }: LciaPanelProps) {
  if (result.status !== "available") {
    return (
      <Alert>
        <ShieldAlertIcon aria-hidden="true" />
        <AlertTitle>
          {result.status === "temporarily_unavailable"
            ? labels.guardUnavailable
            : labels.unavailable}
        </AlertTitle>
        <AlertDescription>
          {result.status === "temporarily_unavailable"
            ? labels.guardUnavailable
            : labels.unavailable}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>
          {labels.publication}: {result.publication.publicationId}
        </Badge>
        <Badge variant="outline">
          {labels.package}: {result.publication.packageId}@{result.publication.packageVersion}
        </Badge>
        <span className="text-muted-foreground text-sm">{result.publication.publishedAt}</span>
        <span className="text-muted-foreground font-mono text-xs break-all">
          {labels.evidence}: {result.publication.evidenceHash}
        </span>
      </div>
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
            {labels.publication}: {result.publication.publicationId}
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
