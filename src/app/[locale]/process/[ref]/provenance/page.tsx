import { ScanSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailEmpty } from "@/features/catalog/detail-empty";
import { localizedText, mapDataset } from "@/features/catalog/map-public-data";
import { resolvePublicDataset } from "@/features/catalog/resolve-public-dataset";
import { isPortalLocale } from "@/i18n/routing";
import { absolutePortalUrl, localizedMetadata } from "@/lib/seo";
import { localizeConfidence, localizeFieldOrigin } from "@/i18n/domain-vocabulary";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/process/[ref]/provenance">): Promise<Metadata> {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return {};
  const dataset = await resolvePublicDataset("process", locale, ref);
  const record = mapDataset(
    dataset,
    locale,
    absolutePortalUrl(`/${locale}/process/${dataset.key.id}@${dataset.key.version}/provenance`),
  );
  const t = await getTranslations({ locale, namespace: "Detail" });
  return localizedMetadata({
    description: t("provenanceDescription"),
    locale,
    path: `process/${record.ref}/provenance`,
    title: `${t("provenanceTitle")} · ${record.name}`,
  });
}

export default async function ProcessProvenancePage({
  params,
}: PageProps<"/[locale]/process/[ref]/provenance">) {
  const { locale, ref } = await params;
  if (!isPortalLocale(locale)) return null;
  const dataset = await resolvePublicDataset("process", locale, ref);
  const metadata = dataset.metadata;
  if (metadata.kind !== "process") return null;
  const t = await getTranslations({ locale, namespace: "Detail" });
  const identityRows = [
    [t("sourceDatabaseId"), metadata.source.databaseId],
    [t("sourceDatabaseVersion"), metadata.source.databaseVersion],
    [t("sourceRecord"), metadata.source.sourceRecordId],
    [t("importBatch"), dataset.provenance.importBatchId],
    [t("normalizationRule"), dataset.provenance.normalizationRuleVersion],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const hasEvidence = identityRows.length > 0 || dataset.provenance.fieldOrigins.length > 0;

  return (
    <section aria-labelledby="provenance-title" className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold" id="provenance-title">
        {t("provenanceTitle")}
      </h2>
      {!hasEvidence ? (
        <DetailEmpty
          description={t("provenanceEmpty")}
          icon={ScanSearchIcon}
          title={t("provenanceTitle")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("identity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                {identityRows.map(([label, value]) => (
                  <div className="flex flex-col gap-1" key={label}>
                    <dt className="text-muted-foreground font-mono text-xs uppercase">{label}</dt>
                    <dd className="font-mono text-sm break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("fieldSource")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {dataset.provenance.fieldOrigins.map((origin) => (
                  <li
                    className="flex flex-col gap-1 rounded-lg border p-3"
                    key={`${origin.path}:${origin.kind}`}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{localizeFieldOrigin(origin.kind, locale)}</Badge>
                      {origin.confidence ? (
                        <Badge variant="secondary">
                          {t("confidence")}: {localizeConfidence(origin.confidence, locale)}
                        </Badge>
                      ) : null}
                    </div>
                    <details>
                      <summary className="text-muted-foreground cursor-pointer text-xs">
                        {t("fieldPath")}
                      </summary>
                      <code className="text-xs break-all">{origin.path}</code>
                    </details>
                    {localizedText(origin.reason, locale) ? (
                      <p className="text-muted-foreground text-sm">
                        {localizedText(origin.reason, locale)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
