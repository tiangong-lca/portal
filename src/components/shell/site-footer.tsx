import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { localePath, type PortalLocale } from "@/i18n/routing";

export async function SiteFooter({ locale }: { locale: PortalLocale }) {
  const t = await getTranslations({ locale, namespace: "Common" });

  return (
    <footer className="mx-auto mt-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <Separator />
      <div className="text-muted-foreground flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center">
        <p className="font-medium">{t("footerBoundary")}</p>
        <p className="sm:ml-auto">{t("footerEvidence")}</p>
        <Link
          className="text-link underline decoration-1 underline-offset-4 hover:decoration-2"
          href={localePath(locale, "methodology")}
        >
          {t("methodology")}
        </Link>
      </div>
    </footer>
  );
}
