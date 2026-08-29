import { describe, expect, it } from "vitest";

import { resolvePortalBuildSha } from "@/config/deployment-build";

const currentSha = "a".repeat(40);
const staleSha = "b".repeat(40);

describe("Portal build deployment evidence", () => {
  it("prefers the checked-out git commit over a stale configured value", () => {
    expect(
      resolvePortalBuildSha(
        { NODE_ENV: "production", PORTAL_DEPLOYMENT_SHA: staleSha },
        () => `${currentSha}\n`,
      ),
    ).toBe(currentSha);
  });

  it("falls back to a valid configured commit when git metadata is unavailable", () => {
    expect(
      resolvePortalBuildSha(
        { NODE_ENV: "production", PORTAL_DEPLOYMENT_SHA: staleSha },
        () => undefined,
      ),
    ).toBe(staleSha);
  });

  it("does not publish invalid production deployment evidence", () => {
    expect(
      resolvePortalBuildSha(
        { NODE_ENV: "production", PORTAL_DEPLOYMENT_SHA: "main with secret" },
        () => "not-a-commit",
      ),
    ).toBe("unknown");
  });

  it("keeps local builds identifiable without git metadata", () => {
    expect(resolvePortalBuildSha({ NODE_ENV: "test" }, () => undefined)).toBe("local");
  });
});
