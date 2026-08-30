import { describe, expect, it } from "vitest";

import de from "@/i18n/messages/de.json";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import zhCn from "@/i18n/messages/zh-CN.json";
import {
  formatDatasetCitation,
  localizeGeographyPrecision,
  localizeMatchReasons,
  localizeReviewStatus,
} from "@/i18n/domain-vocabulary";
import { localeNames, localePath, locales } from "@/i18n/routing";

function scalarPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    scalarPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("four-locale public product contract", () => {
  it("keeps one complete independent dictionary topology", () => {
    expect(locales).toEqual(["zh-CN", "en", "de", "fr"]);
    expect(localeNames).toEqual({ "zh-CN": "中文", en: "English", de: "Deutsch", fr: "Français" });
    const canonicalPaths = scalarPaths(en).sort();
    for (const messages of [zhCn, de, fr]) {
      expect(scalarPaths(messages).sort()).toEqual(canonicalPaths);
    }
    expect(de.Home.title).not.toBe(en.Home.title);
    expect(fr.Home.title).not.toBe(en.Home.title);
    expect(zhCn.Home.title).not.toBe(en.Home.title);
  });

  it("builds stable locale paths and localizes controlled domain vocabulary", () => {
    expect(localePath("de", "process/id@01.00.000")).toBe("/de/process/id@01.00.000");
    expect(localePath("fr", "methodology")).toBe("/fr/methodology");
    expect(localizeGeographyPrecision("unknown", "de")).toBe("Raumbezug nicht angegeben");
    expect(localizeMatchReasons(["exact_id", "name"], "fr")).toBe("Identifiant exact · Nom");
    expect(localizeReviewStatus("Not reviewed", "zh-CN")).toBe("尚未审核");
  });

  it("formats a stable citation in every interface language", () => {
    const input = {
      name: "Electricity",
      ref: "11111111-1111-1111-1111-111111111111@01.00.000",
      url: "https://portal.example/en/process/example",
    };
    expect(formatDatasetCitation("en", input)).toContain("dataset: Electricity");
    expect(formatDatasetCitation("de", input)).toContain("Datensatz: Electricity");
    expect(formatDatasetCitation("fr", input)).toContain("jeu de données : Electricity");
    expect(formatDatasetCitation("zh-CN", input)).toContain("数据集：Electricity");
  });
});
