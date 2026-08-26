import { describe, expect, it } from "vitest";

import { localizedText } from "@/features/catalog/map-public-data";

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
});
