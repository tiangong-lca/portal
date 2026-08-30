import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { localizedText, mapSearchItem } from "@/features/catalog/map-public-data";
import { publicSearchPageSchema } from "@/server/contracts/portal";

describe("localized public text", () => {
  it("ignores empty values and returns undefined when nothing is displayable", () => {
    expect(
      localizedText(
        [
          { language: "zh-CN", value: "" },
          { language: "en", value: "   " },
        ],
        "zh-CN",
      ),
    ).toBeUndefined();
  });

  it("marks a fallback language instead of presenting it as localized source text", () => {
    expect(localizedText([{ language: "en", value: "  Electricity  " }], "zh-CN")).toBe(
      "Electricity [en]",
    );
  });

  it("maps the complete evidence-backed Database search-card context", () => {
    const item = publicSearchPageSchema.parse(fixture.search).items[0]!;
    expect(mapSearchItem(item, "en")).toMatchObject({
      functionalUnit: "1 kWh",
      match: "Name",
      quality: "Reviewed",
      referenceProduct: "Electricity",
      source: "TianGong",
      technology: "Grid mix",
    });
  });
});
