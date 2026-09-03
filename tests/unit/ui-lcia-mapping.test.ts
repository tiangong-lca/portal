import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { mapLciaPage } from "@/features/catalog/map-public-data";
import { publishedLciaPageSchema } from "@/server/contracts/portal";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";

describe("LCIA presentation mapping", () => {
  it("preserves every numeric context field", () => {
    const result = mapLciaPage(publishedLciaPageSchema.parse(fixture.lcia), "en", processRef);

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.publication).toMatchObject({
      packageId: "55555555-5555-5555-5555-555555555555",
      publicationId: "44444444-4444-4444-4444-444444444444",
    });
    expect(result.rows[0]).toMatchObject({
      functionalUnit: "1 kWh",
      geography: "China (CN) · Country",
      processRef,
      referenceYear: "2024",
      value: "12.5",
    });
  });

  it("returns unavailable for a mismatched exact Process instead of borrowing page context", () => {
    const page = publishedLciaPageSchema.parse(fixture.lcia);
    expect(mapLciaPage(page, "en", "99999999-9999-9999-9999-999999999999@01.00.000")).toEqual({
      status: "unavailable",
    });
  });

  it("rejects a response mode that is not the requested detail projection", () => {
    const page = publishedLciaPageSchema.parse({
      ...fixture.lcia,
      mode: "processes_one_impact",
    });
    expect(mapLciaPage(page, "en", processRef)).toEqual({ status: "unavailable" });
  });

  it("keeps raw numeric context binding strict when localized labels would look identical", () => {
    const page = publishedLciaPageSchema.parse(fixture.lcia);
    const row = page.rows[0]!;
    page.rows.push({
      ...row,
      impact: { ...row.impact, id: "another-impact" },
      geography: { ...row.geography, code: "cn" },
    });
    expect(mapLciaPage(page, "en", processRef)).toEqual({ status: "unavailable" });
  });
});
