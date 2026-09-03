import { BracesIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailEmpty } from "@/features/catalog/detail-empty";
import { localizedText, mapDataset } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]/method">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}/method`),
  );
  const t = await getTranslations({ locale, namespace: "Detail" });
  return localizedMetadata({
    description: t("methodDescription"),
    locale,
    path: `process/${record.ref}/method`,
    title: `${t("methodTitle")} · ${record.name}`,
  });
}

export default async function ProcessMethodPage({
  params,
}: PageProps<"/[locale]/process/[ref]/method">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const metadata = dataset.metadata;
  if (metadata.kind !== "process") return null;
  const t = await getTranslations({ locale, namespace: "Detail" });
  const fields = [
    [t("description"), localizedText(metadata.generalComment, locale)],
    [
      t("functionalUnit"),
      metadata.functionalUnit.amount && metadata.functionalUnit.unit
        ? `${metadata.functionalUnit.amount} ${metadata.functionalUnit.unit}`
        : localizedText(metadata.functionalUnit.description, locale),
    ],
    [t("allocationModeling"), localizedText(metadata.allocationAndModeling, locale)],
    [t("cutoffRules"), localizedText(metadata.cutoffRules, locale)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section aria-labelledby="method-title" className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold" id="method-title">
        {t("methodTitle")}
      </h2>
      {fields.length === 0 ? (
        <DetailEmpty description={t("methodEmpty")} icon={BracesIcon} title={t("methodTitle")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([label, value]) => (
            <Card key={label} size="sm">
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
