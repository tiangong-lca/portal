import { getTranslations } from "next-intl/server";

export default async function LocaleNotFound() {
  const t = await getTranslations("Common");

  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 py-12 sm:px-6 lg:px-8"
      id="main-content"
    >
      <h1 className="font-heading text-3xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundDescription")}</p>
    </main>
  );
}
