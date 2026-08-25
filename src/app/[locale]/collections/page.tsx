import { DatabaseZapIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CollectionsWorkspace } from "@/features/collections/collections-workspace";
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
  const t = await getTranslations({ locale, namespace: "Collections" });

  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-3">
        <Badge variant="outline">LOCALSTORAGE / NO SYNC</Badge>
        <h1 className="font-heading text-3xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground text-lg leading-8">{t("description")}</p>
      </header>
      <Alert>
        <DatabaseZapIcon aria-hidden="true" />
        <AlertTitle>{t("warningTitle")}</AlertTitle>
        <AlertDescription>{t("warningDescription")}</AlertDescription>
      </Alert>
      <CollectionsWorkspace
        labels={{
          add: t("add"),
          candidate: t("candidate"),
          empty: t("empty"),
          error: t("error"),
          excluded: t("excluded"),
          export: t("export"),
          import: t("import"),
          imported: t("imported"),
          memberPlaceholder: t("memberPlaceholder"),
          memberRef: t("memberRef"),
          note: t("note"),
          purpose: t("purpose"),
          remove: t("remove"),
          researchName: t("researchName"),
          saved: t("saved"),
          selected: t("selected"),
          share: t("share"),
          shared: t("shared"),
        }}
      />
    </main>
  );
}
