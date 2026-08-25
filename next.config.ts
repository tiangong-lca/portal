import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const enforceContentSecurityPolicy = process.env.PORTAL_CSP_MODE === "enforce";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  `style-src 'self'${isDevelopment ? " 'unsafe-inline'" : ""}`,
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

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
          {
            key: enforceContentSecurityPolicy
              ? "Content-Security-Policy"
              : "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicy,
          },
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

export default nextConfig;
