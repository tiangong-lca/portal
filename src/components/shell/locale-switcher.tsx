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
    <Button asChild size="lg" variant="ghost">
      <a
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
        {label}
      </a>
    </Button>
  );
}
