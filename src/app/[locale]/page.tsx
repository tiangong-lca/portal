import { ArrowRightIcon, DatabaseIcon, MapPinIcon, SearchIcon, ShapesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { isPortalLocale, localePath } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

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

  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const browseCoordinates = [
    { href: "browse/process", icon: DatabaseIcon, label: t("browseProcess"), token: "PROCESS" },
    { href: "browse/flow", icon: ShapesIcon, label: t("browseFlow"), token: "FLOW" },
    { href: "browse/region", icon: MapPinIcon, label: t("browseRegion"), token: "REGION" },
    { href: "browse/source", icon: DatabaseIcon, label: t("browseSource"), token: "SOURCE" },
  ] as const;

  return (
    <main className="portal-ledger flex-1" id="main-content">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)] lg:items-end">
          <div className="flex max-w-4xl flex-col gap-6">
            <p className="text-primary font-mono text-xs font-semibold tracking-[0.18em] uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground max-w-3xl text-base leading-7 sm:text-lg sm:leading-8">
              {t("description")}
            </p>
          </div>

          <div className="evidence-rail flex flex-col gap-5">
            {[common("public"), common("exactVersion"), common("footerBoundary")].map((label) => (
              <div className="flex flex-col gap-1" key={label}>
                <span className="font-mono text-xs tracking-[0.12em] uppercase">{label}</span>
                <span className="text-muted-foreground text-sm">{common("footerEvidence")}</span>
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
                  <Button size="lg" type="submit">
                    {t("searchButton")}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <p className="text-muted-foreground text-xs">{t("privacy")}</p>
            </form>
          </search>
        </section>

        <section aria-labelledby="browse-heading" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold" id="browse-heading">
                {t("browseTitle")}
              </h2>
              <p className="text-muted-foreground">{t("browseDescription")}</p>
            </div>
            <Badge className="sm:ml-auto" variant="outline">
              R1 · LEXICAL
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {browseCoordinates.map(({ href, icon: Icon, label, token }) => (
              <Card key={href} size="sm">
                <CardHeader>
                  <Icon aria-hidden="true" />
                  <CardTitle>{label}</CardTitle>
                  <CardDescription className="font-mono text-xs tracking-[0.12em]">
                    {token}
                  </CardDescription>
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
          <Alert>
            <DatabaseIcon aria-hidden="true" />
            <AlertTitle>{t("scaleTitle")}</AlertTitle>
            <AlertDescription>{t("scaleUnavailable")}</AlertDescription>
          </Alert>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("advancedTitle")}</CardTitle>
              <CardDescription>{t("advancedDescription")}</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </main>
  );
}
