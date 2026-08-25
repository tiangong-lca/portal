import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const receiptSchema = z.object({
  assets: z.array(
    z.object({
      target: z.string(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/),
    }),
  ),
});

describe("reviewed brand assets", () => {
  it("match the checked-in SHA-256 receipt", () => {
    const receipt = receiptSchema.parse(
      JSON.parse(readFileSync(resolve(process.cwd(), "public/brand/sources.json"), "utf8")),
    );

    for (const asset of receipt.assets) {
      const bytes = readFileSync(resolve(process.cwd(), asset.target));
      const actual = createHash("sha256").update(bytes).digest("hex");

      expect(actual).toBe(asset.sha256);
    }
  });
});
