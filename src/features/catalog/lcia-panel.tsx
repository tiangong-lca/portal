import { ShieldAlertIcon, SigmaIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
            <TableRow key={row.impactId}>
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
  );
}
