import type { PublicDatasetEnvelope } from "@/server/contracts/portal";
import type { PortalLocale } from "@/i18n/routing";

import { localizedText } from "./map-public-data";

export function DatasetJsonLd({
  canonicalUrl,
  dataset,
  locale,
}: {
  canonicalUrl: string;
  dataset: PublicDatasetEnvelope;
  locale: PortalLocale;
}) {
  const metadata = dataset.metadata;
  const provider = localizedText(metadata.source.providerName, locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    dateModified: dataset.modifiedAt,
    ...(provider ? { creator: { "@type": "Organization", name: provider } } : {}),
    identifier: `${dataset.key.id}@${dataset.key.version}`,
    inLanguage: locale,
    ...(metadata.source.licenseUrl ? { license: metadata.source.licenseUrl } : {}),
    name: localizedText(metadata.names, locale) ?? `${dataset.key.id}@${dataset.key.version}`,
    ...(metadata.kind === "process" && metadata.referenceYear !== null
      ? { temporalCoverage: metadata.referenceYear.toString() }
      : {}),
    ...(metadata.kind === "process"
      ? {
          spatialCoverage:
            localizedText(metadata.geography.label, locale) ?? metadata.geography.code ?? undefined,
        }
      : {}),
    url: canonicalUrl,
    version: dataset.key.version,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      type="application/ld+json"
    />
  );
}
