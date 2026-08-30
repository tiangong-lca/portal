import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { localePath, type PortalLocale } from "@/i18n/routing";

export async function SiteFooter({ locale }: { locale: PortalLocale }) {
  const t = await getTranslations({ locale, namespace: "Common" });

  return (
    <footer className="mx-auto mt-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <Separator />
      <div className="grid gap-8 py-8 sm:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.6fr)_minmax(12rem,0.7fr)]">
        <div className="flex max-w-md flex-col gap-2">
          <p className="font-heading font-semibold">{t("brandName")}</p>
          <p className="text-muted-foreground text-sm leading-6">{t("footerDescription")}</p>
        </div>
        <nav aria-label={t("footerExplore")} className="flex flex-col gap-2 text-sm">
          <p className="font-medium">{t("footerExplore")}</p>
          {([
            [localePath(locale, "search?v=1"), t("search")],
            [localePath(locale, "browse/process"), t("browse")],
            [localePath(locale, "methodology"), t("methodology")],
            [localePath(locale, "collections"), t("collections")],
          ] as const).map(([href, label]) => (
            <Link
              className="text-link w-fit underline decoration-1 underline-offset-4 hover:decoration-2"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">{t("footerProducts")}</p>
          <a
            className="text-link inline-flex w-fit items-center gap-1 underline decoration-1 underline-offset-4 hover:decoration-2"
            href="https://lca.tiangong.earth"
          >
            {t("externalLca")}
            <ExternalLinkIcon aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
      <Separator />
      <div className="text-muted-foreground py-5 text-sm leading-6">
        <p>{t("footerDataNote")}</p>
      </div>
    </footer>
  );
}
