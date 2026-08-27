import "server-only";

import { localePath, type PortalLocale } from "@/i18n/routing";
import {
  catalogSitemapShardCount,
  parseCatalogSitemapKind,
  parseCatalogSitemapShardSearch,
  parseCatalogSitemapShardSegment,
  rootCatalogSitemapIndexPath,
  rootCatalogSitemapShardPath,
  type CatalogSitemapKind,
} from "@/lib/catalog-sitemap-path";
import { getPublicSitemapManifest, getPublicSitemapShard } from "@/server/data/catalog";

export type { CatalogSitemapKind } from "@/lib/catalog-sitemap-path";
export {
  catalogSitemapShardCount,
  parseCatalogSitemapKind,
  parseCatalogSitemapShardSegment,
} from "@/lib/catalog-sitemap-path";

type PublicSitemapManifest = Awaited<ReturnType<typeof getPublicSitemapManifest>>;
type PublicSitemapShard = Awaited<ReturnType<typeof getPublicSitemapShard>>;
type PublicSitemapItem = PublicSitemapShard["items"][number];

export const maximumCatalogSitemapItems = 4096;
export const maximumCatalogSitemapUrls = 50_000;
export const maximumCatalogSitemapXmlBytes = 5 * 1024 * 1024;
export const catalogSitemapSharedCacheControl = "public, max-age=0, s-maxage=300, must-revalidate";
export const catalogSitemapFailureCacheControl = "no-store";

const textEncoder = new TextEncoder();
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export class CatalogSitemapError extends Error {
  constructor() {
    super("The catalog sitemap is temporarily unavailable.");
    this.name = "CatalogSitemapError";
  }
}

export type CatalogSitemapDependencies = {
  environment: Record<string, string | undefined>;
  loadManifest: () => Promise<PublicSitemapManifest>;
  loadShard: (input: { shardCursor: string }) => Promise<PublicSitemapShard>;
};

function resolveDependencies(
  overrides: Partial<CatalogSitemapDependencies> = {},
): CatalogSitemapDependencies {
  return {
    environment: overrides.environment ?? process.env,
    loadManifest: overrides.loadManifest ?? (() => getPublicSitemapManifest()),
    loadShard: overrides.loadShard ?? ((input) => getPublicSitemapShard(input)),
  };
}

export function readCatalogSitemapSiteOrigin(
  environment: Record<string, string | undefined> = process.env,
): string {
  const configured = environment.SITE_URL;
  if (!configured || configured.length > 2048) {
    throw new CatalogSitemapError();
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new CatalogSitemapError();
  }

  const validProtocol =
    url.protocol === "https:" || (url.protocol === "http:" && loopbackHosts.has(url.hostname));
  const isOriginOnly =
    url.username === "" &&
    url.password === "" &&
    url.pathname === "/" &&
    url.search === "" &&
    url.hash === "";
  if (!validProtocol || !isOriginOnly) {
    throw new CatalogSitemapError();
  }

  return url.origin;
}

export function readCatalogSitemapCacheControl(
  environment: Record<string, string | undefined> = process.env,
): string {
  const mode = environment.PORTAL_SITEMAP_CACHE_MODE ?? "no-store";
  if (mode === "no-store") return "no-store";
  if (mode === "shared-300" && environment.VERCEL !== "1") {
    return catalogSitemapSharedCacheControl;
  }
  throw new CatalogSitemapError();
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(origin: string, path: string): string {
  return new URL(path, `${origin}/`).toString();
}

function localizedDatasetUrl(
  origin: string,
  locale: PortalLocale,
  item: PublicSitemapItem,
): string {
  return absoluteUrl(
    origin,
    localePath(locale, `${item.key.kind}/${item.key.id}@${item.key.version}`),
  );
}

export function assertCatalogSitemapXmlWithinLimit(xml: string): string {
  if (textEncoder.encode(xml).byteLength >= maximumCatalogSitemapXmlBytes) {
    throw new CatalogSitemapError();
  }
  return xml;
}

export function renderCatalogSitemapIndex(kind: CatalogSitemapKind, origin: string): string {
  const entries = Array.from({ length: catalogSitemapShardCount }, (_, shardIndex) => {
    const location = absoluteUrl(origin, rootCatalogSitemapShardPath(kind, shardIndex));
    return `  <sitemap><loc>${escapeXml(location)}</loc></sitemap>`;
  }).join("\n");

  return assertCatalogSitemapXmlWithinLimit(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${entries}\n` +
      `</sitemapindex>\n`,
  );
}

export function renderCatalogSitemapShard(
  kind: CatalogSitemapKind,
  origin: string,
  items: readonly PublicSitemapItem[],
): string {
  if (items.length > maximumCatalogSitemapItems || items.length * 2 > maximumCatalogSitemapUrls) {
    throw new CatalogSitemapError();
  }

  const seenIdentities = new Set<string>();
  const entries = items.map((item) => {
    if (item.key.kind !== kind) {
      throw new CatalogSitemapError();
    }

    const identity = `${item.key.kind}:${item.key.id}`;
    if (seenIdentities.has(identity)) {
      throw new CatalogSitemapError();
    }
    seenIdentities.add(identity);

    const zhCnUrl = escapeXml(localizedDatasetUrl(origin, "zh-CN", item));
    const enUrl = escapeXml(localizedDatasetUrl(origin, "en", item));
    const lastModified = escapeXml(item.modifiedAt);
    return [zhCnUrl, enUrl]
      .map((location) =>
        [
          "  <url>",
          `    <loc>${location}</loc>`,
          `    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhCnUrl}" />`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
          `    <lastmod>${lastModified}</lastmod>`,
          "  </url>",
        ].join("\n"),
      )
      .join("\n");
  });

  return assertCatalogSitemapXmlWithinLimit(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
      `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      `${entries.join("\n")}\n` +
      `</urlset>\n`,
  );
}

export async function buildCatalogSitemapIndex(
  kind: CatalogSitemapKind,
  dependencyOverrides: Partial<CatalogSitemapDependencies> = {},
): Promise<string> {
  const dependencies = resolveDependencies(dependencyOverrides);
  const origin = readCatalogSitemapSiteOrigin(dependencies.environment);
  const manifest = await dependencies.loadManifest();
  if (manifest.shards.length !== catalogSitemapShardCount) {
    throw new CatalogSitemapError();
  }
  return renderCatalogSitemapIndex(kind, origin);
}

export async function buildCatalogSitemapShard(
  kind: CatalogSitemapKind,
  shardIndex: number,
  dependencyOverrides: Partial<CatalogSitemapDependencies> = {},
): Promise<string> {
  if (
    !Number.isSafeInteger(shardIndex) ||
    shardIndex < 0 ||
    shardIndex >= catalogSitemapShardCount
  ) {
    throw new CatalogSitemapError();
  }

  const dependencies = resolveDependencies(dependencyOverrides);
  const origin = readCatalogSitemapSiteOrigin(dependencies.environment);
  const manifest = await dependencies.loadManifest();
  const descriptor = manifest.shards[shardIndex];
  if (!descriptor || manifest.shards.length !== catalogSitemapShardCount) {
    throw new CatalogSitemapError();
  }

  const shard = await dependencies.loadShard({ shardCursor: descriptor.shardCursor });
  if (shard.shardCursor !== descriptor.shardCursor) {
    throw new CatalogSitemapError();
  }

  return renderCatalogSitemapShard(
    kind,
    origin,
    shard.items.filter((item) => item.key.kind === kind),
  );
}

function xmlResponse(xml: string, cacheControl: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function failureResponse(status: 404 | 503): Response {
  return new Response(status === 404 ? "Not Found\n" : "Sitemap temporarily unavailable\n", {
    status,
    headers: {
      "Cache-Control": catalogSitemapFailureCacheControl,
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      ...(status === 503 ? { "Retry-After": "60" } : {}),
    },
  });
}

export function createCatalogSitemapNotFoundResponse(): Response {
  return failureResponse(404);
}

export async function createCatalogSitemapIndexResponse(
  kindValue: string,
  dependencyOverrides: Partial<CatalogSitemapDependencies> = {},
): Promise<Response> {
  const kind = parseCatalogSitemapKind(kindValue);
  if (!kind) return failureResponse(404);

  try {
    const cacheControl = readCatalogSitemapCacheControl(
      dependencyOverrides.environment ?? process.env,
    );
    return xmlResponse(await buildCatalogSitemapIndex(kind, dependencyOverrides), cacheControl);
  } catch {
    return failureResponse(503);
  }
}

export async function createCatalogSitemapShardResponse(
  kindValue: string,
  shardSegment: string,
  dependencyOverrides: Partial<CatalogSitemapDependencies> = {},
): Promise<Response> {
  const kind = parseCatalogSitemapKind(kindValue);
  const shardIndex = parseCatalogSitemapShardSegment(shardSegment);
  if (!kind || shardIndex === null) return failureResponse(404);

  try {
    const cacheControl = readCatalogSitemapCacheControl(
      dependencyOverrides.environment ?? process.env,
    );
    return xmlResponse(
      await buildCatalogSitemapShard(kind, shardIndex, dependencyOverrides),
      cacheControl,
    );
  } catch {
    return failureResponse(503);
  }
}

export async function createRootCatalogSitemapResponse(
  kind: CatalogSitemapKind,
  request: Request,
  dependencyOverrides: Partial<CatalogSitemapDependencies> = {},
): Promise<Response> {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return failureResponse(404);
  }
  if (url.pathname !== rootCatalogSitemapIndexPath(kind)) {
    return failureResponse(404);
  }
  if (url.search === "") {
    return createCatalogSitemapIndexResponse(kind, dependencyOverrides);
  }

  const shardIndex = parseCatalogSitemapShardSearch(url.search);
  return shardIndex === null
    ? failureResponse(404)
    : createCatalogSitemapShardResponse(kind, `${shardIndex}.xml`, dependencyOverrides);
}
