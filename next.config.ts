import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { readBrandConfig } from "./src/config/brand";
import {
  buildContentSecurityPolicy,
  contentSecurityPolicyHeader,
} from "./src/config/content-security-policy";

const isDevelopment = process.env.NODE_ENV !== "production";
const enforceContentSecurityPolicy = process.env.PORTAL_CSP_MODE === "enforce";
const brandConfig = readBrandConfig(process.env);
const contentSecurityPolicy = buildContentSecurityPolicy({
  brandAssetOrigin: brandConfig.assetOrigin ? new URL(brandConfig.assetOrigin).origin : undefined,
  isDevelopment,
});
const cspHeader = contentSecurityPolicyHeader(contentSecurityPolicy, enforceContentSecurityPolicy);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: {
      algorithm: "sha256",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          cspHeader,
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/r0-compat/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
