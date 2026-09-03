import { BookmarkPlusIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { CatalogResultViewModel } from "@/features/catalog/view-model";
import { localePath, type PortalLocale } from "@/i18n/routing";
import { formatDatasetCitation } from "@/i18n/domain-vocabulary";
import { CompareChoice } from "@/features/compare/selection";
import { buildMemberFragment } from "@/features/collections/storage-v2";

import { CitationCopy } from "./citation-copy";
import { groupSearchResults } from "./search-version-groups";
import { AvailabilityBadges } from "./availability-badges";

export type SearchResultLabels = {
  collect: string;
  compare: string;
  copied: string;
  copyCitation: string;
  details: string;
  emptyDescription: string;
  emptyTitle: string;
  functionalUnit: string;
  geography: string;
  match: string;
  metadataOnly: string;
  flow: string;
  process: string;
  public: string;
  quality: string;
  reference: string;
  referenceYear: string;
  selectForCompare: string;
  source: string;
  technology: string;
  matchingVersions: string;
  version: string;
  referenceFlowProperty: string;
  exchangesAvailable: string;
  lciaAvailable: string;
};

export function SearchResults({
  items,
  labels,
  locale,
  selectable = false,
  siteOrigin,
}: {
  items: CatalogResultViewModel[];
  labels: SearchResultLabels;
  locale: PortalLocale;
  selectable?: boolean;
  siteOrigin: string;
}) {
  if (items.length === 0) {
    return (
      <Empty className="min-h-72">
        <EmptyHeader>
          <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
          <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {groupSearchResults(items).map((item) => {
        const detailHref = localePath(locale, `${item.kind}/${encodeURIComponent(item.ref)}`);
        const citation = formatDatasetCitation(locale, {
          name: item.name,
          ref: item.ref,
          url: new URL(detailHref, siteOrigin).toString(),
        });
        const context = [
          {
            label: item.kind === "flow" ? labels.referenceFlowProperty : labels.reference,
            value: item.kind === "flow" ? item.referenceFlowProperty : item.referenceProduct,
          },
          { label: labels.functionalUnit, value: item.functionalUnit },
          { label: labels.geography, value: item.geography },
          { label: labels.referenceYear, value: item.referenceYear },
          { label: labels.source, value: item.source },
          { label: labels.match, value: item.match },
        ].filter((entry): entry is { label: string; value: string } => Boolean(entry.value));

        return (
          <li key={`${item.kind}:${item.ref}`}>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {item.kind === "process" ? labels.process : labels.flow}
                  </Badge>
                  <AvailabilityBadges
                    capabilities={item.capabilities}
                    labels={{
                      exchanges: labels.exchangesAvailable,
                      lcia: labels.lciaAvailable,
                      metadata: labels.metadataOnly,
                    }}
                  />
                </div>
                {selectable && item.kind === "process" ? (
                  <CompareChoice
                    checkbox
                    item={{ name: item.name, ref: item.ref }}
                    label={labels.selectForCompare}
                    locale={locale}
                  />
                ) : null}
                <CardTitle>
                  <Link href={detailHref} prefetch={false}>
                    {item.name}
                  </Link>
                </CardTitle>
                <CardDescription className="font-mono text-xs break-all">
                  {item.ref}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {context.map(({ label, value }) => (
                    <div className="flex min-w-0 flex-col gap-1" key={`${item.ref}:${label}`}>
                      <dt className="text-muted-foreground font-mono text-xs tracking-[0.08em] uppercase">
                        {label}
                      </dt>
                      <dd className="text-sm break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                {item.matchingVersions && item.matchingVersions.length > 0 ? (
                  <Accordion collapsible type="single">
                    <AccordionItem value="versions">
                      <AccordionTrigger className="min-h-11" type="button">
                        <span>
                          {labels.matchingVersions}{" "}
                          <Badge className="ml-2" variant="secondary">
                            {item.matchingVersions.length}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex flex-col gap-3">
                          {item.matchingVersions.map((version) => (
                            <li
                              className="bg-muted/40 grid grid-cols-1 gap-3 rounded-lg p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                              key={version.ref}
                            >
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <Link
                                  className="text-sm font-medium break-words"
                                  href={localePath(
                                    locale,
                                    `${item.kind}/${encodeURIComponent(version.ref)}`,
                                  )}
                                >
                                  {version.name ?? `${labels.version} ${version.version}`}
                                </Link>
                                {version.name ? (
                                  <span className="text-muted-foreground font-mono text-xs">
                                    {labels.version} {version.version}
                                  </span>
                                ) : null}
                                {version.match ? (
                                  <span className="text-muted-foreground text-xs">
                                    {version.match}
                                  </span>
                                ) : null}
                              </div>
                              {selectable && item.kind === "process" ? (
                                <CompareChoice
                                  checkbox
                                  item={{ name: version.name ?? item.name, ref: version.ref }}
                                  label={labels.selectForCompare}
                                  locale={locale}
                                />
                              ) : item.kind === "process" ? (
                                <CompareChoice
                                  item={{ name: version.name ?? item.name, ref: version.ref }}
                                  label={labels.compare}
                                  locale={locale}
                                />
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={detailHref}>{labels.details}</Link>
                </Button>
                {item.kind === "process" && !selectable ? (
                  <CompareChoice
                    item={{ name: item.name, ref: item.ref }}
                    label={labels.compare}
                    locale={locale}
                  />
                ) : null}
                <Button asChild variant="outline">
                  <Link href={`${localePath(locale, "collections")}${buildMemberFragment(item)}`}>
                    <BookmarkPlusIcon data-icon="inline-start" />
                    {labels.collect}
                  </Link>
                </Button>
                <CitationCopy
                  citation={citation}
                  copiedLabel={labels.copied}
                  copyLabel={labels.copyCitation}
                  showText={false}
                />
              </CardFooter>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
