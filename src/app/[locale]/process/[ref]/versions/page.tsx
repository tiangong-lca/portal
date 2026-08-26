import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { mapDataset, mapVersions } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { VersionsPanel } from "@/features/catalog/versions-panel";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";
import { listPublicDatasetVersions } from "@/server/data/catalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]/versions">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}/versions`),
  );
  const t = await getTranslations({ locale, namespace: "Detail" });
  return localizedMetadata({
    description: t("versionsDescription"),
    locale,
    path: `process/${record.ref}/versions`,
    title: `${t("versionsTitle")} · ${record.name}`,
  });
}

export default async function ProcessVersionsPage({
  params,
}: PageProps<"/[locale]/process/[ref]/versions">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const page = await listPublicDatasetVersions({
    cursor: null,
    id: dataset.key.id,
    kind: "process",
    limit: 50,
  });
  const rows = mapVersions(page, locale);
  const t = await getTranslations({ locale, namespace: "Detail" });
  return (
    <section aria-labelledby="versions-title" className="flex flex-col gap-4">
      <header>
        <h2 className="font-heading text-2xl font-semibold" id="versions-title">
          {t("versionsTitle")}
        </h2>
        <p className="text-muted-foreground">{t("versionsDescription")}</p>
      </header>
      <VersionsPanel
        emptyDescription={t("versionsEmpty")}
        emptyTitle={t("versionsTitle")}
        rows={rows}
      />
    </section>
  );
}
