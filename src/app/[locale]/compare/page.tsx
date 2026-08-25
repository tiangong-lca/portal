import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { isExactDatasetRef, parseExactDatasetRef } from "@/features/catalog/exact-ref";
import { mapCompareCandidate } from "@/features/catalog/map-public-data";
import { CompareWorkbench } from "@/features/compare/compare-workbench";
import type { CompareCandidate } from "@/features/compare/compatibility";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import { getPublicDataset } from "@/server/data/catalog";

function parseIds(value: string | string[] | undefined): string[] {
  const values = (Array.isArray(value) ? value : [value]).flatMap(
    (entry) => entry?.split(",") ?? [],
  );
  return [...new Set(values.map((entry) => entry.trim()).filter(isExactDatasetRef))].slice(0, 4);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/compare">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Compare" });
  return localizedMetadata({
    locale,
    path: "compare",
    title: t("title"),
    description: t("description"),
    index: false,
  });
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  const ids = parseIds((await searchParams).ids);
  const candidates: CompareCandidate[] = await Promise.all(
    ids.map(async (ref) => {
      const parsed = parseExactDatasetRef(ref);
      if (!parsed) return { name: ref, ref };
      const dataset = await getPublicDataset({ kind: "process", ...parsed });
      return dataset ? mapCompareCandidate(dataset, locale) : { name: ref, ref };
    }),
  );
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Compare" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-4xl flex-col gap-3">
        <Badge variant="outline">2–4 / EXACT VERSION</Badge>
        <h1 className="font-heading text-3xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground text-lg leading-8">{t("description")}</p>
      </header>
      <CompareWorkbench
        candidates={candidates}
        labels={{
          dimension: t("dimension"),
          emptyDescription: t("emptyDescription"),
          emptyTitle: t("emptyTitle"),
          matrix: t("matrix"),
          member: (index) => t("member", { index }),
          metadataOnly: t("metadataOnly"),
          notProvided: common("notProvided"),
          status: {
            converted: t("statusConverted"),
            direct: t("statusDirect"),
            incompatible: t("statusIncompatible"),
            insufficient: t("statusInsufficient"),
            reference_only: t("statusReference"),
          },
        }}
        locale={locale}
      />
    </main>
  );
}
