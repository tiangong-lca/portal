import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CollectionsPageView } from "@/features/collections/collections-page-view";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/collections">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Collections" });
  return localizedMetadata({
    locale,
    path: "collections",
    title: t("title"),
    description: t("description"),
    index: false,
    follow: false,
  });
}

export default async function CollectionsPage({ params }: PageProps<"/[locale]/collections">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  return (
    <CollectionsPageView locale={locale} labels={messages.Collections} common={messages.Common} />
  );
}
