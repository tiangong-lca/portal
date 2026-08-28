import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import {
  portalContractSchemas,
  publicCatalogSummarySchema,
  publicDatasetEnvelopeSchema,
  publicExchangePageSchema,
  publicPublicationSchema,
  publicSitemapManifestSchema,
  publicSitemapShardSchema,
  publicSourceSchema,
  publishedLciaPageSchema,
} from "@/server/contracts/portal";

function uuidForOrdinal(ordinal: number): string {
  return `00000000-0000-4000-8000-${ordinal.toString(16).padStart(12, "0")}`;
}

describe("Portal public DTO contracts", () => {
  it("accepts fixtures for every Database Portal schema", () => {
    expect(portalContractSchemas.common.publicDatasetKey.parse(fixture.datasetProcess.key)).toEqual(
      fixture.datasetProcess.key,
    );
    expect(portalContractSchemas.dataset.parse(fixture.datasetProcess).metadata.kind).toBe(
      "process",
    );
    expect(portalContractSchemas.dataset.parse(fixture.datasetFlow).metadata.kind).toBe("flow");
    expect(portalContractSchemas.search.parse(fixture.search).items).toHaveLength(1);
    expect(portalContractSchemas.catalogSummary.parse(fixture.catalogSummary).counts.total).toBe(3);
    expect(portalContractSchemas.exchanges.parse(fixture.exchanges).rows).toHaveLength(1);
    expect(portalContractSchemas.facets.parse(fixture.facets).groups).toHaveLength(1);
    expect(portalContractSchemas.versions.parse(fixture.versions).items).toHaveLength(1);
    expect(portalContractSchemas.sitemap.parse(fixture.sitemap).items).toHaveLength(1);
    expect(
      portalContractSchemas.sitemapManifest.parse(fixture.sitemapManifest).shards,
    ).toHaveLength(64);
    expect(portalContractSchemas.sitemapShard.parse(fixture.sitemapShard).items).toHaveLength(1);
    expect(portalContractSchemas.lcia.parse(fixture.lcia).rows).toHaveLength(1);
  });

  it("requires complete search-card context and exact bounded catalog-summary evidence", () => {
    const missingContext = structuredClone(fixture.search);
    Reflect.deleteProperty(missingContext.items[0]!, "context");
    expect(portalContractSchemas.search.safeParse(missingContext).success).toBe(false);

    const pollutedContext = structuredClone(fixture.search);
    Object.assign(pollutedContext.items[0]!.context, { owner: "private-user" });
    expect(portalContractSchemas.search.safeParse(pollutedContext).success).toBe(false);

    expect(
      publicCatalogSummarySchema.safeParse({
        ...fixture.catalogSummary,
        counts: { ...fixture.catalogSummary.counts, total: 4 },
      }).success,
    ).toBe(false);
    expect(
      publicCatalogSummarySchema.safeParse({
        ...fixture.catalogSummary,
        examples: [fixture.catalogSummary.examples[0], fixture.catalogSummary.examples[0]],
      }).success,
    ).toBe(false);
    expect(
      publicCatalogSummarySchema.safeParse({
        ...fixture.catalogSummary,
        examples: [{ ...fixture.catalogSummary.examples[0], label: [] }],
      }).success,
    ).toBe(false);
    expect(
      publicCatalogSummarySchema.safeParse({
        ...fixture.catalogSummary,
        serviceLocator: "private://catalog-projection",
      }).success,
    ).toBe(false);
  });

  it("enforces the fixed unique manifest and bounded unique shard contracts", () => {
    expect(
      publicSitemapManifestSchema.safeParse({
        ...fixture.sitemapManifest,
        shards: fixture.sitemapManifest.shards.slice(0, 63),
      }).success,
    ).toBe(false);

    const duplicateManifest = structuredClone(fixture.sitemapManifest);
    duplicateManifest.shards[1]!.shardCursor = duplicateManifest.shards[0]!.shardCursor;
    expect(publicSitemapManifestSchema.safeParse(duplicateManifest).success).toBe(false);
    expect(
      publicSitemapManifestSchema.safeParse({
        ...fixture.sitemapManifest,
        shards: [
          { ...fixture.sitemapManifest.shards[0], maxItems: 4095 },
          ...fixture.sitemapManifest.shards.slice(1),
        ],
      }).success,
    ).toBe(false);
    expect(
      publicSitemapManifestSchema.safeParse({
        ...fixture.sitemapManifest,
        shards: [
          { ...fixture.sitemapManifest.shards[0], bucket: 0 },
          ...fixture.sitemapManifest.shards.slice(1),
        ],
      }).success,
    ).toBe(false);

    const duplicateIdentity = {
      ...fixture.sitemapShard,
      items: [
        fixture.sitemapShard.items[0],
        {
          ...fixture.sitemapShard.items[0],
          key: { ...fixture.sitemapShard.items[0]!.key, version: "02.00.000" },
        },
      ],
    };
    expect(publicSitemapShardSchema.safeParse(duplicateIdentity).success).toBe(false);
    expect(
      publicSitemapShardSchema.safeParse({
        ...fixture.sitemapShard,
        shardCursor: "cursor with spaces",
      }).success,
    ).toBe(false);

    const overflowItems = Array.from({ length: 4097 }, (_, index) => ({
      key: {
        kind: "process" as const,
        id: uuidForOrdinal(index + 1),
        version: "01.00.000",
      },
      modifiedAt: "2026-08-25T12:00:00Z",
    }));
    expect(
      publicSitemapShardSchema.safeParse({ ...fixture.sitemapShard, items: overflowItems }).success,
    ).toBe(false);
  });

  it("fails closed on root and nested property pollution", () => {
    expect(
      publicDatasetEnvelopeSchema.safeParse({ ...fixture.datasetProcess, user_id: "private" })
        .success,
    ).toBe(false);

    const polluted = structuredClone(fixture.exchanges);
    Object.assign(polluted.rows[0]!, { objectPath: "private/results.json" });
    expect(publicExchangePageSchema.safeParse(polluted).success).toBe(false);
  });

  it("keeps domain quantities as canonical decimal strings", () => {
    const parsed = publishedLciaPageSchema.parse(fixture.lcia);
    expect(parsed.rows[0]?.value).toBe("12.5");
    expect(typeof parsed.rows[0]?.value).toBe("string");

    for (const invalidValue of [
      "1.0",
      "01",
      "-0",
      "1e3",
      "123456789012345678901234567890123456789",
    ])
      expect(
        publicExchangePageSchema.safeParse({
          ...fixture.exchanges,
          rows: [{ ...fixture.exchanges.rows[0], amount: invalidValue }],
        }).success,
      ).toBe(false);
  });

  it("rejects service locators and duplicate publication method identities", () => {
    expect(
      publicSourceSchema.safeParse({
        ...fixture.datasetProcess.metadata.source,
        licenseUrl: "https://example.com/license?token=secret",
      }).success,
    ).toBe(false);

    const publication = fixture.datasetProcess.publication!;
    expect(
      publicPublicationSchema.safeParse({
        ...publication,
        lciaMethods: [publication.lciaMethods[0], publication.lciaMethods[0]],
      }).success,
    ).toBe(false);
  });
});
