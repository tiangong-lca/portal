import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { parseExactDatasetRef } from "@/features/catalog/exact-ref";
import { mapCompareCandidate } from "@/features/catalog/map-public-data";
import {
  applyComparableLcia,
  shouldRequestComparableLcia,
} from "@/features/compare/comparable-lcia";
import {
  CompareWorkbench,
  type ComparableLciaPresentation,
} from "@/features/compare/compare-workbench";
import type { CompareCandidate } from "@/features/compare/compatibility";
import { parseCompareIds, parseImpactCategoryId } from "@/features/compare/input";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import { getPublicDataset } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";
import { getComparablePublishedLciaValues } from "@/server/lcia/compare";

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
  searchParams: Promise<{
    ids?: string | string[];
    impactCategoryId?: string | string[];
  }>;
}) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const ids = parseCompareIds(query.ids);
  const impactCategoryId = parseImpactCategoryId(query.impactCategoryId);
  const datasets = await Promise.all(
    ids.map(async (ref) => {
      const parsed = parseExactDatasetRef(ref);
      if (!parsed) return null;
      try {
        return await getPublicDataset({ kind: "process", ...parsed });
      } catch (error) {
        if (error instanceof PortalDataError) return null;
        throw error;
      }
    }),
  );
  let candidates: CompareCandidate[] = ids.map((ref, index) => {
    const dataset = datasets[index];
    return dataset ? mapCompareCandidate(dataset, locale) : { name: ref, ref };
  });
  let numericContext: ComparableLciaPresentation | undefined;
  if (impactCategoryId && shouldRequestComparableLcia(impactCategoryId, candidates, datasets)) {
    const processRefs = datasets.map((dataset) => ({
      id: dataset!.key.id,
      version: dataset!.key.version,
    }));
    const lcia = await getComparablePublishedLciaValues({ impactCategoryId, processRefs });
    if (lcia.status === "available") {
      const mapped = applyComparableLcia(candidates, datasets, lcia.data, locale);
      if (mapped) {
        candidates = mapped.candidates;
        numericContext = mapped.context;
      }
    }
  }

  const [t, common, detail] = await Promise.all([
    getTranslations({ locale, namespace: "Compare" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "Detail" }),
  ]);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-4xl flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground text-lg leading-8">{t("description")}</p>
      </header>
      {ids.length >= 2 ? (
        <search>
          <form className="flex flex-col gap-2" method="get">
            <input name="v" type="hidden" value="1" />
            <input name="ids" type="hidden" value={ids.join(",")} />
            <label className="sr-only" htmlFor="impact-category-id">
              {t("impactCategory")}
            </label>
            <InputGroup className="min-h-11">
              <InputGroupInput
                defaultValue={impactCategoryId ?? ""}
                id="impact-category-id"
                maxLength={512}
                name="impactCategoryId"
                placeholder={t("impactCategory")}
              />
              <InputGroupAddon align="inline-end">
                <Button type="submit">{common("search")}</Button>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </search>
      ) : null}
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
          numericContext: t("numericContext"),
          numericTitle: t("numericTitle"),
          impactCategory: t("impactCategory"),
          method: detail("methodVersion"),
          publication: detail("publication"),
          package: detail("package"),
          evidence: detail("evidence"),
          unit: detail("unit"),
          value: detail("value"),
          status: {
            converted: t("statusConverted"),
            direct: t("statusDirect"),
            incompatible: t("statusIncompatible"),
            insufficient: t("statusInsufficient"),
            reference_only: t("statusReference"),
          },
        }}
        locale={locale}
        numericContext={numericContext}
      />
    </main>
  );
}
