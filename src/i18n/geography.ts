import locationNames from "./locations.generated.json";
import type { PortalLocale } from "./routing";

const names: Record<string, Partial<Record<PortalLocale, string>>> = locationNames;

/** This is a display lookup, never a filter-code or geography-precision rewrite. */
export function geographyName(
  code: string | null | undefined,
  locale: PortalLocale,
): string | undefined {
  if (!code?.trim() || code.trim().toUpperCase() === "NULL") return undefined;
  const key = code.trim().toUpperCase();
  return Object.hasOwn(names, key) ? names[key]?.[locale] : undefined;
}

export function formatGeographyCode(
  code: string | null | undefined,
  locale: PortalLocale,
): string | undefined {
  if (!code?.trim() || code.trim().toUpperCase() === "NULL") return undefined;
  const name = geographyName(code, locale);
  return name ? `${name} (${code.trim().toUpperCase()})` : code;
}
