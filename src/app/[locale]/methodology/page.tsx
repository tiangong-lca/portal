import { MethodologyOverview } from "@/features/catalog/methodology-overview";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/methodology">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Methodology" });
  return localizedMetadata({
    locale,
    path: "methodology",
    title: t("title"),
    description: t("description"),
  });
}

export default async function MethodologyPage({ params }: PageProps<"/[locale]/methodology">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  return <MethodologyOverview labels={(await getMessages({ locale })).Methodology} />;
}
