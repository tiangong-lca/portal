import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { KeywordSearchForm } from "@/features/catalog/keyword-search-form";
import { SearchModes } from "@/features/catalog/search-modes";
import { ResponsiveFacets } from "@/features/catalog/responsive-facets";
import { CompareSelectionForm } from "@/features/compare/selection";
import {
  facetHref,
  hasCatalogQuery,
  searchHref,
  searchParameters,
} from "@/features/catalog/search-links";
import { formatGeographyCode } from "@/i18n/geography";
import { localizedText, mapSearchItem } from "@/features/catalog/map-public-data";
import { partitionFacetValues } from "@/features/catalog/facet-display";
import { HybridSearchPanel } from "@/features/catalog/hybrid-search-panel";
import { SearchResults } from "@/features/catalog/search-results";
import { isPortalLocale, localePath } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import { parsePortalSearchUrl, PortalInputError } from "@/server/contracts/input";
import { getPublicFacets, searchPublicFlows, searchPublicProcesses } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Search" });
  return localizedMetadata({
    description: t("description"),
    index: false,
    locale,
    path: "search",
    title: t("title"),
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  let parsedSearch;
  let inputInvalid = false;
  try {
    parsedSearch = parsePortalSearchUrl(rawSearchParams);
  } catch (error) {
    if (!(error instanceof PortalInputError)) throw error;
    parsedSearch = parsePortalSearchUrl({});
    inputInvalid = true;
  }

  const query = parsedSearch.query;
  const hasQuery = hasCatalogQuery(parsedSearch);
  const [t, hybrid, detail, common] = await Promise.all([
    getTranslations({ locale, namespace: "Search" }),
    getTranslations({ locale, namespace: "Hybrid" }),
    getTranslations({ locale, namespace: "Detail" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const facetLabels = [t("objectType"), t("access"), t("region"), t("year"), t("source")];
  let dataUnavailable = false;
  let nextCursor: string | null = null;
  let results: ReturnType<typeof mapSearchItem>[] = [];
  let facets: Awaited<ReturnType<typeof getPublicFacets>> | null = null;
  const resultLabels = {
    exchangesAvailable: common("exchangesAvailable"),
    lciaAvailable: common("lciaAvailable"),
    referenceFlowProperty: detail("referenceFlowProperty"),
    collect: detail("collect"),
    compare: detail("compare"),
    copied: detail("citationCopied"),
    copyCitation: detail("copyCitation"),
    details: common("details"),
    emptyDescription: t("emptyDescription"),
    emptyTitle: t("emptyTitle"),
    flow: common("flow"),
    functionalUnit: detail("functionalUnit"),
    geography: detail("geography"),
    match: t("matchEvidence"),
    metadataOnly: common("metadataOnly"),
    process: common("process"),
    public: common("public"),
    quality: detail("quality"),
    reference: detail("referenceProduct"),
    referenceYear: detail("referenceYear"),
    selectForCompare: t("selectForCompare"),
    matchingVersions: t("matchingVersions"),
    version: t("version"),
    source: detail("sourceDatabase"),
    technology: detail("technology"),
  };

  if (hasQuery && !inputInvalid) {
    try {
      const { kind: _kind, ...searchInput } = parsedSearch;
      const [page, facetPage] = await Promise.all([
        parsedSearch.kind === "process"
          ? searchPublicProcesses(searchInput, undefined, { cache: "short-public" })
          : searchPublicFlows(searchInput, undefined, { cache: "short-public" }),
        getPublicFacets(
          { filters: parsedSearch.filters, kind: parsedSearch.kind, query },
          undefined,
          { cache: "short-public" },
        ),
      ]);
      results = page.items.map((item) => mapSearchItem(item, locale));
      nextCursor = page.nextCursor;
      facets = facetPage;
    } catch (error) {
      if (!(error instanceof PortalDataError)) throw error;
      dataUnavailable = true;
    }
  }

  const filterSummary = [
    {
      keys: ["access"],
      label: t("access"),
      value: parsedSearch.filters.accessLevel
        ? common(parsedSearch.filters.accessLevel === "open" ? "public" : "metadataOnly")
        : undefined,
    },
    {
      keys: ["geo"],
      label: t("region"),
      value: formatGeographyCode(parsedSearch.filters.geography, locale),
    },
    {
      keys: ["classification"],
      label: t("classification"),
      value: parsedSearch.filters.classification,
    },
    {
      keys: ["yearFrom", "yearTo"],
      label: t("year"),
      value:
        parsedSearch.filters.referenceYearFrom !== undefined ||
        parsedSearch.filters.referenceYearTo !== undefined
          ? `${parsedSearch.filters.referenceYearFrom ?? "…"}–${parsedSearch.filters.referenceYearTo ?? "…"}`
          : undefined,
    },
    { keys: ["subtype"], label: t("processSubtype"), value: parsedSearch.filters.processSubtype },
    { keys: ["source"], label: t("source"), value: parsedSearch.filters.source },
  ].filter((entry): entry is { keys: string[]; label: string; value: string } =>
    Boolean(entry.value),
  );
  const clearFiltersHref = searchHref(locale, { ...parsedSearch, filters: {} }, null);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground leading-7">{t("description")}</p>
      </header>

      <SearchModes
        labels={{
          mode: t("searchMode"),
          keyword: t("keywordMode"),
          description: t("descriptionMode"),
        }}
        keyword={
          <>
            <search>
              <KeywordSearchForm action={localePath(locale, "search")} key={query}>
                {Array.from(searchParameters(parsedSearch, null))
                  .filter(([key]) => key !== "q")
                  .map(([key, value]) => (
                    <input key={key} name={key} type="hidden" value={value} />
                  ))}
                <label className="sr-only" htmlFor="catalog-query">
                  {t("label")}
                </label>
                <InputGroup className="min-h-12">
                  <InputGroupAddon>
                    <SearchIcon aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    defaultValue={query}
                    id="catalog-query"
                    maxLength={512}
                    name="q"
                    placeholder={t("placeholder")}
                    type="search"
                  />
                  <InputGroupAddon align="inline-end">
                    <Button size="lg" type="submit">
                      {t("submit")}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <p className="text-muted-foreground text-xs">{t("privacy")}</p>
              </KeywordSearchForm>
            </search>

            <div aria-label={t("objectType")} className="flex flex-wrap gap-2">
              {(["process", "flow"] as const).map((kind) => (
                <Button
                  asChild
                  key={kind}
                  variant={parsedSearch.kind === kind ? "default" : "outline"}
                >
                  <Link prefetch={false} href={facetHref(locale, parsedSearch, "kind", kind)!}>
                    {kind === "process" ? common("process") : common("flow")}
                  </Link>
                </Button>
              ))}
            </div>

            {filterSummary.length > 0 ? (
              <div aria-label={t("appliedFilters")} className="flex flex-wrap items-center gap-2">
                {filterSummary.map((entry) => {
                  const params = searchParameters(parsedSearch, null);
                  entry.keys.forEach((key) => params.delete(key));
                  return (
                    <Button
                      asChild
                      className="h-auto min-h-11 whitespace-normal"
                      key={entry.keys[0]}
                      variant="outline"
                    >
                      <Link
                        aria-label={`${common("clear")}: ${entry.label}`}
                        href={`${localePath(locale, "search")}?${params}`}
                        prefetch={false}
                      >
                        <span>
                          {entry.label}: {entry.value}
                        </span>
                        <XIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  );
                })}
                <Button asChild variant="ghost">
                  <Link href={clearFiltersHref} prefetch={false}>
                    {t("clearFilters")}
                  </Link>
                </Button>
              </div>
            ) : null}
            <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
              <ResponsiveFacets
                labels={{
                  title: t("facets"),
                  description: t("filtersDescription"),
                  close: common("close"),
                }}
              >
                <Card size="sm">
                  <CardHeader data-facet-intro>
                    <FilterIcon aria-hidden="true" />
                    <CardTitle>{t("facets")}</CardTitle>
                    <CardDescription>
                      {facets
                        ? t("filtersDescription")
                        : dataUnavailable
                          ? t("unavailableDescription")
                          : t("initialDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {facets
                      ? facets.groups.map((group) => {
                          const normalizedGroup = group.id.toLowerCase().replaceAll(/[^a-z]/g, "");
                          const renderValue = (value: (typeof group.values)[number]) => {
                            const href = facetHref(locale, parsedSearch, group.id, value.value);
                            const translatedValue =
                              normalizedGroup === "kind" || normalizedGroup === "objecttype"
                                ? value.value === "process"
                                  ? common("process")
                                  : value.value === "flow"
                                    ? common("flow")
                                    : value.value
                                : normalizedGroup.includes("access")
                                  ? value.value === "open"
                                    ? common("public")
                                    : value.value === "metadata_only"
                                      ? common("metadataOnly")
                                      : value.value
                                  : normalizedGroup.includes("geography") ||
                                      normalizedGroup.includes("region")
                                    ? (formatGeographyCode(value.value, locale) ?? value.value)
                                    : (localizedText(value.label, locale) ?? value.value);
                            const label = `${translatedValue} (${new Intl.NumberFormat(locale).format(value.count)})`;
                            return href ? (
                              <Button
                                asChild
                                className="h-auto min-h-11 w-full justify-start text-left break-words whitespace-normal"
                                key={value.value}
                                variant="ghost"
                              >
                                <Link href={href} prefetch={false}>
                                  {label}
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm" key={value.value}>
                                {label}
                              </span>
                            );
                          };
                          const { disclosed, hiddenCount, visible } = partitionFacetValues(
                            group.values,
                          );
                          return (
                            <div className="flex flex-col gap-2" key={group.id}>
                              <strong>
                                {normalizedGroup === "kind" || normalizedGroup === "objecttype"
                                  ? t("objectType")
                                  : normalizedGroup.includes("access")
                                    ? t("access")
                                    : normalizedGroup.includes("geography") ||
                                        normalizedGroup.includes("region")
                                      ? t("region")
                                      : normalizedGroup.includes("year")
                                        ? t("year")
                                        : normalizedGroup.includes("subtype")
                                          ? t("processSubtype")
                                          : normalizedGroup.includes("source") ||
                                              normalizedGroup.includes("database")
                                            ? t("source")
                                            : normalizedGroup.includes("classification")
                                              ? t("classification")
                                              : (localizedText(group.label, locale) ?? group.id)}
                              </strong>
                              {visible.map(renderValue)}
                              {disclosed.length > 0 ? (
                                <details>
                                  <summary className="text-link cursor-pointer text-sm">
                                    {t("moreFilters", { count: disclosed.length })}
                                  </summary>
                                  <div className="mt-2 flex flex-col gap-1">
                                    {disclosed.map(renderValue)}
                                    {hiddenCount > 0 ? (
                                      <p className="text-muted-foreground px-2 pt-2 text-xs leading-5">
                                        {t("refineMoreFilters", { count: hiddenCount })}
                                      </p>
                                    ) : null}
                                  </div>
                                </details>
                              ) : null}
                            </div>
                          );
                        })
                      : facetLabels.map((label) => (
                          <Button disabled key={label} variant="ghost">
                            {label}
                          </Button>
                        ))}
                    {facets ? (
                      <p className="text-muted-foreground text-xs leading-5">
                        {t("countsDescription")}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </ResponsiveFacets>

              <section aria-labelledby="results-heading" aria-live="polite" className="min-w-0">
                <h2 className="sr-only" id="results-heading">
                  {query
                    ? t("resultsFor", { query })
                    : hasQuery
                      ? t("allResultsTitle")
                      : t("initialTitle")}
                </h2>
                {!hasQuery ? (
                  <Empty className="min-h-80">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>{t("initialTitle")}</EmptyTitle>
                      <EmptyDescription>{t("initialDescription")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : inputInvalid || dataUnavailable ? (
                  <Alert variant={inputInvalid ? "destructive" : "default"}>
                    <AlertDescription>
                      {inputInvalid ? t("emptyDescription") : t("unavailableDescription")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <CompareSelectionForm action={localePath(locale, "compare")}>
                    <input name="v" type="hidden" value="1" />
                    <SearchResults
                      items={results}
                      labels={resultLabels}
                      locale={locale}
                      selectable
                      siteOrigin={process.env.SITE_URL ?? "http://localhost:3000"}
                    />
                    {results.some((item) => item.kind === "process") ? (
                      <Button className="self-start" type="submit">
                        {t("compareSelected")}
                      </Button>
                    ) : null}
                  </CompareSelectionForm>
                )}
                {nextCursor ? (
                  <nav aria-label={common("next")} className="mt-5 flex justify-end">
                    <Button asChild variant="outline">
                      <Link href={searchHref(locale, parsedSearch, nextCursor)} prefetch={false}>
                        {common("next")}
                      </Link>
                    </Button>
                  </nav>
                ) : null}
              </section>
            </div>
          </>
        }
        description={
          <HybridSearchPanel
            key={JSON.stringify({ kind: parsedSearch.kind, filters: parsedSearch.filters })}
            initialFilters={parsedSearch.filters}
            initialKind={parsedSearch.kind}
            labels={{
              advisoryDescription: hybrid("advisoryDescription"),
              advisoryTitle: hybrid("advisoryTitle"),
              compareSelected: t("compareSelected"),
              description: hybrid("description"),
              emptyDescription: hybrid("emptyDescription"),
              emptyTitle: hybrid("emptyTitle"),
              error: hybrid("error"),
              fallbackDescription: hybrid("fallbackDescription"),
              fallbackTitle: hybrid("fallbackTitle"),
              flow: hybrid("flow"),
              flowPlaceholder: hybrid("flowPlaceholder"),
              kind: hybrid("kind"),
              privacy: hybrid("privacy"),
              process: hybrid("process"),
              queryLabel: hybrid("queryLabel"),
              queryPlaceholder: hybrid("queryPlaceholder"),
              resultsTitle: hybrid("resultsTitle"),
              running: hybrid("running"),
              initialDescription: hybrid("initialDescription"),
              optimizing: hybrid("optimizing"),
              optimizingDescription: hybrid("optimizingDescription"),
              updateTitle: hybrid("updateTitle"),
              updateDescription: hybrid("updateDescription"),
              showUpdated: hybrid("showUpdated"),
              optimized: hybrid("optimized"),
              noMatchesTitle: hybrid("noMatchesTitle"),
              noMatchesDescription: hybrid("noMatchesDescription"),
              loadMore: hybrid("loadMore"),
              loadingMore: hybrid("loadingMore"),
              pageError: hybrid("pageError"),
              cursorExpired: hybrid("cursorExpired"),
              restart: hybrid("restart"),
              semanticQuery: hybrid("semanticQuery"),
              shareCancel: hybrid("shareCancel"),
              shareConfirm: hybrid("shareConfirm"),
              shareDisclosure: hybrid("shareDisclosure"),
              sharePreview: hybrid("sharePreview"),
              shareQuery: hybrid("shareQuery"),
              shared: hybrid("shared"),
              submit: hybrid("submit"),
              terms: hybrid("terms"),
              title: hybrid("title"),
            }}
            locale={locale}
            resultLabels={resultLabels}
            siteOrigin={process.env.SITE_URL ?? "http://localhost:3000"}
          />
        }
      />
    </main>
  );
}
