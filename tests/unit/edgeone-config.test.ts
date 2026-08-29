import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("EdgeOne deployment configuration", () => {
  it("uses the current Cloud Functions duration and region fields", () => {
    const configuration = JSON.parse(
      readFileSync(`${process.cwd()}/edgeone.json`, "utf8"),
    ) as Record<string, unknown>;
    const cloudFunctions = configuration.cloudFunctions as Record<string, unknown>;

    expect(cloudFunctions).toMatchObject({
      maxDuration: 30,
      regions: { overseas: ["na-ashburn"] },
    });
    expect(cloudFunctions).not.toHaveProperty("nodejs");
    expect(cloudFunctions).not.toHaveProperty("overseasRegions");
  });
});
