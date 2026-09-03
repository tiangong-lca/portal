import { describe, expect, it } from "vitest";
import { facetHref, hasCatalogQuery, searchParameters } from "@/features/catalog/search-links";
import { parsePortalSearchUrl } from "@/server/contracts/input";

describe("search refinement and directory entry", () => {
  it("distinguishes an untouched page from an explicit filter-only search", () => {
    expect(hasCatalogQuery(parsePortalSearchUrl({}))).toBe(false);
    expect(hasCatalogQuery(parsePortalSearchUrl({ kind: "flow" }))).toBe(false);
    expect(hasCatalogQuery(parsePortalSearchUrl({ geo: "cn" }))).toBe(true);
    expect(hasCatalogQuery(parsePortalSearchUrl({ source: "example" }))).toBe(true);
  });
  it("preserves meaningful filters while changing kind and drops only Process-specific subtype", () => {
    const state = parsePortalSearchUrl({
      q: "electricity",
      geo: "cn",
      source: "example",
      subtype: "unit process",
      access: "open",
      yearFrom: "2020",
      limit: "10",
    });
    const url = new URL(facetHref("en", state, "kind", "flow")!, "https://portal.example");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      kind: "flow",
      q: "electricity",
      geo: "cn",
      source: "example",
      access: "open",
      yearFrom: "2020",
      limit: "10",
    });
    expect(url.searchParams.has("subtype")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(searchParameters(state, null).get("subtype")).toBe("unit process");
  });
  it("never constructs an unsupported facet action", () => {
    const state = parsePortalSearchUrl({});
    expect(facetHref("en", state, "state", "20")).toBeNull();
    expect(facetHref("en", state, "kind", "private")).toBeNull();
    expect(facetHref("en", state, "access", "all")).toBeNull();
  });
});
