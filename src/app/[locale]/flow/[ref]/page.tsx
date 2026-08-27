import type { Metadata } from "next";

import { DatasetJsonLd } from "@/features/catalog/dataset-json-ld";
import { localizedText, mapDataset } from "@/features/catalog/map-public-data";
import { OverviewPanel } from "@/features/catalog/overview-panel";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/flow/[ref]">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("flow", locale, ref);
  const canonicalUrl = absolutePortalUrl(
    `/${locale}/flow/${dataset.key.id}@${dataset.key.version}`,
  );
  const record = mapDataset(dataset, locale, canonicalUrl);
  const description = localizedText(dataset.metadata.generalComment, locale) ?? record.ref;

  return localizedMetadata({
    description,
    locale,
    path: `flow/${record.ref}`,
    title: record.name,
  });
}

export default async function FlowDetailPage({ params }: PageProps<"/[locale]/flow/[ref]">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("flow", locale, ref);
  const canonicalUrl = absolutePortalUrl(
    `/${locale}/flow/${dataset.key.id}@${dataset.key.version}`,
  );
  const record = mapDataset(dataset, locale, canonicalUrl);

  return (
    <>
      <DatasetJsonLd canonicalUrl={canonicalUrl} dataset={dataset} locale={locale} />
      <OverviewPanel locale={locale} record={record} />
    </>
  );
}
