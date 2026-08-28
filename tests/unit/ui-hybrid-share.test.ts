import { describe, expect, it } from "vitest";

import {
  decodeHybridQueryFragment,
  encodeHybridQueryFragment,
} from "@/features/catalog/hybrid-share";

describe("Hybrid query disclosure fragments", () => {
  it("round-trips only the exact bounded public request after explicit encoding", () => {
    const request = {
      schemaVersion: "portal.hybrid-search-request.v1" as const,
      kind: "process" as const,
      query: "  low-carbon electricity  ",
      filters: { geography: " CN " },
      limit: 10,
    };
    const fragment = encodeHybridQueryFragment(request);
    expect(fragment).toMatch(/^#hybrid=/u);
    expect(fragment).not.toContain("low-carbon electricity");
    expect(decodeHybridQueryFragment(fragment)).toEqual({
      ...request,
      query: "low-carbon electricity",
      filters: { geography: "cn" },
    });
  });

  it("rejects overlong or malformed disclosed queries", () => {
    expect(() =>
      encodeHybridQueryFragment({
        schemaVersion: "portal.hybrid-search-request.v1",
        kind: "process",
        query: "界".repeat(512),
        filters: {},
        limit: 10,
      }),
    ).toThrow("hybrid_share_fragment_limit");
    expect(() => decodeHybridQueryFragment("#hybrid=not*base64")).toThrow(
      "fragment_encoding_invalid",
    );
  });
});
