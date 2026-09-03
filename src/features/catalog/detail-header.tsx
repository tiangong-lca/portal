import { BookmarkPlusIcon, GitCompareArrowsIcon, QuoteIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DatasetDetailViewModel } from "@/features/catalog/view-model";
import { localePath, type PortalLocale } from "@/i18n/routing";

import { CitationCopy } from "./citation-copy";
import { NavigationLink } from "@/components/shell/navigation-link";
import { AvailabilityBadges } from "./availability-badges";
import { HashDisclosure } from "@/components/shell/hash-disclosure";

type DetailHeaderProps = {
  kind: "process" | "flow";
  locale: PortalLocale;
  record?: DatasetDetailViewModel;
  refValue: string;
};

export async function DetailHeader({ kind, locale, record, refValue }: DetailHeaderProps) {
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Detail" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const basePath = `${kind}/${encodeURIComponent(refValue)}`;
  const navigationItems =
    kind === "process"
      ? [
          [basePath, t("overview")],
          [`${basePath}/method`, t("method")],
          [`${basePath}/exchanges`, t("exchanges")],
          [`${basePath}/lcia`, t("lcia")],
          [`${basePath}/quality`, t("quality")],
          [`${basePath}/provenance`, t("provenance")],
          [`${basePath}/versions`, t("versions")],
        ]
      : [
          [basePath, t("overview")],
          [`${basePath}/versions`, t("versions")],
        ];

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{kind === "process" ? common("process") : common("flow")}</Badge>
          {record ? (
            <AvailabilityBadges
              capabilities={record.capabilities}
              labels={{
                exchanges: common("exchangesAvailable"),
                lcia: common("lciaAvailable"),
                metadata: common("metadataOnly"),
              }}
            />
          ) : null}
        </div>
        <h1 className="font-heading max-w-4xl text-3xl leading-tight font-semibold text-balance sm:text-5xl">
          {record?.name ?? (kind === "process" ? t("processTitle") : t("flowTitle"))}
        </h1>
        <p className="text-muted-foreground font-mono text-sm break-all">{refValue}</p>
        {!record ? (
          <Alert>
            <AlertDescription>{t("recordPending")}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {kind === "process" ? (
          <Button asChild variant="outline">
            <Link href={`${localePath(locale, "compare")}?v=1&ids=${encodeURIComponent(refValue)}`}>
              <GitCompareArrowsIcon data-icon="inline-start" />
              {t("compare")}
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link
            href={`${localePath(locale, "collections")}#member=${encodeURIComponent(refValue)}`}
          >
            <BookmarkPlusIcon data-icon="inline-start" />
            {t("collect")}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <a href="#citation">
            <QuoteIcon data-icon="inline-start" />
            {t("citation")}
          </a>
        </Button>
      </div>

      <nav
        aria-label={kind === "process" ? t("processTitle") : t("flowTitle")}
        className="overflow-x-auto border-y py-2"
      >
        <ul className="flex min-w-max items-center gap-1">
          {navigationItems.map(([href, label]) => (
            <li key={href}>
              <NavigationLink href={localePath(locale, href)}>{label}</NavigationLink>
            </li>
          ))}
        </ul>
      </nav>

      <HashDisclosure id="citation" label={t("citation")}>
        {record?.citation ? (
          <div className="flex flex-col gap-3">
            <CitationCopy
              citation={record.citation}
              copiedLabel={t("citationCopied")}
              copyLabel={t("copyCitation")}
            />
            <CitationCopy
              citation={refValue}
              copyLabel={t("copyVersionId")}
              copiedLabel={t("versionCopied")}
              showText={false}
            />
          </div>
        ) : (
          <p className="text-muted-foreground">{t("citationUnavailable")}</p>
        )}
      </HashDisclosure>
    </header>
  );
}
