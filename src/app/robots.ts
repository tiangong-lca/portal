import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";

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
          ...locales.flatMap((locale) =>
            ["search", "compare", "collections"].map((path) => `/${locale}/${path}`),
          ),
        ],
      },
    ],
    sitemap: [
      new URL("/sitemap.xml", siteUrl).toString(),
      new URL("/catalog-process-sitemap.xml", siteUrl).toString(),
      new URL("/catalog-flow-sitemap.xml", siteUrl).toString(),
    ],
  };
}
