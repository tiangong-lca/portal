"use client";
import { useTranslations } from "next-intl";
import { CitationCopy } from "./citation-copy";
/** @import import { CatalogCopyIdentity } from "@/features/catalog/catalog-copy-identity"; */
export function CatalogCopyIdentity({ reference }: { reference: string }) {
  const t = useTranslations("Detail");
  return (
    <CitationCopy
      identity
      iconOnly
      showText={false}
      citation={reference}
      copyLabel={t("copyVersionId")}
      copiedLabel={t("versionCopied")}
      failureLabel={t("copyFailed")}
    />
  );
}
