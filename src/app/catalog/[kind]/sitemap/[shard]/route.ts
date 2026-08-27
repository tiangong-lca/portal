import { createCatalogSitemapShardResponse } from "@/lib/catalog-sitemap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: RouteContext<"/catalog/[kind]/sitemap/[shard]">,
): Promise<Response> {
  const { kind, shard } = await context.params;
  return createCatalogSitemapShardResponse(kind, shard);
}
