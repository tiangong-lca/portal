import { HistoryIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VersionViewModel } from "@/features/catalog/view-model";

import { DetailEmpty } from "./detail-empty";

export function VersionsPanel({
  emptyDescription,
  emptyTitle,
  rows,
  currentRef,
  labels,
}: {
  emptyDescription: string;
  emptyTitle: string;
  rows: VersionViewModel[];
  currentRef?: string;
  labels: { view: string; current: string };
}) {
  if (rows.length === 0) {
    return <DetailEmpty description={emptyDescription} icon={HistoryIcon} title={emptyTitle} />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.ref}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{row.version}</CardTitle>
              <CardDescription>{row.summary ?? row.modifiedAt}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground min-w-0 flex-1 font-mono text-xs break-all">
                {row.ref}
              </span>
              {row.ref === currentRef ? <Badge variant="secondary">{labels.current}</Badge> : null}
              <Button asChild variant="outline">
                <Link href={row.href}>{labels.view}</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}
