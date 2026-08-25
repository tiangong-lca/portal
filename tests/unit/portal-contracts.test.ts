import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import {
  portalContractSchemas,
  publicDatasetEnvelopeSchema,
  publicExchangePageSchema,
  publicPublicationSchema,
  publicSourceSchema,
  publishedLciaPageSchema,
} from "@/server/contracts/portal";

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
    expect(portalContractSchemas.exchanges.parse(fixture.exchanges).rows).toHaveLength(1);
    expect(portalContractSchemas.facets.parse(fixture.facets).groups).toHaveLength(1);
    expect(portalContractSchemas.versions.parse(fixture.versions).items).toHaveLength(1);
    expect(portalContractSchemas.sitemap.parse(fixture.sitemap).items).toHaveLength(1);
    expect(portalContractSchemas.lcia.parse(fixture.lcia).rows).toHaveLength(1);
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
