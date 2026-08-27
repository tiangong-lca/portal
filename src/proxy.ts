import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import {
  catalogSitemapRewriteHeader,
  catalogSitemapRewriteValue,
  internalCatalogSitemapPath,
  isRootCatalogSitemapCandidate,
  parseRootCatalogSitemapPath,
} from "@/lib/catalog-sitemap-path";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const sitemapRoute = parseRootCatalogSitemapPath(request.nextUrl.pathname);
  if (sitemapRoute && request.nextUrl.search === "") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalCatalogSitemapPath(sitemapRoute);
    rewriteUrl.search = "";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(catalogSitemapRewriteHeader, catalogSitemapRewriteValue);
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }
  if (sitemapRoute || isRootCatalogSitemapCandidate(request.nextUrl.pathname)) {
    return new NextResponse("Not Found\n", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!request.nextUrl.pathname.startsWith("/r0-compat")) {
    return handleI18nRouting(request);
  }

  const response = NextResponse.next();

  response.headers.set("x-portal-proxy", "r0-v1");
  response.headers.set("x-portal-request-path", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: [
    "/",
    "/(zh-CN|en)/:path*",
    "/catalog-:kind-sitemap.xml",
    "/catalog-:kind-sitemap-:shard.xml",
    "/r0-compat/:path*",
  ],
};
