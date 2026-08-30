import type { MetadataRoute } from "next";

import { localePath, locales } from "@/i18n/routing";

const staticPaths = [
  "",
  "methodology",
  "browse/process",
  "browse/flow",
  "browse/region",
  "browse/source",
] as const;

function siteUrl(path: string): string {
  return new URL(path, process.env.SITE_URL ?? "http://localhost:3000").toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.map((path) => ({
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, siteUrl(localePath(locale, path))]),
      ),
    },
    changeFrequency:
      path === "" || path.startsWith("browse/") ? ("daily" as const) : ("monthly" as const),
    priority: path === "" ? 1 : path.startsWith("browse/") ? 0.7 : 0.5,
    url: siteUrl(localePath("zh-CN", path)),
  }));
}
