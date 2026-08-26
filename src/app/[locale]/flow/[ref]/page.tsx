import type { Metadata } from "next";

import { DatasetJsonLd } from "@/features/catalog/dataset-json-ld";
import { DetailHeader } from "@/features/catalog/detail-header";
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
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
      id="main-content"
    >
      <DatasetJsonLd canonicalUrl={canonicalUrl} dataset={dataset} locale={locale} />
      <DetailHeader kind="flow" locale={locale} record={record} refValue={record.ref} />
      <OverviewPanel locale={locale} record={record} />
    </main>
  );
}
