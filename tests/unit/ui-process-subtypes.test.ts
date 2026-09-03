import { describe, expect, it } from "vitest";
import { localizeProcessSubtype } from "@/i18n/domain-vocabulary";
import { facetHref } from "@/features/catalog/search-links";
import { parsePortalSearchUrl } from "@/server/contracts/input";

describe("display-only Process subtype vocabulary", () => {
  it("uses the released companion product's four locale labels", () => {
    expect(localizeProcessSubtype("LCI result", "zh-CN")).toBe("LCI结果");
    expect(localizeProcessSubtype("lci result", "de")).toBe("Sachbilanzergebnis");
    expect(localizeProcessSubtype("lci result", "fr")).toBe("Résultat d’ICV");
    expect(localizeProcessSubtype("lci result", "en")).toBe("LCI result");
    expect(localizeProcessSubtype("Partly terminated system", "zh-CN")).toBe("部分终止系统");
    expect(localizeProcessSubtype("Avoided product system", "de")).toBe(
      "System vermiedener Produkte",
    );
  });
  it("handles the observed black-box aliases without rewriting custom source values", () => {
    for (const value of [
      "unit process, black box",
      "unit processes, black box",
      " Unit process, black box ",
    ])
      expect(localizeProcessSubtype(value, "zh-CN")).toBe("单元过程，黑箱");
    expect(localizeProcessSubtype("Custom source-defined type", "fr")).toBe(
      "Custom source-defined type",
    );
    expect(localizeProcessSubtype(undefined, "zh-CN")).toBeUndefined();
  });
  it("keeps wire filters unchanged when the label is localized", () => {
    const input = parsePortalSearchUrl({
      kind: "process",
      q: "electricity",
      subtype: "lci result",
    });
    const label = localizeProcessSubtype(input.filters.processSubtype, "zh-CN");
    const href = facetHref("zh-CN", input, "processSubtype", "lci result")!;
    expect(label).toBe("LCI结果");
    expect(new URL(href, "https://portal.example").searchParams.get("subtype")).toBe("lci result");
    expect(input.filters.processSubtype).toBe("lci result");
  });
});
