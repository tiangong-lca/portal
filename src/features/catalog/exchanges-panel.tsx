import { ArrowDownLeftIcon, ArrowUpRightIcon, NetworkIcon } from "lucide-react";

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
import type { ExchangeViewModel } from "@/features/catalog/view-model";

import { DetailEmpty } from "./detail-empty";

type ExchangesPanelProps = {
  caption: string;
  emptyDescription: string;
  emptyTitle: string;
  labels: {
    amount: string;
    direction: string;
    flow: string;
    functionalUnit: string;
    kind: string;
    policy: string;
    process: string;
    quantitativeReference: string;
    yes: string;
    no: string;
  };
  rows: ExchangeViewModel[];
};

export function ExchangesPanel({
  caption,
  emptyDescription,
  emptyTitle,
  labels,
  rows,
}: ExchangesPanelProps) {
  if (rows.length === 0) {
    return <DetailEmpty description={emptyDescription} icon={NetworkIcon} title={emptyTitle} />;
  }

  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{labels.flow}</TableHead>
          <TableHead scope="col">{labels.direction}</TableHead>
          <TableHead scope="col">{labels.kind}</TableHead>
          <TableHead scope="col">{labels.amount}</TableHead>
          <TableHead scope="col">{labels.process}</TableHead>
          <TableHead scope="col">{labels.functionalUnit}</TableHead>
          <TableHead scope="col">{labels.policy}</TableHead>
          <TableHead scope="col">{labels.quantitativeReference}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <strong>{row.flowName}</strong>
              <br />
              <span className="text-muted-foreground font-mono text-xs">{row.flowRef}</span>
            </TableCell>
            <TableCell>
              {row.direction === "input" ? (
                <ArrowDownLeftIcon aria-label="input" />
              ) : (
                <ArrowUpRightIcon aria-label="output" />
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{row.kind}</Badge>
            </TableCell>
            <TableCell className="font-mono">
              {row.amount} {row.unit}
            </TableCell>
            <TableCell className="font-mono text-xs">{row.processRef}</TableCell>
            <TableCell>{row.functionalUnit}</TableCell>
            <TableCell className="font-mono text-xs">{row.capabilityPolicyVersion}</TableCell>
            <TableCell>{row.isQuantitativeReference ? labels.yes : labels.no}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
