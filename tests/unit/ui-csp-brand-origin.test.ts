import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  contentSecurityPolicyHeader,
} from "@/config/content-security-policy";

describe("brand asset CSP", () => {
  it("adds only the exact reviewed HTTPS origin when configured", () => {
    const policy = buildContentSecurityPolicy({
      allowFrameworkInline: false,
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
    expect(
      buildContentSecurityPolicy({ allowFrameworkInline: false, isDevelopment: false }),
    ).toContain("img-src 'self' blob: data:;");
  });

  it("keeps the public performance profile enforcing without unsafe-eval", () => {
    const policy = buildContentSecurityPolicy({
      allowFrameworkInline: true,
      isDevelopment: false,
    });
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  });
});
