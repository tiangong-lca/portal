import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { localePath, type PortalLocale } from "@/i18n/routing";

import { LocaleSwitcher } from "./locale-switcher";
import { HeaderOffset } from "./header-offset";
import { NavigationLink } from "./navigation-link";
import { ThemeToggle } from "./theme-toggle";

type SiteHeaderProps = {
  locale: PortalLocale;
};

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const homeHref = localePath(locale);

  const links = [
    [localePath(locale, "search?v=1"), t("search"), t("searchCompact")],
    [localePath(locale, "browse/process"), t("browse"), t("browseCompact")],
    [localePath(locale, "methodology"), t("methodology"), t("methodologyCompact")],
    [localePath(locale, "collections"), t("collections"), t("collectionsCompact")],
  ] as const;

  return (
    <header className="bg-background sticky top-0 z-40 border-b" data-portal-header>
      <HeaderOffset />
      <a
        className="bg-primary text-primary-foreground focus-visible:ring-ring absolute -translate-y-full rounded-b-lg px-3 py-2 focus:translate-y-0 focus-visible:ring-3"
        href="#main-content"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link className="flex min-h-11 items-center gap-3" href={homeHref} prefetch={false}>
          <BrandLogo locale={locale} priority />
          <span className="flex min-w-0 flex-col">
            <span className="text-muted-foreground hidden text-xs leading-none sm:block">
              {t("productFamily")}
            </span>
            <span className="font-heading truncate text-sm font-semibold sm:text-base">
              {t("productName")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("brandName")}
          className="order-3 col-span-2 min-w-0 overflow-x-auto xl:order-none xl:col-span-1"
        >
          <ul className="grid grid-cols-4 gap-1 sm:flex sm:min-w-max sm:items-center">
            {links.map(([href, label, compactLabel]) => (
              <li key={href}>
                <NavigationLink
                  compactLabel={compactLabel}
                  href={href}
                  matchPrefix={
                    href === localePath(locale, "browse/process")
                      ? localePath(locale, "browse")
                      : undefined
                  }
                >
                  {label}
                </NavigationLink>
              </li>
            ))}
            <li aria-hidden="true" className="hidden xl:block">
              <Separator className="mx-1 h-5" orientation="vertical" />
            </li>
            <li className="hidden xl:block">
              <Button asChild className="min-h-11" size="lg" variant="ghost">
                <a href="https://lca.tiangong.earth">
                  {t("externalLca")}
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </Button>
            </li>
          </ul>
        </nav>

        <div className="order-2 ml-auto flex min-w-0 items-center gap-2 xl:order-none">
          <ThemeToggle
            labels={{
              dark: t("themeDark"),
              group: t("theme"),
              light: t("themeLight"),
              system: t("themeSystem"),
            }}
          />
          <LocaleSwitcher currentLocale={locale} label={t("language")} />
        </div>
      </div>
    </header>
  );
}
