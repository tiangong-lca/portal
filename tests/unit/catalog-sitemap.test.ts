import { describe, expect, it, vi } from "vitest";

import {
  assertCatalogSitemapXmlWithinLimit,
  CatalogSitemapError,
  catalogSitemapFailureCacheControl,
  catalogSitemapSharedCacheControl,
  catalogSitemapShardCount,
  createCatalogSitemapIndexResponse,
  createRootCatalogSitemapResponse,
  createCatalogSitemapShardResponse,
  maximumCatalogSitemapItems,
  maximumCatalogSitemapXmlBytes,
  parseCatalogSitemapShardSegment,
  readCatalogSitemapCacheControl,
  readCatalogSitemapSiteOrigin,
  renderCatalogSitemapShard,
  type CatalogSitemapDependencies,
} from "@/lib/catalog-sitemap";
import {
  parseCatalogSitemapShardSearch,
  rootCatalogSitemapIndexPath,
  rootCatalogSitemapShardPath,
} from "@/lib/catalog-sitemap-path";

const manifest = {
  schemaVersion: "portal.public-sitemap-manifest.v1" as const,
  shards: Array.from({ length: catalogSitemapShardCount }, (_, index) => ({
    shardCursor: `cursor-${index}`,
    maxItems: 4096 as const,
  })),
};

const processItem = {
  key: {
    kind: "process" as const,
    id: "11111111-1111-1111-1111-111111111111",
    version: "01.00.000",
  },
  modifiedAt: "2026-08-27T00:00:00Z",
};
const flowItem = {
  key: {
    kind: "flow" as const,
    id: "22222222-2222-2222-2222-222222222222",
    version: "01.00.000",
  },
  modifiedAt: "2026-08-27T00:00:00Z",
};

function dependencies(
  overrides: Partial<CatalogSitemapDependencies> = {},
): CatalogSitemapDependencies {
  return {
    environment: {
      SITE_URL: "https://portal.example",
      PORTAL_SITEMAP_CACHE_MODE: "shared-300",
    },
    loadManifest: vi.fn<CatalogSitemapDependencies["loadManifest"]>(async () => manifest),
    loadShard: vi.fn<CatalogSitemapDependencies["loadShard"]>(async ({ shardCursor }) => ({
      schemaVersion: "portal.public-sitemap-shard.v1" as const,
      shardCursor,
      items: [flowItem, processItem],
    })),
    ...overrides,
  };
}

describe("catalog sitemap Route Handler domain", () => {
  it("renders a fixed 64-entry sitemap index without exposing opaque cursors", async () => {
    const fixture = dependencies();
    const response = await createCatalogSitemapIndexResponse("process", fixture);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe(catalogSitemapSharedCacheControl);
    expect(body.match(/<sitemap>/gu)).toHaveLength(64);
    expect(body).toContain("https://portal.example/catalog-process-sitemap.xml?shard=0");
    expect(body).toContain("https://portal.example/catalog-process-sitemap.xml?shard=63");
    expect(body).not.toContain("cursor-");
    expect(fixture.loadManifest).toHaveBeenCalledTimes(1);
    expect(fixture.loadShard).not.toHaveBeenCalled();
  });

  it("passes the selected manifest cursor byte-for-byte and filters mixed shards by kind", async () => {
    const fixture = dependencies();
    const response = await createCatalogSitemapShardResponse("process", "7.xml", fixture);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(catalogSitemapSharedCacheControl);
    expect(fixture.loadShard).toHaveBeenCalledWith({ shardCursor: "cursor-7" });
    expect(body.match(/<url>/gu)).toHaveLength(2);
    expect(body.match(/<loc>/gu)).toHaveLength(2);
    expect(body).toContain(`/zh-CN/process/${processItem.key.id}@${processItem.key.version}`);
    expect(body).toContain(`/en/process/${processItem.key.id}@${processItem.key.version}`);
    expect(body).toContain('hreflang="zh-CN"');
    expect(body).toContain('hreflang="en"');
    expect(body).not.toContain(flowItem.key.id);
    expect(body).not.toContain("cursor-7");
  });

  it("rejects non-canonical local route values before any upstream call", async () => {
    const fixture = dependencies();
    const invalidSegments = ["-1.xml", "64.xml", "01.xml", "1.0.xml", "cursor-7", "7"];

    const invalidKind = await createCatalogSitemapIndexResponse("private", fixture);
    expect(invalidKind.status).toBe(404);
    expect(invalidKind.headers.get("cache-control")).toBe(catalogSitemapFailureCacheControl);
    expect(invalidKind.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    for (const segment of invalidSegments) {
      expect(parseCatalogSitemapShardSegment(segment)).toBeNull();
      const response = await createCatalogSitemapShardResponse("process", segment, fixture);
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe(catalogSitemapFailureCacheControl);
    }

    expect(fixture.loadManifest).not.toHaveBeenCalled();
    expect(fixture.loadShard).not.toHaveBeenCalled();
  });

  it("returns a generic no-store 503 for missing configuration and upstream failures", async () => {
    const missingConfiguration = dependencies({ environment: {} });
    const missingResponse = await createCatalogSitemapIndexResponse(
      "process",
      missingConfiguration,
    );
    expect(missingResponse.status).toBe(503);
    expect(missingResponse.headers.get("cache-control")).toBe(catalogSitemapFailureCacheControl);
    expect(missingResponse.headers.get("retry-after")).toBe("60");
    expect(await missingResponse.text()).toBe("Sitemap temporarily unavailable\n");
    expect(missingConfiguration.loadManifest).not.toHaveBeenCalled();

    const upstreamFailure = dependencies({
      loadManifest: vi.fn<CatalogSitemapDependencies["loadManifest"]>(async () => {
        throw new Error("private upstream detail");
      }),
    });
    const upstreamResponse = await createCatalogSitemapIndexResponse("flow", upstreamFailure);
    expect(upstreamResponse.status).toBe(503);
    expect(await upstreamResponse.text()).not.toContain("private upstream detail");
  });

  it("fails closed when the shard cursor echo or latest-identity uniqueness drifts", async () => {
    const mismatch = dependencies({
      loadShard: vi.fn<CatalogSitemapDependencies["loadShard"]>(async () => ({
        schemaVersion: "portal.public-sitemap-shard.v1" as const,
        shardCursor: "different-cursor",
        items: [processItem],
      })),
    });
    expect((await createCatalogSitemapShardResponse("process", "0.xml", mismatch)).status).toBe(
      503,
    );

    expect(() =>
      renderCatalogSitemapShard("process", "https://portal.example", [
        processItem,
        { ...processItem, key: { ...processItem.key, version: "02.00.000" } },
      ]),
    ).toThrow(CatalogSitemapError);
  });

  it("enforces the 4096-item and strict sub-5-MiB UTF-8 XML limits", () => {
    const boundaryItems = Array.from({ length: maximumCatalogSitemapItems }, (_, index) => ({
      key: {
        kind: "process" as const,
        id: `00000000-0000-0000-0000-${index.toString(16).padStart(12, "0")}`,
        version: "01.00.000",
      },
      modifiedAt: "2026-08-27T00:00:00Z",
    }));
    const boundaryXml = renderCatalogSitemapShard(
      "process",
      "https://portal.example",
      boundaryItems,
    );
    expect(boundaryXml.match(/<url>/gu)).toHaveLength(maximumCatalogSitemapItems * 2);
    expect(new TextEncoder().encode(boundaryXml).byteLength).toBeLessThan(
      maximumCatalogSitemapXmlBytes,
    );
    expect(() =>
      renderCatalogSitemapShard("process", "https://portal.example", [
        ...boundaryItems,
        { ...processItem, key: { ...processItem.key, id: "ffffffff-ffff-ffff-ffff-ffffffffffff" } },
      ]),
    ).toThrow(CatalogSitemapError);
    expect(
      assertCatalogSitemapXmlWithinLimit("x".repeat(maximumCatalogSitemapXmlBytes - 1)),
    ).toHaveLength(maximumCatalogSitemapXmlBytes - 1);
    expect(() =>
      assertCatalogSitemapXmlWithinLimit("x".repeat(maximumCatalogSitemapXmlBytes)),
    ).toThrow(CatalogSitemapError);
  });

  it("accepts only an HTTPS or loopback origin-only SITE_URL", () => {
    expect(readCatalogSitemapSiteOrigin({ SITE_URL: "https://portal.example" })).toBe(
      "https://portal.example",
    );
    expect(readCatalogSitemapSiteOrigin({ SITE_URL: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
    for (const invalid of [
      undefined,
      "http://portal.example",
      "https://user:secret@portal.example",
      "https://portal.example/path",
      "https://portal.example?query=1",
    ]) {
      expect(() => readCatalogSitemapSiteOrigin({ SITE_URL: invalid })).toThrow(
        CatalogSitemapError,
      );
    }
  });

  it("defaults to no-store and enables shared caching only on a proven non-Vercel target", async () => {
    expect(readCatalogSitemapCacheControl({})).toBe("no-store");
    expect(readCatalogSitemapCacheControl({ PORTAL_SITEMAP_CACHE_MODE: "shared-300" })).toBe(
      catalogSitemapSharedCacheControl,
    );
    expect(() =>
      readCatalogSitemapCacheControl({
        PORTAL_SITEMAP_CACHE_MODE: "shared-300",
        VERCEL: "1",
      }),
    ).toThrow(CatalogSitemapError);
    expect(() =>
      readCatalogSitemapCacheControl({ PORTAL_SITEMAP_CACHE_MODE: "unbounded" }),
    ).toThrow(CatalogSitemapError);

    const noStoreFixture = dependencies({
      environment: { SITE_URL: "https://portal.example" },
    });
    const response = await createCatalogSitemapIndexResponse("process", noStoreFixture);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("maps only canonical root-level index and shard paths", () => {
    expect(rootCatalogSitemapIndexPath("process")).toBe("/catalog-process-sitemap.xml");
    expect(rootCatalogSitemapShardPath("flow", 63)).toBe("/catalog-flow-sitemap.xml?shard=63");
    expect(parseCatalogSitemapShardSearch("?shard=0")).toBe(0);
    expect(parseCatalogSitemapShardSearch("?shard=63")).toBe(63);
    for (const invalid of ["?shard=01", "?shard=64", "?shard=1.0", "?shard=0&bust=1"]) {
      expect(parseCatalogSitemapShardSearch(invalid)).toBeNull();
    }
  });

  it("rejects root route query variants before upstream work", async () => {
    const fixture = dependencies();
    const invalid = await createRootCatalogSitemapResponse(
      "process",
      new Request("https://portal.example/catalog-process-sitemap.xml?shard=01"),
      fixture,
    );
    expect(invalid.status).toBe(404);
    expect(invalid.headers.get("cache-control")).toBe("no-store");
    expect(fixture.loadManifest).not.toHaveBeenCalled();
    expect(fixture.loadShard).not.toHaveBeenCalled();
  });
});
