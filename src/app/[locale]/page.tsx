import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { BrandHome } from "@/components/brand/brand-home";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";
import type { PublicCatalogSummary } from "@/server/contracts/portal";
import { getPublicCatalogSummary } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

export const revalidate = 300;

async function readCatalogSummary(): Promise<PublicCatalogSummary | null> {
  try {
    return await getPublicCatalogSummary();
  } catch (error) {
    if (error instanceof PortalDataError) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPortalLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "BrandHome" });

  return localizedMetadata({ locale, title: t("metadataTitle"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isPortalLocale(locale)) notFound();
  setRequestLocale(locale);
  const summary = await readCatalogSummary();
  return <BrandHome locale={locale} summary={summary} />;
}
