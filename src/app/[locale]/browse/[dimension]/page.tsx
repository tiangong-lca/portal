import { Rows3Icon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { localizedText, mapSearchItem } from "@/features/catalog/map-public-data";
import { SearchResults } from "@/features/catalog/search-results";
import { isPortalLocale, localePath } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import { getPublicFacets, searchPublicFlows, searchPublicProcesses } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

const dimensions = ["process", "flow", "region", "source"] as const;
type Dimension = (typeof dimensions)[number];

function isDimension(value: string): value is Dimension {
  return dimensions.some((dimension) => dimension === value);
}

function safeCursor(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && /^[A-Za-z0-9_-]{1,4096}$/.test(candidate) ? candidate : null;
}

export function generateStaticParams() {
  return dimensions.map((dimension) => ({ dimension }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ dimension: string; locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}): Promise<Metadata> {
  const { dimension, locale } = await params;
  if (!isPortalLocale(locale) || !isDimension(dimension)) return {};
  const t = await getTranslations({ locale, namespace: "Browse" });
  return localizedMetadata({
    description: t("description"),
    index: !safeCursor((await searchParams).cursor),
    locale,
    path: `browse/${dimension}`,
    title: t("title", { dimension }),
  });
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ dimension: string; locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { dimension, locale } = await params;
  if (!isPortalLocale(locale) || !isDimension(dimension)) notFound();
  setRequestLocale(locale);
  const cursor = safeCursor((await searchParams).cursor);
  const [t, searchT, detail, common] = await Promise.all([
    getTranslations({ locale, namespace: "Browse" }),
    getTranslations({ locale, namespace: "Search" }),
    getTranslations({ locale, namespace: "Detail" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  let dataUnavailable = false;
  let nextCursor: string | null = null;
  let results: ReturnType<typeof mapSearchItem>[] = [];
  let facetValues: Array<{ count: number; label: string; value: string }> = [];

  try {
    if (dimension === "process" || dimension === "flow") {
      const input = { cursor, filters: {}, limit: 50, query: "", sort: "name_asc" as const };
      const page =
        dimension === "process"
          ? await searchPublicProcesses(input)
          : await searchPublicFlows(input);
      results = page.items.map((item) => mapSearchItem(item, locale));
      nextCursor = page.nextCursor;
    } else {
      const facets = await getPublicFacets({ filters: {}, kind: "all", query: "" });
      const expectedIds = dimension === "region" ? ["region", "geography"] : ["source", "database"];
      const group = facets.groups.find((candidate) =>
        expectedIds.some((id) => candidate.id.toLowerCase().includes(id)),
      );
      facetValues =
        group?.values.map((value) => ({
          count: value.count,
          label: localizedText(value.label, locale) ?? value.value,
          value: value.value,
        })) ?? [];
    }
  } catch (error) {
    if (!(error instanceof PortalDataError)) throw error;
    dataUnavailable = true;
  }

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-3">
        <Badge variant="outline">DIRECTORY / {dimension.toUpperCase()}</Badge>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          {t("title", { dimension })}
        </h1>
        <p className="text-muted-foreground leading-7">{t("description")}</p>
      </header>

      {dataUnavailable ? (
        <Alert>
          <AlertDescription>{searchT("unavailableDescription")}</AlertDescription>
        </Alert>
      ) : dimension === "process" || dimension === "flow" ? (
        <SearchResults
          items={results}
          labels={{
            collect: detail("collect"),
            compare: detail("compare"),
            copied: detail("citationCopied"),
            copyCitation: detail("copyCitation"),
            details: common("details"),
            emptyDescription: t("emptyDescription"),
            emptyTitle: t("emptyTitle"),
            metadataOnly: common("metadataOnly"),
            public: common("public"),
          }}
          locale={locale}
        />
      ) : facetValues.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {facetValues.map((value) => {
            const filterName = dimension === "region" ? "geo" : "source";
            return (
              <Card key={value.value} size="sm">
                <CardHeader>
                  <CardTitle>{value.label}</CardTitle>
                  <CardDescription>{value.count}</CardDescription>
                  <Button asChild variant="outline">
                    <Link
                      href={`${localePath(locale, "search")}?v=1&kind=process&${filterName}=${encodeURIComponent(value.value)}`}
                    >
                      {common("details")}
                    </Link>
                  </Button>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty className="min-h-80">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Rows3Icon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {nextCursor ? (
        <nav aria-label={common("next")} className="flex justify-end">
          <Button asChild variant="outline">
            <Link
              href={`${localePath(locale, `browse/${dimension}`)}?cursor=${encodeURIComponent(nextCursor)}`}
            >
              {common("next")}
            </Link>
          </Button>
        </nav>
      ) : null}
    </main>
  );
}
