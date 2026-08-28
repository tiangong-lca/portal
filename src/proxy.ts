import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/r0-compat")) {
    return handleI18nRouting(request);
  }

  const response = NextResponse.next();

  response.headers.set("x-portal-proxy", "r0-v1");
  response.headers.set("x-portal-request-path", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: ["/r0-compat/:path*", "/((?!internal|_next|_vercel|.*\\..*).*)"],
};
