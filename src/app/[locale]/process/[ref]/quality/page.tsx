import { GaugeIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailEmpty } from "@/features/catalog/detail-empty";
import { mapDataset } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { localizeReviewStatus } from "@/i18n/domain-vocabulary";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]/quality">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}/quality`),
  );
  const t = await getTranslations({ locale, namespace: "Detail" });
  return localizedMetadata({
    description: t("qualityEmpty"),
    locale,
    path: `process/${record.ref}/quality`,
    title: `${t("qualityTitle")} · ${record.name}`,
  });
}

export default async function ProcessQualityPage({
  params,
}: PageProps<"/[locale]/process/[ref]/quality">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const metadata = dataset.metadata;
  if (metadata.kind !== "process") return null;
  const t = await getTranslations({ locale, namespace: "Detail" });
  const labels = [
    t("reviewStatus"),
    t("timeRepresentativeness"),
    t("geographyRepresentativeness"),
    t("technologyRepresentativeness"),
    t("completeness"),
    t("uncertainty"),
  ];
  const values = [
    localizeReviewStatus(metadata.quality.reviewStatus, locale),
    metadata.quality.timeRepresentativeness,
    metadata.quality.geographyRepresentativeness,
    metadata.quality.technologyRepresentativeness,
    metadata.quality.completeness,
    metadata.quality.uncertainty,
  ];
  const rows = labels
    .map((label, index) => [label, values[index]] as const)
    .filter((row): row is readonly [string, string] => Boolean(row[1]));

  return (
    <section aria-labelledby="quality-title" className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold" id="quality-title">
        {t("qualityTitle")}
      </h2>
      {rows.length === 0 ? (
        <DetailEmpty description={t("qualityEmpty")} icon={GaugeIcon} title={t("qualityTitle")} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("qualityTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div className="flex flex-col gap-1" key={label}>
                  <dt className="text-muted-foreground text-sm">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
