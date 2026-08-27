export type CatalogSitemapKind = "process" | "flow";

export const catalogSitemapShardCount = 64;

const shardSegmentPattern = /^(0|[1-9]|[1-5][0-9]|6[0-3])\.xml$/u;
const shardSearchPattern = /^\?shard=(0|[1-9]|[1-5][0-9]|6[0-3])$/u;

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

export function parseCatalogSitemapShardSearch(search: string): number | null {
  const match = shardSearchPattern.exec(search);
  return match ? Number(match[1]) : null;
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
  return `${rootCatalogSitemapIndexPath(kind)}?shard=${shardIndex}`;
}
