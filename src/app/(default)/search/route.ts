import { redirectToDefaultLocale } from "@/server/routing/default-locale-redirect";

export function GET(request: Request) {
  return redirectToDefaultLocale(request);
}
