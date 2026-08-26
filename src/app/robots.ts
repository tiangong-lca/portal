import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = new URL(process.env.SITE_URL ?? "http://localhost:3000");
  if (process.env.PORTAL_PUBLIC_INDEXING !== "enabled") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/r0-compat/",
          "/zh-CN/search",
          "/en/search",
          "/zh-CN/compare",
          "/en/compare",
          "/zh-CN/collections",
          "/en/collections",
        ],
      },
    ],
    sitemap: [
      new URL("/sitemap.xml", siteUrl).toString(),
      new URL("/catalog/process/sitemap.xml", siteUrl).toString(),
      new URL("/catalog/flow/sitemap.xml", siteUrl).toString(),
    ],
  };
}
