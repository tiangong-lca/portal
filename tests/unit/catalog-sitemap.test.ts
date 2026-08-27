import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (loader: () => unknown) => loader }));

import { discoverCatalogSitemapShards, loadCatalogSitemapShard } from "@/lib/catalog-sitemap";
import { renderSitemapIndex, renderSitemapUrlSet } from "@/lib/sitemap-xml";

const options = { maxShards: 10, pageSize: 2, shardSize: 3 };

function entry(index: number) {
  return {
    key: {
      id: `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
      kind: "process" as const,
      version: "01.00.000",
    },
    modifiedAt: "2026-08-27T00:00:00Z",
  };
}

function pageLoader(entries: ReturnType<typeof entry>[]) {
  return async ({ cursor, limit }: { cursor: string | null; limit: number }) => {
    const offset = cursor ? Number(cursor) : 0;
    const items = entries.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < entries.length ? nextOffset.toString() : null,
      schemaVersion: "portal.public-sitemap-page.v1" as const,
    };
  };
}

describe("catalog sitemap sharding", () => {
  it("discovers deterministic shard cursors and loads every entry exactly once", async () => {
    const entries = Array.from({ length: 7 }, (_, index) => entry(index));
    const loadPage = pageLoader(entries);
    const shards = await discoverCatalogSitemapShards("process", loadPage, options);

    expect(shards).toEqual([
      { id: 0, startCursor: null },
      { id: 1, startCursor: "3" },
      { id: 2, startCursor: "6" },
    ]);

    const loaded = (
      await Promise.all(
        shards.map((descriptor) =>
          loadCatalogSitemapShard("process", descriptor, loadPage, options),
        ),
      )
    ).flat();
    expect(loaded).toEqual(entries);
  });

  it("fails closed when a cursor does not advance", async () => {
    const item = entry(0);
    await expect(
      discoverCatalogSitemapShards(
        "process",
        async () => ({
          items: [item],
          nextCursor: "stuck",
          schemaVersion: "portal.public-sitemap-page.v1",
        }),
        options,
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("renders escaped sitemap indexes and localized URL sets", () => {
    expect(renderSitemapIndex(["https://example.test/a?x=1&y=2"])).toContain(
      "https://example.test/a?x=1&amp;y=2",
    );
    const urlSet = renderSitemapUrlSet([
      {
        alternates: {
          languages: {
            en: "https://example.test/en/process/a",
            "zh-CN": "https://example.test/zh-CN/process/a",
          },
        },
        lastModified: "2026-08-27T00:00:00Z",
        url: "https://example.test/zh-CN/process/a",
      },
    ]);
    expect(urlSet).toContain("<urlset");
    expect(urlSet).toContain('hreflang="en"');
    expect(urlSet).toContain('hreflang="zh-CN"');
  });
});
