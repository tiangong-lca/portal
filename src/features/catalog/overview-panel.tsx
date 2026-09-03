import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      rows:
        record?.kind === "flow"
          ? [
              [t("originalName"), record.name],
              [t("casNumber"), record.casNumber],
              [t("flowType"), record.flowType],
              [t("synonyms"), record.synonyms],
              [t("classification"), record.classifications],
            ]
          : [
              [t("originalName"), record?.name],
              [t("referenceProduct"), record?.referenceProduct],
              [t("classification"), record?.classifications],
            ],
    },
    {
      title: t("context"),
      rows:
        record?.kind === "flow"
          ? [
              [t("referenceFlowProperty"), record.referenceFlowProperty],
              ...(record.geography ? [[t("supplyLocation"), record.geography]] : []),
            ]
          : [
              [t("functionalUnit"), record?.functionalUnit],
              [t("geography"), record?.geography],
              [t("referenceYear"), record?.referenceYear],
            ],
    },
    {
      title: t("evidence"),
      rows: [
        [t("sourceDatabase"), record?.source],
        [t("license"), record?.license],
        [common("exactVersion"), record?.ref],
        [t("availability"), record?.evidence],
      ],
    },
  ];

  return (
    <section aria-label={t("overview")} className="grid items-start gap-4 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
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
            {group.title === t("evidence") ? (
              <div className="mt-4 flex flex-col items-start gap-3">
                <p className="text-muted-foreground text-xs leading-5">{t("availabilityHelp")}</p>
                {record?.licenseUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={record.licenseUrl} rel="noopener noreferrer" target="_blank">
                      {t("viewLicense")}
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {[
        [t("description"), record?.description],
        [t("technology"), record?.technology],
        [t("geographyDescription"), record?.geographyDescription],
      ]
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([label, value]) => (
          <Card className="lg:col-span-3" key={label} size="sm">
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 break-words">{value}</p>
            </CardContent>
          </Card>
        ))}
    </section>
  );
}
