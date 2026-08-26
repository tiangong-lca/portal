import type { Metadata } from "next";

import { DatasetJsonLd } from "@/features/catalog/dataset-json-ld";
import { localizedText, mapDataset } from "@/features/catalog/map-public-data";
import { OverviewPanel } from "@/features/catalog/overview-panel";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}`),
  );
  const description =
    dataset.metadata.kind === "process"
      ? (localizedText(dataset.metadata.generalComment, locale) ??
        record.functionalUnit ??
        record.ref)
      : record.ref;

  return localizedMetadata({
    description,
    locale,
    path: `process/${record.ref}`,
    title: record.name,
  });
}

export default async function ProcessOverviewPage({
  params,
}: PageProps<"/[locale]/process/[ref]">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const canonicalUrl = absolutePortalUrl(
    `/${locale}/process/${dataset.key.id}@${dataset.key.version}`,
  );
  const record = mapDataset(dataset, locale, canonicalUrl);

  return (
    <>
      <DatasetJsonLd canonicalUrl={canonicalUrl} dataset={dataset} locale={locale} />
      <OverviewPanel locale={locale} record={record} />
    </>
  );
}
