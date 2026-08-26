import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { themeInitIntegrity } from "@/app/theme-integrity.generated";

describe("theme bootstrap integrity", () => {
  it("matches the exact public response bytes", async () => {
    const bytes = await readFile("public/brand/theme-init.js");
    const actual = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
    expect(themeInitIntegrity).toBe(actual);
  });
});
