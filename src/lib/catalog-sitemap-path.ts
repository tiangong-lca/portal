export type CatalogSitemapKind = "process" | "flow";

export type RootCatalogSitemapRoute =
  | { kind: CatalogSitemapKind; type: "index" }
  | { kind: CatalogSitemapKind; type: "shard"; shardIndex: number };

export const catalogSitemapRewriteHeader = "x-portal-sitemap-rewrite";
export const catalogSitemapRewriteValue = "root-v1";
export const catalogSitemapShardCount = 64;

const indexPathPattern = /^\/catalog-(process|flow)-sitemap\.xml$/u;
const shardPathPattern = /^\/catalog-(process|flow)-sitemap-(0|[1-9]|[1-5][0-9]|6[0-3])\.xml$/u;
const shardSegmentPattern = /^(0|[1-9]|[1-5][0-9]|6[0-3])\.xml$/u;

export function parseCatalogSitemapKind(value: string): CatalogSitemapKind | null {
  return value === "process" || value === "flow" ? value : null;
}

export function parseCatalogSitemapShardSegment(value: string): number | null {
  const match = shardSegmentPattern.exec(value);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed < catalogSitemapShardCount
    ? parsed
    : null;
}

export function parseRootCatalogSitemapPath(pathname: string): RootCatalogSitemapRoute | null {
  const indexMatch = indexPathPattern.exec(pathname);
  if (indexMatch) {
    return { kind: indexMatch[1] as CatalogSitemapKind, type: "index" };
  }

  const shardMatch = shardPathPattern.exec(pathname);
  if (!shardMatch) return null;
  return {
    kind: shardMatch[1] as CatalogSitemapKind,
    type: "shard",
    shardIndex: Number(shardMatch[2]),
  };
}

export function isRootCatalogSitemapCandidate(pathname: string): boolean {
  return pathname.startsWith("/catalog-") && pathname.endsWith(".xml");
}

export function rootCatalogSitemapIndexPath(kind: CatalogSitemapKind): string {
  return `/catalog-${kind}-sitemap.xml`;
}

export function rootCatalogSitemapShardPath(kind: CatalogSitemapKind, shardIndex: number): string {
  if (
    !Number.isSafeInteger(shardIndex) ||
    shardIndex < 0 ||
    shardIndex >= catalogSitemapShardCount
  ) {
    throw new RangeError("Invalid catalog sitemap shard index");
  }
  return `/catalog-${kind}-sitemap-${shardIndex}.xml`;
}

export function internalCatalogSitemapPath(route: RootCatalogSitemapRoute): string {
  return route.type === "index"
    ? `/internal/catalog-sitemap/${route.kind}/index`
    : `/internal/catalog-sitemap/${route.kind}/${route.shardIndex}.xml`;
}
