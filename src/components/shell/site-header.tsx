import { SearchIcon } from "lucide-react";
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

  const links = [
    [localePath(locale), t("home")],
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
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex min-h-11 items-center gap-3" href={localePath(locale)}>
          <BrandLogo locale={locale} priority />
          <span className="hidden flex-col sm:flex">
            <span className="font-heading text-sm font-semibold">{t("brandName")}</span>
            <span className="text-muted-foreground font-mono text-[0.68rem] tracking-[0.16em] uppercase">
              {t("evidenceLabel")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("brandName")}
          className="order-3 w-full overflow-x-auto md:order-none md:ml-5 md:w-auto"
        >
          <ul className="flex min-w-max items-center gap-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Button asChild size="lg" variant="ghost">
                  <Link href={href}>{label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild aria-label={t("search")} size="icon-lg" variant="outline">
            <Link href={localePath(locale, "search?v=1")}>
              <SearchIcon aria-hidden="true" />
            </Link>
          </Button>
          <ThemeToggle
            labels={{
              dark: t("themeDark"),
              group: t("theme"),
              light: t("themeLight"),
              system: t("themeSystem"),
            }}
          />
          <LocaleSwitcher currentLocale={locale} label={t("switchToEnglish")} />
        </div>
      </div>
      <Separator />
    </header>
  );
}
