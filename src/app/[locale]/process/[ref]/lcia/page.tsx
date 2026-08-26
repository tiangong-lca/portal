import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LciaPanel } from "@/features/catalog/lcia-panel";
import { mapDataset, mapLciaPage } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import type { LciaViewModel } from "@/features/catalog/view-model";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";
import { queryPublishedLcia } from "@/server/lcia/client";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]/lcia">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}/lcia`),
  );
  const t = await getTranslations({ locale, namespace: "Detail" });
  return localizedMetadata({
    description: t("lciaDescription"),
    locale,
    path: `process/${record.ref}/lcia`,
    title: `${t("lciaTitle")} · ${record.name}`,
  });
}

export default async function ProcessLciaPage({
  params,
}: PageProps<"/[locale]/process/[ref]/lcia">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const processRef = `${dataset.key.id}@${dataset.key.version}`;
  let result: LciaViewModel = { status: "unavailable" };

  if (dataset.capabilities.lciaVisible) {
    const response = await queryPublishedLcia({
      cursor: null,
      impactCategoryId: null,
      limit: 50,
      mode: "process_all_impacts",
      processRefs: [{ id: dataset.key.id, version: dataset.key.version }],
    });
    result =
      response.status === "available"
        ? mapLciaPage(response.data, locale, processRef)
        : { status: response.status };
  }

  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Detail" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  return (
    <section aria-labelledby="lcia-title" className="flex flex-col gap-4">
      <header>
        <h2 className="font-heading text-2xl font-semibold" id="lcia-title">
          {t("lciaTitle")}
        </h2>
        <p className="text-muted-foreground">{t("lciaDescription")}</p>
      </header>
      <LciaPanel
        labels={{
          evidence: t("evidence"),
          functionalUnit: t("functionalUnit"),
          geography: t("geography"),
          guardUnavailable: t("lciaGuardUnavailable"),
          impact: t("impact"),
          method: t("methodVersion"),
          package: t("package"),
          process: common("process"),
          publication: t("publication"),
          referenceYear: t("referenceYear"),
          unavailable: t("lciaUnavailable"),
          unit: t("unit"),
          value: t("value"),
        }}
        result={result}
      />
    </section>
  );
}
