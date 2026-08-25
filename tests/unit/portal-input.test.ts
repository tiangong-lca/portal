import { describe, expect, it } from "vitest";

import {
  parseExactDatasetReference,
  parsePortalSearchUrl,
  PortalInputError,
  publishedLciaInputSchema,
} from "@/server/contracts/input";

const processReference = {
  id: "11111111-1111-1111-1111-111111111111",
  version: "01.00.000",
};

describe("Portal deterministic input parsing", () => {
  it("normalizes known URL state and ignores unknown keys", () => {
    const parsed = parsePortalSearchUrl(
      new URLSearchParams({
        v: "1",
        q: "  Electricity  ",
        kind: "process",
        access: "open",
        geo: " CN ",
        yearFrom: "2020",
        yearTo: "2026",
        subtype: "Unit Process",
        sort: "modified_desc",
        cursor: "eyJ2IjoxfQ",
        limit: "50",
        state: "20",
        actor: "forged",
      }),
    );

    expect(parsed).toEqual({
      kind: "process",
      query: "Electricity",
      filters: {
        accessLevel: "open",
        geography: "cn",
        referenceYearFrom: 2020,
        referenceYearTo: 2026,
        processSubtype: "unit process",
      },
      sort: "modified_desc",
      cursor: "eyJ2IjoxfQ",
      limit: 50,
    });
    expect("actor" in parsed).toBe(false);
    expect("state" in parsed).toBe(false);
  });

  it("uses safe defaults for malformed bounded parameters", () => {
    expect(
      parsePortalSearchUrl(
        new URLSearchParams({
          kind: "private",
          sort: "sql",
          cursor: "not a cursor!",
          limit: "999",
        }),
      ),
    ).toEqual({
      kind: "process",
      query: "",
      filters: {},
      sort: "relevance",
      cursor: null,
      limit: 20,
    });
  });

  it("turns oversized URL input into a controlled input error", () => {
    expect(() => parsePortalSearchUrl(new URLSearchParams({ q: "界".repeat(513) }))).toThrow(
      PortalInputError,
    );
    expect(() => parsePortalSearchUrl(new URLSearchParams({ unknown: "x".repeat(8192) }))).toThrow(
      "8 KB",
    );
  });

  it("parses exact references without accepting latest aliases", () => {
    expect(
      parseExactDatasetReference("process", "11111111-1111-1111-1111-111111111111@01.00.000"),
    ).toEqual({ kind: "process", ...processReference });
    expect(() => parseExactDatasetReference("process", processReference.id)).toThrow(
      PortalInputError,
    );
  });

  it("enforces LCIA mode context and unique exact Process references", () => {
    expect(
      publishedLciaInputSchema.parse({
        mode: "process_all_impacts",
        processRefs: [processReference],
      }),
    ).toMatchObject({ impactCategoryId: null, cursor: null, limit: 20 });

    expect(
      publishedLciaInputSchema.safeParse({
        mode: "process_all_impacts",
        processRefs: [processReference, processReference],
      }).success,
    ).toBe(false);
    expect(
      publishedLciaInputSchema.safeParse({
        mode: "processes_one_impact",
        processRefs: [processReference],
      }).success,
    ).toBe(false);
  });
});
