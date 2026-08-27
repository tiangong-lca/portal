import { createCatalogSitemapIndexResponse } from "@/lib/catalog-sitemap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: RouteContext<"/catalog/[kind]/sitemap.xml">,
): Promise<Response> {
  const { kind } = await context.params;
  return createCatalogSitemapIndexResponse(kind);
}
