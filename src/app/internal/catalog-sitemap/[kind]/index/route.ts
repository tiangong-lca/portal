import {
  createCatalogSitemapIndexResponse,
  createCatalogSitemapNotFoundResponse,
} from "@/lib/catalog-sitemap";
import {
  catalogSitemapRewriteHeader,
  catalogSitemapRewriteValue,
} from "@/lib/catalog-sitemap-path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  context: RouteContext<"/internal/catalog-sitemap/[kind]/index">,
): Promise<Response> {
  if (
    request.headers.get(catalogSitemapRewriteHeader) !== catalogSitemapRewriteValue ||
    new URL(request.url).search !== ""
  ) {
    return createCatalogSitemapNotFoundResponse();
  }

  const { kind } = await context.params;
  return createCatalogSitemapIndexResponse(kind);
}
