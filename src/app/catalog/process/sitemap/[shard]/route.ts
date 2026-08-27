import { catalogSitemapShardResponse } from "@/lib/catalog-sitemap-route";

export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shard: string }> },
): Promise<Response> {
  return catalogSitemapShardResponse("process", (await params).shard);
}
