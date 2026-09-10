import { createTranslator } from "next-intl";
import { dictionaries } from "./fixtures";
import type { PortalLocale } from "../src/i18n/routing";

// Stories await the actual presentational server components in loaders. Only
// request-local translation is substituted; no Next server runtime is bundled.
export async function getTranslations({
  locale,
  namespace,
}: {
  locale: PortalLocale;
  namespace: keyof (typeof dictionaries)["en"];
}) {
  return createTranslator({ locale, messages: dictionaries[locale], namespace });
}

export async function getMessages({ locale }: { locale: PortalLocale }) {
  return dictionaries[locale];
}
