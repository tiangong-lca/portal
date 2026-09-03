import { ArrowDownLeftIcon, ArrowUpRightIcon, NetworkIcon } from "lucide-react";

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
import type { ExchangeViewModel } from "@/features/catalog/view-model";
import { localizeDirection, localizeFlowType } from "@/i18n/domain-vocabulary";
import type { PortalLocale } from "@/i18n/routing";

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
  locale: PortalLocale;
};

export function ExchangesPanel({
  caption,
  emptyDescription,
  emptyTitle,
  labels,
  rows,
  locale,
}: ExchangesPanelProps) {
  if (rows.length === 0) {
    return <DetailEmpty description={emptyDescription} icon={NetworkIcon} title={emptyTitle} />;
  }

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{row.flowName}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  {[
                    [labels.flow, row.flowRef],
                    [labels.direction, localizeDirection(row.direction, locale)],
                    [labels.kind, localizeFlowType(row.kind, locale)],
                    [labels.amount, `${row.amount} ${row.unit}`],
                    [labels.process, row.processRef],
                    [labels.functionalUnit, row.functionalUnit],
                    [labels.policy, row.capabilityPolicyVersion],
                    [
                      labels.quantitativeReference,
                      row.isQuantitativeReference ? labels.yes : labels.no,
                    ],
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
                    <ArrowDownLeftIcon aria-hidden="true" />
                  ) : (
                    <ArrowUpRightIcon aria-hidden="true" />
                  )}
                  {localizeDirection(row.direction, locale)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{localizeFlowType(row.kind, locale)}</Badge>
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
      </div>
    </>
  );
}
