import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isPortalLocale } from "./routing";

export default getRequestConfig(async ({ locale: explicitLocale, requestLocale }) => {
  const requestedLocale = explicitLocale ?? (await requestLocale);
  const locale =
    requestedLocale && isPortalLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});
