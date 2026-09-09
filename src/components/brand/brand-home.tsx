import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Database,
  MapPin,
  Search,
  Shapes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { localizedText } from "@/features/catalog/map-public-data";
import { localePath, type PortalLocale } from "@/i18n/routing";
import type { PublicCatalogSummary } from "@/server/contracts/portal";
import { BrandSculpture } from "./brand-sculpture";

import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/noto-sans-sc";
import "./brand-home.css";

export type BrandHomeProps = {
  locale: PortalLocale;
  summary: PublicCatalogSummary | null;
  /** The same sculpture may be prepared before mounting in frozen Storybook previews. */
  sculpture?: ReactNode;
};

/**
 * The public brand entrance, with server-rendered search, catalog and product navigation.
 * @import import { BrandHome } from "@/components/brand/brand-home";
 */
export async function BrandHome({ locale, summary, sculpture }: BrandHomeProps) {
  const [t, catalog] = await Promise.all([
    getTranslations({ locale, namespace: "BrandHome" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);
  const count = new Intl.NumberFormat(locale);
  const latest = summary?.latestModifiedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(summary.latestModifiedAt),
      )
    : null;
  const dimensions = [
    ["process", "browseProcess", "browseProcessDescription", Database],
    ["flow", "browseFlow", "browseFlowDescription", Shapes],
    ["region", "browseRegion", "browseRegionDescription", MapPin],
    ["source", "browseSource", "browseSourceDescription", Database],
  ] as const;

  return (
    <main id="main-content" className="brand-home" lang={locale}>
      <section className="brand-hero brand-container" aria-labelledby="brand-title">
        <div className="brand-hero-copy">
          <p className="brand-eyebrow">
            <span aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 id="brand-title">
            <span>
              {t("titleLead")}
              {locale === "zh-CN" ? "" : " "}
            </span>
            <span className="brand-title-accent">{t("titleFocus")}</span>
          </h1>
          <p className="brand-hero-description">{t("description")}</p>
          <div className="brand-hero-actions">
            <Button asChild size="lg">
              <a href="#explore">
                {t("explore")}
                <ArrowDown data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="https://lca.tiangong.earth">
                {t("platformAction")}
                <ArrowUpRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <p className="brand-hero-note">{t("platformDestination")}</p>
        </div>
        <div className="brand-hero-art">{sculpture ?? <BrandSculpture locale={locale} />}</div>
        <div className="brand-hero-index" aria-hidden="true">
          <span>01 / 03</span>
          <span>{t("heroIndex")}</span>
          <ArrowDown />
        </div>
      </section>

      <section
        className="brand-catalog-section"
        id="explore"
        tabIndex={-1}
        aria-labelledby="explore-title"
      >
        <div className="brand-container">
          <div className="brand-section-heading">
            <div>
              <p className="brand-kicker">02 / {t("catalogKicker")}</p>
              <h2 id="explore-title">{t("catalogTitle")}</h2>
            </div>
            <p>{t("catalogDescription")}</p>
          </div>
          <search className="brand-search" aria-label={catalog("searchLabel")}>
            <form action={localePath(locale, "search")} method="get">
              <input name="v" type="hidden" value="1" />
              <label className="sr-only" htmlFor="home-search-query">
                {catalog("searchLabel")}
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  autoComplete="off"
                  id="home-search-query"
                  name="q"
                  maxLength={512}
                  placeholder={catalog("searchPlaceholder")}
                  type="search"
                />
                <InputGroupAddon align="inline-end">
                  <Button type="submit">
                    {catalog("searchButton")}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <p className="brand-search-privacy">{catalog("privacy")}</p>
            </form>
          </search>
          <nav className="brand-catalog-index" aria-label={catalog("browseTitle")}>
            {dimensions.map(([dimension, label, description, Icon]) => (
              <Link
                href={localePath(locale, `browse/${dimension}`)}
                key={dimension}
                className="brand-catalog-link"
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{catalog(label)}</strong>
                  <span>{catalog(description)}</span>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <div className="brand-catalog-summary" aria-label={catalog("scaleTitle")}>
            <div>
              <h3>{catalog("scaleTitle")}</h3>
              <p>
                {latest ? catalog("latestModified", { date: latest }) : catalog("scaleDescription")}
              </p>
            </div>
            {summary ? (
              <dl>
                {(
                  [
                    ["processCount", summary.counts.process],
                    ["flowCount", summary.counts.flow],
                    ["totalCount", summary.counts.total],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt>{catalog(label)}</dt>
                    <dd>{count.format(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>{catalog("scaleUnavailable")}</p>
            )}
          </div>
          {summary && summary.examples.length > 0 && (
            <div className="brand-examples">
              <p>{catalog("examplesTitle")}</p>
              <div>
                {summary.examples.map((example) => {
                  const params = new URLSearchParams({
                    kind: example.datasetKind,
                    q: example.query,
                    v: "1",
                  });
                  const label = localizedText(example.label, locale) ?? example.query;
                  const kind =
                    example.queryKind === "uuid"
                      ? "exampleUuid"
                      : example.queryKind === "cas"
                        ? "exampleCas"
                        : "exampleClass";
                  return (
                    <Link
                      key={`${example.queryKind}:${example.query}`}
                      href={`${localePath(locale, "search")}?${params}`}
                      prefetch={false}
                    >
                      <span>{catalog(kind)}</span>
                      {label}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="brand-understanding brand-container"
        aria-labelledby="understanding-title"
      >
        <div className="brand-section-heading">
          <div>
            <p className="brand-kicker">03 / {t("understandingKicker")}</p>
            <h2 id="understanding-title">{t("understandingTitle")}</h2>
          </div>
          <p>{t("understandingDescription")}</p>
        </div>
        <div className="brand-understanding-grid">
          <div className="brand-reading">
            <div className="brand-reading-title">
              <span className="brand-section-symbol" aria-hidden="true">
                ↗
              </span>
              <h3>{catalog("useTitle")}</h3>
            </div>
            <dl>
              {(
                [
                  ["railMetadataTitle", "railMetadataBody"],
                  ["railVersionTitle", "railVersionBody"],
                  ["railValuesTitle", "railValuesBody"],
                ] as const
              ).map(([title, description], index) => (
                <div key={title}>
                  <dt>
                    <span aria-hidden="true">0{index + 1}</span>
                    {catalog(title)}
                  </dt>
                  <dd>{catalog(description)}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="outline">
              <Link href={localePath(locale, "methodology")}>
                {catalog("useLink")}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <div className="brand-platform">
            <div className="brand-platform-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="brand-kicker">Tiangong LCA</p>
            <h3>{t("platformTitle")}</h3>
            <p>{t("platformDescription")}</p>
            <div>
              <Button asChild size="lg">
                <a href="https://lca.tiangong.earth">
                  {t("platformAction")}
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
              <p className="brand-platform-note">{t("platformDestination")}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
