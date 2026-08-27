import "server-only";

import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import { localePath } from "@/i18n/routing";
import { listPublicSitemapEntries } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

export type CatalogSitemapKind = "process" | "flow";

export type CatalogSitemapShardDescriptor = {
  id: number;
  startCursor: string | null;
};

type SitemapPage = Awaited<ReturnType<typeof listPublicSitemapEntries>>;
type SitemapEntry = SitemapPage["items"][number];
type SitemapPageLoader = (input: {
  cursor: string | null;
  kind: CatalogSitemapKind;
  limit: number;
}) => Promise<SitemapPage>;

type SitemapTraversalOptions = {
  maxShards: number;
  pageSize: number;
  shardSize: number;
};

const defaultTraversalOptions: SitemapTraversalOptions = {
  maxShards: 100,
  pageSize: 1000,
  shardSize: 49_000,
};

function siteUrl(path: string): string {
  return new URL(path, process.env.SITE_URL ?? "http://localhost:3000").toString();
}

function assertCursorProgress(
  nextCursor: string | null,
  itemCount: number,
  seenCursors: Set<string>,
): void {
  if (!nextCursor) return;
  if (itemCount === 0 || seenCursors.has(nextCursor)) {
    throw new PortalDataError("invalid_response");
  }
  seenCursors.add(nextCursor);
}

export async function discoverCatalogSitemapShards(
  kind: CatalogSitemapKind,
  loadPage: SitemapPageLoader = listPublicSitemapEntries,
  options: SitemapTraversalOptions = defaultTraversalOptions,
): Promise<CatalogSitemapShardDescriptor[]> {
  const shards: CatalogSitemapShardDescriptor[] = [{ id: 0, startCursor: null }];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let entriesInShard = 0;

  while (true) {
    const remaining = options.shardSize - entriesInShard;
    const page = await loadPage({ cursor, kind, limit: Math.min(options.pageSize, remaining) });
    if (page.items.length > remaining) throw new PortalDataError("invalid_response");
    entriesInShard += page.items.length;
    assertCursorProgress(page.nextCursor, page.items.length, seenCursors);

    if (!page.nextCursor) return shards;
    if (entriesInShard === options.shardSize) {
      if (shards.length >= options.maxShards) throw new PortalDataError("invalid_response");
      shards.push({ id: shards.length, startCursor: page.nextCursor });
      entriesInShard = 0;
    }
    cursor = page.nextCursor;
  }
}

export async function loadCatalogSitemapShard(
  kind: CatalogSitemapKind,
  descriptor: CatalogSitemapShardDescriptor,
  loadPage: SitemapPageLoader = listPublicSitemapEntries,
  options: SitemapTraversalOptions = defaultTraversalOptions,
): Promise<SitemapEntry[]> {
  const items: SitemapEntry[] = [];
  const seenCursors = new Set<string>();
  const seenEntries = new Set<string>();
  let cursor = descriptor.startCursor;

  while (items.length < options.shardSize) {
    const remaining = options.shardSize - items.length;
    const page = await loadPage({ cursor, kind, limit: Math.min(options.pageSize, remaining) });
    if (page.items.length > remaining) throw new PortalDataError("invalid_response");
    for (const item of page.items) {
      const key = `${item.key.kind}:${item.key.id}@${item.key.version}`;
      if (seenEntries.has(key)) throw new PortalDataError("invalid_response");
      seenEntries.add(key);
      items.push(item);
    }
    assertCursorProgress(page.nextCursor, page.items.length, seenCursors);
    if (!page.nextCursor || items.length === options.shardSize) return items;
    cursor = page.nextCursor;
  }

  return items;
}

const cachedManifest = {
  flow: unstable_cache(
    () => discoverCatalogSitemapShards("flow"),
    ["portal-catalog-sitemap-manifest", "flow", "v1"],
    { revalidate: 300, tags: ["portal:sitemap:flow"] },
  ),
  process: unstable_cache(
    () => discoverCatalogSitemapShards("process"),
    ["portal-catalog-sitemap-manifest", "process", "v1"],
    { revalidate: 300, tags: ["portal:sitemap:process"] },
  ),
};

function hasCatalogEnvironment(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export function catalogSitemapShardUrl(kind: CatalogSitemapKind, id: number): string {
  return siteUrl(`/catalog/${kind}/sitemap/${id}.xml`);
}

export async function catalogSitemapManifest(
  kind: CatalogSitemapKind,
): Promise<CatalogSitemapShardDescriptor[]> {
  if (!hasCatalogEnvironment()) return [{ id: 0, startCursor: null }];
  return cachedManifest[kind]();
}

export async function catalogSitemapShard(
  kind: CatalogSitemapKind,
  id: number,
): Promise<MetadataRoute.Sitemap | null> {
  if (!hasCatalogEnvironment()) return id === 0 ? [] : null;
  const manifest = await catalogSitemapManifest(kind);
  const descriptor = manifest.find((item) => item.id === id);
  if (!descriptor) return null;
  const items = await loadCatalogSitemapShard(kind, descriptor);

  return items.map((item) => {
    const path = `${item.key.kind}/${item.key.id}@${item.key.version}`;
    return {
      alternates: {
        languages: {
          en: siteUrl(localePath("en", path)),
          "zh-CN": siteUrl(localePath("zh-CN", path)),
        },
      },
      changeFrequency: "weekly" as const,
      lastModified: item.modifiedAt,
      priority: 0.8,
      url: siteUrl(localePath("zh-CN", path)),
    };
  });
}
