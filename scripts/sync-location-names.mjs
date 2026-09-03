import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

import { format } from "prettier";

const nextRoot = process.argv[2];
if (!nextRoot)
  throw new Error("Usage: node scripts/sync-location-names.mjs <next-repository> [--check]");
const sourceCommit = "82fd0bf6b96fbeca7c178d71832b475ebbdc07f3";
const sources = {
  en: "public/locations/ILCDLocations.b65e8d45de515726.min.json.gz",
  "zh-CN": "public/locations/ILCDLocations.c406f6ae5aa30ef1_zh.min.json.gz",
  de: "public/locations/ILCDLocations.7048b701b1dfacb4_de.min.json.gz",
  fr: "public/locations/ILCDLocations.3fdd552e27dca310_fr.min.json.gz",
};
const names = {};
const receipts = [];
for (const [locale, path] of Object.entries(sources)) {
  const compressed = execFileSync("git", ["-C", nextRoot, "show", `${sourceCommit}:${path}`]);
  const rows = JSON.parse(gunzipSync(compressed)).ILCDLocations.location;
  const seen = new Set();
  for (const row of rows) {
    const code = row["@value"];
    const name = row["#text"];
    if (typeof code !== "string" || typeof name !== "string" || !code || !name || seen.has(code)) {
      throw new Error(`Invalid or duplicate ${locale} reference location`);
    }
    seen.add(code);
    if (code === "NULL") continue;
    names[code] ??= {};
    names[code][locale] = name;
  }
  receipts.push({
    locale,
    path,
    bytes: compressed.byteLength,
    sha256: createHash("sha256").update(compressed).digest("hex"),
    count: seen.size,
  });
}
const ordered = Object.fromEntries(
  Object.entries(names).sort(([left], [right]) => left.localeCompare(right, "en")),
);
const payloads = {
  "src/i18n/locations.generated.json": ordered,
  "src/i18n/locations.receipt.json": {
    sourceRepository: "linancn/tiangong-lca-next",
    sourceCommit,
    sources: receipts,
  },
};
for (const [path, value] of Object.entries(payloads)) {
  const body = await format(JSON.stringify(value), { parser: "json" });
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== body) throw new Error(`Location snapshot drift: ${path}`);
  } else writeFileSync(path, body);
}
console.log(
  `Verified ${Object.keys(ordered).length} ILCD location codes from Next ${sourceCommit}.`,
);
