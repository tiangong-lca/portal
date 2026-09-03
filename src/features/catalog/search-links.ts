import type { PortalSearchUrlInput } from "@/server/contracts/input";
import { localePath, type PortalLocale } from "@/i18n/routing";

export function searchParameters(
  input: PortalSearchUrlInput,
  cursor: string | null = input.cursor,
): URLSearchParams {
  const p = new URLSearchParams({
    kind: input.kind,
    limit: String(input.limit),
    q: input.query,
    sort: input.sort,
    v: "1",
  });
  if (cursor) p.set("cursor", cursor);
  const fields = {
    access: input.filters.accessLevel,
    geo: input.filters.geography,
    classification: input.filters.classification,
    yearFrom: input.filters.referenceYearFrom,
    yearTo: input.filters.referenceYearTo,
    subtype: input.filters.processSubtype,
    source: input.filters.source,
  };
  for (const [key, value] of Object.entries(fields))
    if (value !== undefined) p.set(key, String(value));
  return p;
}

export function searchHref(
  locale: PortalLocale,
  input: PortalSearchUrlInput,
  cursor: string | null = input.cursor,
): string {
  return `${localePath(locale, "search")}?${searchParameters(input, cursor)}`;
}

export function facetHref(
  locale: PortalLocale,
  input: PortalSearchUrlInput,
  groupId: string,
  value: string,
): string | null {
  const p = searchParameters(input, null);
  const group = groupId.toLowerCase().replaceAll(/[^a-z]/gu, "");
  if (group === "kind" || group === "objecttype") {
    if (value !== "process" && value !== "flow") return null;
    p.set("kind", value);
    if (value === "flow") p.delete("subtype");
  } else if (group.includes("access")) {
    if (value !== "open" && value !== "metadata_only") return null;
    p.set("access", value);
  } else if (group.includes("geography") || group.includes("region")) p.set("geo", value);
  else if (group.includes("year")) {
    if (!/^\d{1,4}$/u.test(value)) return null;
    p.set("yearFrom", value);
    p.set("yearTo", value);
  } else if (group.includes("subtype")) {
    if (input.kind !== "process") return null;
    p.set("subtype", value);
  } else if (group.includes("source") || group.includes("database")) p.set("source", value);
  else if (group.includes("classification")) p.set("classification", value);
  else return null;
  return `${localePath(locale, "search")}?${p}`;
}

export function hasCatalogQuery(input: PortalSearchUrlInput): boolean {
  return Boolean(
    input.query ||
    input.cursor ||
    Object.values(input.filters).some((value) => value !== undefined),
  );
}
