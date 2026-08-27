import { DetailHeader } from "@/features/catalog/detail-header";
import { mapDataset } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl } from "@/lib/seo";

export default async function FlowDetailLayout({
  children,
  params,
}: LayoutProps<"/[locale]/flow/[ref]">) {
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
      <DetailHeader kind="flow" locale={locale} record={record} refValue={record.ref} />
      {children}
    </main>
  );
}
