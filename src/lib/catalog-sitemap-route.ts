import "server-only";

import {
  catalogSitemapManifest,
  catalogSitemapShard,
  catalogSitemapShardUrl,
  type CatalogSitemapKind,
} from "@/lib/catalog-sitemap";
import { renderSitemapIndex, renderSitemapUrlSet } from "@/lib/sitemap-xml";
import { PortalDataError } from "@/server/data/supabase-rpc";

const successHeaders = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
  "Content-Type": "application/xml; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function unavailableResponse(): Response {
  return new Response("Sitemap temporarily unavailable", {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": "60",
      "X-Content-Type-Options": "nosniff",
    },
    status: 503,
  });
}

export async function catalogSitemapIndexResponse(kind: CatalogSitemapKind): Promise<Response> {
  try {
    const manifest = await catalogSitemapManifest(kind);
    return new Response(
      renderSitemapIndex(manifest.map(({ id }) => catalogSitemapShardUrl(kind, id))),
      { headers: successHeaders },
    );
  } catch (error) {
    if (error instanceof PortalDataError) return unavailableResponse();
    throw error;
  }
}

export async function catalogSitemapShardResponse(
  kind: CatalogSitemapKind,
  shardPath: string,
): Promise<Response> {
  const match = /^(0|[1-9]\d*)\.xml$/.exec(shardPath);
  if (!match) return new Response("Not found", { status: 404 });
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id)) return new Response("Not found", { status: 404 });

  try {
    const entries = await catalogSitemapShard(kind, id);
    if (!entries) return new Response("Not found", { status: 404 });
    return new Response(renderSitemapUrlSet(entries), { headers: successHeaders });
  } catch (error) {
    if (error instanceof PortalDataError) return unavailableResponse();
    throw error;
  }
}
