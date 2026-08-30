import type { Metadata } from "next";

import { localePath, type PortalLocale } from "@/i18n/routing";
import { brandConfig } from "@/server/brand";

const openGraphLocales: Record<PortalLocale, string> = {
  "zh-CN": "zh_CN",
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
};

type LocalizedMetadataInput = {
  locale: PortalLocale;
  path?: string;
  title: string;
  description: string;
  index?: boolean;
  follow?: boolean;
};

export function localizedMetadata({
  description,
  follow = true,
  index = true,
  locale,
  path = "",
  title,
}: LocalizedMetadataInput): Metadata {
  const normalizedPath = path.replace(/^\/+/, "");

  return {
    alternates: {
      canonical: localePath(locale, normalizedPath),
      languages: {
        en: localePath("en", normalizedPath),
        de: localePath("de", normalizedPath),
        fr: localePath("fr", normalizedPath),
        "x-default": "/",
        "zh-CN": localePath("zh-CN", normalizedPath),
      },
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: brandConfig.alt[locale],
          height: brandConfig.height,
          url: brandConfig.lightLogo,
          width: brandConfig.width,
        },
      ],
      locale: openGraphLocales[locale],
      title,
      type: "website",
    },
    robots: {
      follow,
      index,
    },
    title,
  };
}

export function absolutePortalUrl(path: string): string {
  return new URL(path, process.env.SITE_URL ?? "http://localhost:3000").toString();
}
