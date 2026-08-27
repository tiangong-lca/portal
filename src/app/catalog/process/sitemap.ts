import type { MetadataRoute } from "next";

import { catalogSitemap } from "@/lib/catalog-sitemap";

export const revalidate = 300;

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return catalogSitemap("process");
}
