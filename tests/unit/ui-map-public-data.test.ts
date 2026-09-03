import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { localizedText, mapDataset, mapSearchItem } from "@/features/catalog/map-public-data";
import { publicDatasetEnvelopeSchema, publicSearchPageSchema } from "@/server/contracts/portal";
import { formatGeographyCode } from "@/i18n/geography";

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

  it("maps real dataset names and keeps Flow properties distinct from Process products", () => {
    const flow = mapDataset(
      publicDatasetEnvelopeSchema.parse(fixture.datasetFlow),
      "en",
      "https://portal.example/en/flow/example",
    );
    expect(flow).toMatchObject({
      originalName: "Carbon dioxide",
      casNumber: "124-38-9",
      flowType: "Elementary flow",
      referenceFlowProperty: "Mass",
      capabilities: { exchangesVisible: false, lciaVisible: false },
    });
    expect(flow.referenceProduct).toBeUndefined();
    expect(flow.geography).toBeUndefined();
    expect(flow.functionalUnit).toBeUndefined();
    const process = mapDataset(
      publicDatasetEnvelopeSchema.parse(fixture.datasetProcess),
      "en",
      "https://portal.example/en/process/example",
    );
    expect(process.originalName).toBe("Electricity, medium voltage");
    expect(process.geography).toBe("China (CN) · Country");
    expect(process.citation).toContain("Data provider: TianGong.");
  });

  it("uses the released ILCD display names without rewriting unknown codes or their precision", () => {
    expect(formatGeographyCode("cn", "zh-CN")).toBe("中国 (CN)");
    expect(formatGeographyCode("CN-AH", "en")).toContain("Anhui");
    expect(formatGeographyCode("custom-area", "fr")).toBe("custom-area");
    expect(formatGeographyCode(null, "en")).toBeUndefined();
  });
});
