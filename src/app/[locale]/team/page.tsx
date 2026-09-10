import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { TeamPageView } from "@/features/team/team-page";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/team">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Team" });
  return localizedMetadata({
    locale,
    path: "team",
    title: t("metadataTitle"),
    description: t("description"),
  });
}

export default async function TeamPage({ params }: PageProps<"/[locale]/team">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  return <TeamPageView labels={(await getMessages({ locale })).Team} locale={locale} />;
}
