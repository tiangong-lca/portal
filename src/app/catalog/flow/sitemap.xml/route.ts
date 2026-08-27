import { catalogSitemapIndexResponse } from "@/lib/catalog-sitemap-route";

export const revalidate = 300;

export function GET(): Promise<Response> {
  return catalogSitemapIndexResponse("flow");
}
