import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("x-portal-proxy", "r0-v1");
  response.headers.set("x-portal-request-path", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: ["/r0-compat/:path*"],
};
