"use client";

import { LanguagesIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { PortalLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  currentLocale: PortalLocale;
  label: string;
};

export function LocaleSwitcher({ currentLocale, label }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const nextLocale: PortalLocale = currentLocale === "zh-CN" ? "en" : "zh-CN";
  const fallbackHref = `/${nextLocale}`;

  return (
    <Button asChild className="size-[44px] p-0 sm:w-auto sm:px-2.5" size="lg" variant="ghost">
      <a
        aria-label={label}
        href={fallbackHref}
        hrefLang={nextLocale}
        onClick={(event) => {
          event.preventDefault();
          const segments = pathname.split("/");
          segments[1] = nextLocale;
          window.location.assign(
            `${segments.join("/")}${window.location.search}${window.location.hash}`,
          );
        }}
      >
        <LanguagesIcon data-icon="inline-start" />
        <span className="hidden sm:inline">{label}</span>
      </a>
    </Button>
  );
}
