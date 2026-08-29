import "server-only";

import { defaultLocale } from "@/i18n/routing";

export function redirectToDefaultLocale(request: Request): Response {
  const requestUrl = new URL(request.url);
  const location = `/${defaultLocale}${requestUrl.pathname}${requestUrl.search}`;

  return new Response(null, {
    headers: {
      "cache-control": "no-store",
      location,
    },
    status: 307,
  });
}
