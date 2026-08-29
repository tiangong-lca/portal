import type { Metadata } from "next";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { defaultLocale, isPortalLocale, locales } from "@/i18n/routing";

import { RootDocument, portalMetadata } from "../root-document";

import "../globals.css";

export const metadata: Metadata = portalMetadata;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PortalLocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: requestedLocale } = await params;
  const locale = isPortalLocale(requestedLocale) ? requestedLocale : defaultLocale;

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader locale={locale} />
          {children}
          <SiteFooter locale={locale} />
        </div>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
