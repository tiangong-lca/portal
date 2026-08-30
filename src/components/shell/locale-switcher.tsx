"use client";

import { LanguagesIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isPortalLocale, localeNames, locales, type PortalLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  currentLocale: PortalLocale;
  label: string;
};

export function LocaleSwitcher({ currentLocale, label }: LocaleSwitcherProps) {
  const pathname = usePathname();

  function switchLocale(nextLocale: string) {
    if (!isPortalLocale(nextLocale) || nextLocale === currentLocale) return;
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    window.location.assign(`${segments.join("/")}${window.location.search}${window.location.hash}`);
  }

  return (
    <div className="flex items-center gap-2">
      <LanguagesIcon aria-hidden="true" />
      <Select onValueChange={switchLocale} value={currentLocale}>
        <SelectTrigger aria-label={label} className="min-h-11 min-w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {locales.map((locale) => (
              <SelectItem key={locale} value={locale}>
                {localeNames[locale]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <noscript>
        <span className="flex flex-wrap gap-2">
          {locales
            .filter((locale) => locale !== currentLocale)
            .map((locale) => (
              <a href={`/${locale}`} hrefLang={locale} key={locale}>
                {localeNames[locale]}
              </a>
            ))}
        </span>
      </noscript>
    </div>
  );
}
