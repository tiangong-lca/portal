import { describe, expect, it } from "vitest";

import { readR0CompatEnvironment } from "@/server/r0-compat/env";

describe("R0 compatibility environment", () => {
  it("is disabled safely when no upstream fixture is configured", () => {
    expect(readR0CompatEnvironment({})).toMatchObject({
      deploymentEnvironment: "local",
      deploymentSha: "local",
    });
  });

  it("does not treat the ordinary R1 publishable key as R0 fixture activation", () => {
    expect(
      readR0CompatEnvironment({
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_portal_preview_fixture_v1",
      }),
    ).toMatchObject({
      deploymentEnvironment: "local",
      deploymentSha: "local",
      publishableKey: "sb_publishable_portal_preview_fixture_v1",
    });
  });

  it("prefers immutable build evidence over a stale deployment setting", () => {
    const buildSha = "a".repeat(40);

    expect(
      readR0CompatEnvironment({
        PORTAL_BUILD_SHA: buildSha,
        PORTAL_DEPLOYMENT_SHA: "b".repeat(40),
      }),
    ).toMatchObject({ deploymentSha: buildSha });
  });

  it("rejects partial HMAC fixture configuration", () => {
    expect(() =>
      readR0CompatEnvironment({
        R0_COMPAT_EDGE_ENDPOINT: "https://example.supabase.co",
      }),
    ).toThrow("complete or entirely absent");
  });

  it("rejects non-HTTPS upstream origins", () => {
    expect(() =>
      readR0CompatEnvironment({
        R0_COMPAT_EDGE_ENDPOINT: "http://example.test",
        R0_COMPAT_KEY_ID: "test",
        R0_COMPAT_HMAC_SECRET: "test",
        SUPABASE_PUBLISHABLE_KEY: "test",
      }),
    ).toThrow("must use HTTPS");
  });
});
