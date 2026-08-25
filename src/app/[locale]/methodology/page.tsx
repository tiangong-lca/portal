import { EyeIcon, GitCompareArrowsIcon, HistoryIcon, ScanSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const t = await getTranslations({ locale, namespace: "Methodology" });
  const sections = [
    [EyeIcon, t("visibility"), t("visibilityBody")],
    [GitCompareArrowsIcon, t("comparability"), t("comparabilityBody")],
    [ScanSearchIcon, t("provenance"), t("provenanceBody")],
    [HistoryIcon, t("withdrawal"), t("withdrawalBody")],
  ] as const;

  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-3">
        <Badge variant="outline">METHOD / EVIDENCE</Badge>
        <h1 className="font-heading text-3xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground text-lg leading-8">{t("description")}</p>
      </header>
      <div className="evidence-rail flex flex-col gap-6">
        {sections.map(([Icon, title, description]) => (
          <Card key={title}>
            <CardHeader>
              <Icon aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </main>
  );
}
