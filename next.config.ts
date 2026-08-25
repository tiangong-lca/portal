import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: {
      algorithm: "sha256",
    },
  },
};

export default nextConfig;
