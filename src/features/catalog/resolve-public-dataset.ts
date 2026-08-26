import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { isDatasetUuid } from "@/features/catalog/exact-ref";
import { localePath, type PortalLocale } from "@/i18n/routing";
import type { PortalDatasetKind, PublicDatasetEnvelope } from "@/server/contracts/portal";
import { parseExactDatasetReference, PortalInputError } from "@/server/contracts/input";
import { getPublicDataset, listPublicDatasetVersions } from "@/server/data/catalog";

async function resolvePublicDatasetNormalized(
  kind: PortalDatasetKind,
  locale: PortalLocale,
  reference: string,
): Promise<PublicDatasetEnvelope> {
  if (isDatasetUuid(reference)) {
    const versions = await listPublicDatasetVersions({ kind, id: reference, limit: 50 });
    const latest = versions.items.find((item) => item.isLatest);
    if (!latest) notFound();
    redirect(localePath(locale, `${kind}/${latest.key.id}@${latest.key.version}`));
  }

  let parsedReference;
  try {
    parsedReference = parseExactDatasetReference(kind, reference);
  } catch (error) {
    if (error instanceof PortalInputError) notFound();
    throw error;
  }

  const dataset = await getPublicDataset(parsedReference);
  if (!dataset) notFound();
  return dataset;
}

const resolveCached = cache(resolvePublicDatasetNormalized);

export function resolvePublicDataset(
  kind: PortalDatasetKind,
  locale: PortalLocale,
  routeReference: string,
): Promise<PublicDatasetEnvelope> {
  let reference: string;
  try {
    reference = decodeURIComponent(routeReference);
  } catch {
    notFound();
  }
  return resolveCached(kind, locale, reference);
}
