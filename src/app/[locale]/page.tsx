import { ArrowRightIcon, DatabaseIcon, MapPinIcon, SearchIcon, ShapesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { localizedText } from "@/features/catalog/map-public-data";
import { isPortalLocale, localePath } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import type { PublicCatalogSummary } from "@/server/contracts/portal";
import { getPublicCatalogSummary } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

export const revalidate = 300;

async function readCatalogSummary(): Promise<PublicCatalogSummary | null> {
  try {
    return await getPublicCatalogSummary();
  } catch (error) {
    if (error instanceof PortalDataError) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Home" });

  return localizedMetadata({ locale, title: t("title"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, common, summary] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Common" }),
    readCatalogSummary(),
  ]);
  const browseCoordinates = [
    {
      description: t("browseProcessDescription"),
      href: "browse/process",
      icon: DatabaseIcon,
      label: t("browseProcess"),
    },
    {
      description: t("browseFlowDescription"),
      href: "browse/flow",
      icon: ShapesIcon,
      label: t("browseFlow"),
    },
    {
      description: t("browseRegionDescription"),
      href: "browse/region",
      icon: MapPinIcon,
      label: t("browseRegion"),
    },
    {
      description: t("browseSourceDescription"),
      href: "browse/source",
      icon: DatabaseIcon,
      label: t("browseSource"),
    },
  ] as const;
  const countFormatter = new Intl.NumberFormat(locale);
  const latestModified = summary?.latestModifiedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(summary.latestModifiedAt),
      )
    : null;

  return (
    <main className="portal-ledger flex-1" id="main-content">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)] lg:items-end">
          <div className="flex max-w-4xl min-w-0 flex-col gap-6">
            <p className="text-primary font-mono text-xs font-semibold tracking-[0.18em] uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance break-words sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground max-w-3xl text-base leading-7 sm:text-lg sm:leading-8">
              {t("description")}
            </p>
          </div>

          <div className="evidence-rail flex min-w-0 flex-col gap-5">
            {[
              [t("railMetadataTitle"), t("railMetadataBody")],
              [t("railVersionTitle"), t("railVersionBody")],
              [t("railValuesTitle"), t("railValuesBody")],
            ].map(([label, description]) => (
              <div className="flex flex-col gap-1" key={label}>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-muted-foreground text-sm">{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="home-search-heading"
          className="bg-card rounded-2xl border p-4 sm:p-6 lg:p-8"
        >
          <h2 className="sr-only" id="home-search-heading">
            {t("searchLabel")}
          </h2>
          <search>
            <form
              action={localePath(locale, "search")}
              className="flex flex-col gap-3"
              method="get"
            >
              <input name="v" type="hidden" value="1" />
              <label className="sr-only" htmlFor="home-search-query">
                {t("searchLabel")}
              </label>
              <InputGroup className="min-h-14">
                <InputGroupAddon>
                  <SearchIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  autoComplete="off"
                  id="home-search-query"
                  maxLength={512}
                  name="q"
                  placeholder={t("searchPlaceholder")}
                  type="search"
                />
                <InputGroupAddon align="inline-end">
                  <Button aria-label={t("searchButton")} size="lg" type="submit">
                    <span className="hidden sm:inline">{t("searchButton")}</span>
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <p className="text-muted-foreground text-xs">{t("privacy")}</p>
            </form>
          </search>
        </section>

        <section aria-labelledby="browse-heading" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold" id="browse-heading">
                {t("browseTitle")}
              </h2>
              <p className="text-muted-foreground">{t("browseDescription")}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {browseCoordinates.map(({ description, href, icon: Icon, label }) => (
              <Card key={href} size="sm">
                <CardHeader>
                  <Icon aria-hidden="true" />
                  <CardTitle>{label}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                  <CardAction>
                    <Button asChild aria-label={label} size="icon-sm" variant="ghost">
                      <Link href={localePath(locale, href)}>
                        <ArrowRightIcon aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2">
          {summary ? (
            <Card className="md:row-span-2">
              <CardHeader className="border-b">
                <DatabaseIcon aria-hidden="true" />
                <CardTitle>{t("scaleTitle")}</CardTitle>
                <CardDescription>{t("scaleDescription")}</CardDescription>
                <CardAction>
                  <span className="text-muted-foreground text-xs">{t("refreshCadence")}</span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-4">
                  {[
                    { label: t("processCount"), value: summary.counts.process },
                    { label: t("flowCount"), value: summary.counts.flow },
                    { label: t("totalCount"), value: summary.counts.total },
                  ].map(({ label, value }) => (
                    <div className="flex min-w-0 flex-col gap-1" key={label}>
                      <dt className="text-muted-foreground font-mono text-xs tracking-[0.08em] uppercase">
                        {label}
                      </dt>
                      <dd className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
                        {countFormatter.format(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {latestModified ? (
                  <p className="text-muted-foreground mt-5 font-mono text-xs">
                    {t("latestModified", { date: latestModified })}
                  </p>
                ) : null}
              </CardContent>
              {summary.examples.length > 0 ? (
                <CardFooter className="flex-col items-stretch gap-3">
                  <p className="font-mono text-xs font-semibold tracking-[0.08em] uppercase">
                    {t("examplesTitle")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {summary.examples.map((example) => {
                      const exampleLabel = localizedText(example.label, locale) ?? example.query;
                      const exampleKind =
                        example.queryKind === "uuid"
                          ? t("exampleUuid")
                          : example.queryKind === "cas"
                            ? t("exampleCas")
                            : t("exampleClass");
                      const parameters = new URLSearchParams({
                        kind: example.datasetKind,
                        q: example.query,
                        v: "1",
                      });
                      return (
                        <Button
                          asChild
                          key={`${example.queryKind}:${example.query}`}
                          size="sm"
                          variant="outline"
                        >
                          <Link
                            href={`${localePath(locale, "search")}?${parameters.toString()}`}
                            prefetch={false}
                          >
                            <span>{exampleKind}</span>
                            <span className="max-w-48 truncate">{exampleLabel}</span>
                            <ArrowRightIcon data-icon="inline-end" />
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </CardFooter>
              ) : null}
            </Card>
          ) : (
            <Alert>
              <DatabaseIcon aria-hidden="true" />
              <AlertTitle>{t("scaleTitle")}</AlertTitle>
              <AlertDescription>{t("scaleUnavailable")}</AlertDescription>
            </Alert>
          )}
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("advancedTitle")}</CardTitle>
              <CardDescription>{t("advancedDescription")}</CardDescription>
              <CardAction>
                <Button asChild size="sm" variant="outline">
                  <a href="https://lca.tiangong.earth">{common("externalAdvanced")}</a>
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </section>
      </div>
    </main>
  );
}
