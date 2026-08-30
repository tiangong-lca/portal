export type CatalogSitemapKind = "process" | "flow";
export type CatalogSitemapPart = { partIndex: number; shardIndex: number };

export const catalogSitemapShardCount = 64;
export const catalogSitemapPartsPerShard = 4;

const shardSegmentPattern = /^(0|[1-9]|[1-5][0-9]|6[0-3])-(0|[1-3])\.xml$/u;
const shardSearchPattern = /^\?shard=(0|[1-9]|[1-5][0-9]|6[0-3])&part=(0|[1-3])$/u;

export function parseCatalogSitemapKind(value: string): CatalogSitemapKind | null {
  return value === "process" || value === "flow" ? value : null;
}

export function parseCatalogSitemapShardSegment(value: string): CatalogSitemapPart | null {
  const match = shardSegmentPattern.exec(value);
  if (!match) return null;

  const shardIndex = Number(match[1]);
  const partIndex = Number(match[2]);
  return Number.isSafeInteger(shardIndex) &&
    shardIndex >= 0 &&
    shardIndex < catalogSitemapShardCount &&
    Number.isSafeInteger(partIndex) &&
    partIndex >= 0 &&
    partIndex < catalogSitemapPartsPerShard
    ? { partIndex, shardIndex }
    : null;
}

export function parseCatalogSitemapShardSearch(search: string): CatalogSitemapPart | null {
  const match = shardSearchPattern.exec(search);
  return match ? { partIndex: Number(match[2]), shardIndex: Number(match[1]) } : null;
}

export function rootCatalogSitemapIndexPath(kind: CatalogSitemapKind): string {
  return `/catalog-${kind}-sitemap.xml`;
}

export function rootCatalogSitemapShardPath(
  kind: CatalogSitemapKind,
  shardIndex: number,
  partIndex: number,
): string {
  if (
    !Number.isSafeInteger(shardIndex) ||
    shardIndex < 0 ||
    shardIndex >= catalogSitemapShardCount ||
    !Number.isSafeInteger(partIndex) ||
    partIndex < 0 ||
    partIndex >= catalogSitemapPartsPerShard
  ) {
    throw new RangeError("Invalid catalog sitemap shard part");
  }
  return `${rootCatalogSitemapIndexPath(kind)}?shard=${shardIndex}&part=${partIndex}`;
}
