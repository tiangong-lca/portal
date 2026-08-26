"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function LocaleErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations("Common");

  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6 lg:px-8"
      id="main-content"
    >
      <h1 className="font-heading text-3xl font-semibold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorDescription")}</p>
      <Button className="w-fit" onClick={reset} variant="outline">
        {t("retry")}
      </Button>
    </main>
  );
}
