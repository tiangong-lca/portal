import { describe, expect, it } from "vitest";

import { parseCompareIds, parseImpactCategoryId } from "@/features/compare/input";

const references = [
  "11111111-1111-1111-1111-111111111111@01.00.000",
  "22222222-2222-2222-2222-222222222222@01.00.000",
  "33333333-3333-3333-3333-333333333333@01.00.000",
  "44444444-4444-4444-4444-444444444444@01.00.000",
  "55555555-5555-5555-5555-555555555555@01.00.000",
] as const;

describe("compare URL input", () => {
  it("deduplicates exact references and enforces the four-member bound", () => {
    expect(parseCompareIds([...references, references[0]])).toEqual(references.slice(0, 4));
  });

  it("matches the server UTF-16 bound and rejects controls before signed LCIA", () => {
    expect(parseImpactCategoryId("climate-change")).toBe("climate-change");
    expect(parseImpactCategoryId("😀".repeat(256))).toBe("😀".repeat(256));
    expect(parseImpactCategoryId(`${"😀".repeat(256)}x`)).toBeNull();
    expect(parseImpactCategoryId("climate\u0000change")).toBeNull();
  });
});
