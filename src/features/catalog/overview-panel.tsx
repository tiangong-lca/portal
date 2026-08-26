import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatasetDetailViewModel } from "@/features/catalog/view-model";
import type { PortalLocale } from "@/i18n/routing";

export async function OverviewPanel({
  locale,
  record,
}: {
  locale: PortalLocale;
  record?: DatasetDetailViewModel;
}) {
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Detail" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const groups = [
    {
      title: t("identity"),
      rows: [
        [t("originalName"), record?.originalName],
        [t("referenceProduct"), record?.referenceProduct],
        [t("sourceDatabase"), record?.source],
      ],
    },
    {
      title: t("context"),
      rows: [
        [t("functionalUnit"), record?.functionalUnit],
        [t("geography"), record?.geography],
        [t("referenceYear"), record?.referenceYear],
        [t("technology"), record?.technology],
      ],
    },
    {
      title: t("evidence"),
      rows: [
        [t("license"), record?.license],
        [common("exactVersion"), record?.ref],
        [common("public"), record?.evidence],
      ],
    },
  ];

  return (
    <section aria-label={t("overview")} className="grid gap-4 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{record ? common("public") : t("recordPending")}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              {group.rows.map(([label, value]) => (
                <div className="flex flex-col gap-1" key={label}>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {label}
                  </dt>
                  <dd className="min-h-5 text-sm break-words">{value || common("notProvided")}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
