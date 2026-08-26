import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  contentSecurityPolicyHeader,
} from "@/config/content-security-policy";

describe("brand asset CSP", () => {
  it("adds only the exact reviewed HTTPS origin when configured", () => {
    const policy = buildContentSecurityPolicy({
      brandAssetOrigin: "https://assets.example.com",
      isDevelopment: false,
    });
    expect(policy).toContain("img-src 'self' blob: data: https://assets.example.com");
    expect(policy).not.toContain("https://*");
    expect(policy).not.toContain("unsafe-inline");
    expect(contentSecurityPolicyHeader(policy, true)).toEqual({
      key: "Content-Security-Policy",
      value: policy,
    });
  });

  it("does not expand image sources when no remote brand origin is configured", () => {
    expect(buildContentSecurityPolicy({ isDevelopment: false })).toContain(
      "img-src 'self' blob: data:;",
    );
  });
});
