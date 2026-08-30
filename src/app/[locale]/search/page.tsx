import { FilterIcon, SearchIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { localizedText, mapSearchItem } from "@/features/catalog/map-public-data";
import { partitionFacetValues } from "@/features/catalog/facet-display";
import { HybridSearchPanel } from "@/features/catalog/hybrid-search-panel";
import { SearchResults } from "@/features/catalog/search-results";
import { isPortalLocale, localePath, type PortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import {
  parsePortalSearchUrl,
  PortalInputError,
  type PortalSearchUrlInput,
} from "@/server/contracts/input";
import { getPublicFacets, searchPublicFlows, searchPublicProcesses } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

type SearchParams = Record<string, string | string[] | undefined>;

function searchHref(locale: PortalLocale, input: PortalSearchUrlInput, cursor: string): string {
  const parameters = new URLSearchParams({
    cursor,
    kind: input.kind,
    limit: input.limit.toString(),
    q: input.query,
    sort: input.sort,
    v: "1",
  });
  if (input.filters.accessLevel) parameters.set("access", input.filters.accessLevel);
  if (input.filters.geography) parameters.set("geo", input.filters.geography);
  if (input.filters.classification) parameters.set("classification", input.filters.classification);
  if (input.filters.referenceYearFrom !== undefined) {
    parameters.set("yearFrom", input.filters.referenceYearFrom.toString());
  }
  if (input.filters.referenceYearTo !== undefined) {
    parameters.set("yearTo", input.filters.referenceYearTo.toString());
  }
  if (input.filters.processSubtype) parameters.set("subtype", input.filters.processSubtype);
  if (input.filters.source) parameters.set("source", input.filters.source);
  return `${localePath(locale, "search")}?${parameters.toString()}`;
}

function facetHref(
  locale: PortalLocale,
  input: PortalSearchUrlInput,
  groupId: string,
  value: string,
): string | null {
  const queryString = searchHref(locale, input, "facet").split("?", 2)[1];
  const parameters = new URLSearchParams(queryString);
  parameters.delete("cursor");
  const normalizedGroup = groupId.toLowerCase().replaceAll(/[^a-z]/g, "");

  if (normalizedGroup === "kind" || normalizedGroup === "objecttype") {
    if (value !== "process" && value !== "flow") return null;
    parameters.set("kind", value);
    if (value === "flow") parameters.delete("subtype");
  } else if (normalizedGroup.includes("access")) {
    if (value !== "open" && value !== "metadata_only") return null;
    parameters.set("access", value);
  } else if (normalizedGroup.includes("geography") || normalizedGroup.includes("region")) {
    parameters.set("geo", value);
  } else if (normalizedGroup.includes("year")) {
    if (!/^\d{1,4}$/.test(value)) return null;
    parameters.set("yearFrom", value);
    parameters.set("yearTo", value);
  } else if (normalizedGroup.includes("subtype")) {
    if (input.kind !== "process") return null;
    parameters.set("subtype", value);
  } else if (normalizedGroup.includes("source") || normalizedGroup.includes("database")) {
    parameters.set("source", value);
  } else if (normalizedGroup.includes("classification")) {
    parameters.set("classification", value);
  } else {
    return null;
  }

  return `${localePath(locale, "search")}?${parameters.toString()}`;
}

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
    source: detail("sourceDatabase"),
    technology: detail("technology"),
  };

  if (query && !inputInvalid) {
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

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground leading-7">{t("description")}</p>
      </header>

      <search>
        <form action={localePath(locale, "search")} className="flex flex-col gap-2" method="get">
          <input name="v" type="hidden" value="1" />
          <input name="kind" type="hidden" value={parsedSearch.kind} />
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
        </form>
      </search>

      <div aria-label={t("objectType")} className="flex flex-wrap gap-2">
        {(["process", "flow"] as const).map((kind) => (
          <Button asChild key={kind} variant={parsedSearch.kind === kind ? "default" : "outline"}>
            <a
              href={`${localePath(locale, "search")}?v=1&kind=${kind}&q=${encodeURIComponent(query)}`}
            >
              {kind === "process" ? common("process") : common("flow")}
            </a>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside aria-labelledby="facet-heading" className="hidden lg:block">
          <Card size="sm">
            <CardHeader>
              <FilterIcon aria-hidden="true" />
              <CardTitle id="facet-heading">{t("facets")}</CardTitle>
              <CardDescription>
                {facets ? t("description") : t("unavailableDescription")}
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
                            : (localizedText(value.label, locale) ?? value.value);
                      const label = `${translatedValue} (${value.count})`;
                      return href ? (
                        <Button
                          asChild
                          className="w-full justify-start"
                          key={value.value}
                          variant="ghost"
                        >
                          <a href={href}>{label}</a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm" key={value.value}>
                          {label}
                        </span>
                      );
                    };
                    const { disclosed, hiddenCount, visible } = partitionFacetValues(group.values);
                    return (
                      <div className="flex flex-col gap-2" key={group.id}>
                        <strong>{localizedText(group.label, locale) ?? group.id}</strong>
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
            </CardContent>
          </Card>
        </aside>

        <section aria-labelledby="results-heading" aria-live="polite" className="min-w-0">
          <h2 className="sr-only" id="results-heading">
            {query ? t("resultsFor", { query }) : t("initialTitle")}
          </h2>
          {!query ? (
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
            <form
              action={localePath(locale, "compare")}
              className="flex flex-col gap-4"
              method="get"
            >
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
            </form>
          )}
          {nextCursor ? (
            <nav aria-label={common("next")} className="mt-5 flex justify-end">
              <Button asChild variant="outline">
                <a href={searchHref(locale, parsedSearch, nextCursor)}>{common("next")}</a>
              </Button>
            </nav>
          ) : null}
        </section>
      </div>

      <Separator />

      <HybridSearchPanel
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
          kind: hybrid("kind"),
          privacy: hybrid("privacy"),
          process: hybrid("process"),
          queryLabel: hybrid("queryLabel"),
          queryPlaceholder: hybrid("queryPlaceholder"),
          resultsTitle: hybrid("resultsTitle"),
          running: hybrid("running"),
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
    </main>
  );
}
