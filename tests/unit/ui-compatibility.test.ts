import { describe, expect, it } from "vitest";

import { evaluateCompatibility, type CompareCandidate } from "@/features/compare/compatibility";

const base: CompareCandidate = {
  allocationMethod: "physical",
  cutoffRule: "1%",
  functionalUnit: "1 kg",
  geography: "CN",
  geographyPrecision: "country",
  lciaMethodRef: "11111111-1111-1111-1111-111111111111@01.00.000",
  modelingApproach: "attributional",
  name: "Candidate",
  publicationRef: "22222222-2222-2222-2222-222222222222",
  ref: "00000000-0000-0000-0000-000000000000@01.00.000",
  referenceUnit: "kg",
  referenceYear: "2024",
  technology: "route-a",
};

describe("deterministic comparison", () => {
  it("supports two to four complete candidates and aligns values only with matching units", () => {
    const result = evaluateCompatibility([
      { ...base, lciaValue: { unit: "kg CO2-Eq", value: "1.0" } },
      {
        ...base,
        lciaValue: { unit: "kg CO2-Eq", value: "2.0" },
        ref: "33333333-3333-3333-3333-333333333333@01.00.000",
      },
    ]);
    expect(result.status).toBe("direct");
    expect(result.canAlignLcia).toBe(true);
  });

  it("fails closed when core units conflict or boundary evidence is absent", () => {
    expect(
      evaluateCompatibility([
        base,
        { ...base, ref: "33333333-3333-3333-3333-333333333333@01.00.000", referenceUnit: "kWh" },
      ]).status,
    ).toBe("incompatible");
    expect(
      evaluateCompatibility([
        base,
        {
          ...base,
          cutoffRule: undefined,
          ref: "33333333-3333-3333-3333-333333333333@01.00.000",
        },
      ]).status,
    ).toBe("insufficient");
  });
});
