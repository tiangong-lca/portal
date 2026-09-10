import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CommunityPageView } from "@/features/team/community-page";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/community">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Community" });
  return localizedMetadata({
    locale,
    path: "community",
    title: t("metadataTitle"),
    description: t("description"),
  });
}

export default async function CommunityPage({ params }: PageProps<"/[locale]/community">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  return <CommunityPageView labels={(await getMessages({ locale })).Community} locale={locale} />;
}
