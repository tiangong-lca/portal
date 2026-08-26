import { describe, expect, it } from "vitest";

import {
  isDatasetUuid,
  isExactDatasetRef,
  parseExactDatasetRef,
} from "@/features/catalog/exact-ref";

const historicalUuid = "00000000-0000-0000-0000-000000000000";

describe("Portal exact references", () => {
  it("matches the lowercase database UUID and strict version contract", () => {
    expect(isDatasetUuid(historicalUuid)).toBe(true);
    expect(isExactDatasetRef(`${historicalUuid}@01.00.000`)).toBe(true);
    expect(parseExactDatasetRef(`${historicalUuid}@01.00.000`)).toEqual({
      id: historicalUuid,
      version: "01.00.000",
    });
  });

  it("rejects versions or case that the server contract rejects", () => {
    expect(isExactDatasetRef(`${historicalUuid}@v1`)).toBe(false);
    expect(isExactDatasetRef("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA@01.00.000")).toBe(false);
  });
});
