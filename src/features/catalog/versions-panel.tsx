import { HistoryIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VersionViewModel } from "@/features/catalog/view-model";

import { DetailEmpty } from "./detail-empty";

export function VersionsPanel({
  emptyDescription,
  emptyTitle,
  rows,
}: {
  emptyDescription: string;
  emptyTitle: string;
  rows: VersionViewModel[];
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
              <CardTitle className="font-mono">{row.ref}</CardTitle>
              <CardDescription>{row.summary ?? row.modifiedAt}</CardDescription>
              <CardAction>
                <Button asChild variant="outline">
                  <Link href={row.href}>{row.ref}</Link>
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ol>
  );
}
