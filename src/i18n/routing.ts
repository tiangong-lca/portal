import { defineRouting } from "next-intl/routing";

export const locales = ["zh-CN", "en"] as const;
export type PortalLocale = (typeof locales)[number];

export const defaultLocale: PortalLocale = "zh-CN";

export const routing = defineRouting({
  alternateLinks: false,
  defaultLocale,
  localeCookie: false,
  localeDetection: false,
  localePrefix: "always",
  locales,
});

export function isPortalLocale(value: string): value is PortalLocale {
  return locales.some((locale) => locale === value);
}

export function localePath(locale: PortalLocale, path = ""): string {
  const normalizedPath = path === "" || path === "/" ? "" : `/${path.replace(/^\/+/, "")}`;
  return `/${locale}${normalizedPath}`;
}
