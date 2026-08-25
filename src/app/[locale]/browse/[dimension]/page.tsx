import { Rows3Icon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { isPortalLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/lib/seo";

const dimensions = ["process", "flow", "region", "source"] as const;
type Dimension = (typeof dimensions)[number];

function isDimension(value: string): value is Dimension {
  return dimensions.some((dimension) => dimension === value);
}

export function generateStaticParams() {
  return dimensions.map((dimension) => ({ dimension }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/browse/[dimension]">): Promise<Metadata> {
  const { dimension, locale } = await params;
  if (!isPortalLocale(locale) || !isDimension(dimension)) return {};
  const t = await getTranslations({ locale, namespace: "Browse" });
  return localizedMetadata({
    locale,
    path: `browse/${dimension}`,
    title: t("title", { dimension }),
    description: t("description"),
  });
}

export default async function BrowsePage({ params }: PageProps<"/[locale]/browse/[dimension]">) {
  const { dimension, locale } = await params;
  if (!isPortalLocale(locale) || !isDimension(dimension)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Browse" });

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      id="main-content"
    >
      <header className="flex max-w-3xl flex-col gap-3">
        <Badge variant="outline">DIRECTORY / {dimension.toUpperCase()}</Badge>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          {t("title", { dimension })}
        </h1>
        <p className="text-muted-foreground leading-7">{t("description")}</p>
      </header>
      <Empty className="min-h-80">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Rows3Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
