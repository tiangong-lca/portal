import { createCatalogSitemapIndexResponse } from "@/lib/catalog-sitemap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: RouteContext<"/catalog/[kind]/[index]">,
): Promise<Response> {
  const { index, kind } = await context.params;
  return createCatalogSitemapIndexResponse(kind, index);
}
