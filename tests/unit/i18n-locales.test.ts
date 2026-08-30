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

function scalarValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.values(value).flatMap(scalarValues);
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
    expect(zhCn.Home.title).toBe("查找可用于生命周期评估的数据");
    expect(en.Home.title).toBe("Find data for life cycle assessment");
    expect(de.Home.title).toBe("Daten für Ökobilanzen finden");
    expect(fr.Home.title).toBe("Trouver des données pour l’analyse du cycle de vie");
    expect(en.Common.externalLca).toBe("TianGong LCA platform");
    expect(en.Common.externalLcaAction).toBe("Open the LCA platform");
    expect("footerBoundary" in en.Common).toBe(false);
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

  it("keeps implementation and release-stage vocabulary out of public copy", () => {
    const forbidden =
      /\b(?:R0|R1|R2|BFF|HTTP|POST|GET|LOCALSTORAGE|telemetry|façade)\b|证据台账|evidence ledger/iu;
    for (const messages of [zhCn, en, de, fr]) {
      expect(scalarValues(messages).filter((value) => forbidden.test(value))).toEqual([]);
    }
  });
});
