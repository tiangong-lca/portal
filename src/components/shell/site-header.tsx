import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { localePath, type PortalLocale } from "@/i18n/routing";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

type SiteHeaderProps = {
  locale: PortalLocale;
};

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const homeHref = localePath(locale);

  const links = [
    [localePath(locale, "search?v=1"), t("search")],
    [localePath(locale, "browse/process"), t("browse")],
    [localePath(locale, "methodology"), t("methodology")],
    [localePath(locale, "collections"), t("collections")],
  ] as const;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 border-b backdrop-blur">
      <a
        className="bg-primary text-primary-foreground focus-visible:ring-ring absolute -translate-y-full rounded-b-lg px-3 py-2 focus:translate-y-0 focus-visible:ring-3"
        href="#main-content"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8">
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
          className="order-3 col-span-2 w-full overflow-x-auto lg:order-none lg:col-span-1 lg:ml-4"
        >
          <ul className="flex min-w-max items-center gap-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Button asChild className="min-h-11" size="lg" variant="ghost">
                  <Link href={href}>{label}</Link>
                </Button>
              </li>
            ))}
            <li aria-hidden="true" className="hidden lg:block">
              <Separator className="mx-1 h-5" orientation="vertical" />
            </li>
            <li>
              <Button asChild className="min-h-11" size="lg" variant="link">
                <a href="https://lca.tiangong.earth">
                  {t("externalLca")}
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </Button>
            </li>
          </ul>
        </nav>

        <div className="order-2 ml-auto flex min-w-0 items-center gap-2 lg:order-none">
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
