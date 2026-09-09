import { referenceCitation } from "./data";
import { CatalogCopyIdentity } from "../../src/features/catalog/catalog-copy-identity";
import { CitationCopy } from "../../src/features/catalog/citation-copy";
import { CatalogResultsToolbar } from "../../src/features/catalog/catalog-results-toolbar";
import { CatalogSearchInput } from "../../src/features/catalog/catalog-search-input";
import { CatalogSearchLayout } from "../../src/features/catalog/catalog-search-layout";
import { SearchModes } from "../../src/features/catalog/search-modes";
import { HybridSearchPanel } from "../../src/features/catalog/hybrid-search-panel";
import { resultLabels } from "../fixtures";
import type { PortalLocale } from "../../src/i18n/routing";
import {
  CatalogResultRow,
  CatalogResultList,
  CatalogResultSummary,
} from "../../src/features/catalog/catalog-result-row";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { DatasetVersionTag, PublicContentTag } from "../../src/features/catalog/dataset-tags";
import { Button } from "../../src/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../src/components/ui/sheet";
import { ResultsContinuation } from "../../src/features/catalog/results-continuation";
import type { ReferenceDataset } from "./data";
import { Metadata, NoResults, type ReferenceLabels } from "./shared";

export type ReferenceFilters = { region: string; year: string; access: string };
export type SearchReferenceProps = {
  locale: PortalLocale;
  labels: ReferenceLabels;
  records: ReferenceDataset[];
  matches: ReferenceDataset[];
  visibleCount: number;
  pageState: "ready" | "loading" | "error";
  onLoadMore: () => void;
  query: string;
  draft: string;
  filters: ReferenceFilters;
  selected: string[];
  saved: string[];
  newest: boolean;
  onDraft: (query: string) => void;
  onSearch: () => void;
  onFilter: (key: keyof ReferenceFilters, value: string) => void;
  onReset: () => void;
  onSort: () => void;
  onSelect: (ref: string) => void;
  onSave: (ref: string) => void;
  onOpen: (ref: string) => void;
};

function FilterControls({
  labels: m,
  records,
  filters,
  onFilter,
}: Pick<SearchReferenceProps, "labels" | "records" | "filters" | "onFilter">) {
  const groups: {
    key: keyof ReferenceFilters;
    title: string;
    all: string;
    options: { value: string; label: string; count: number }[];
  }[] = [
    {
      key: "access",
      title: m.CatalogReference.publicContent,
      all: m.CatalogReference.allAccess,
      options: [
        {
          value: "open",
          label: m.CatalogReference.availabilityExchanges,
          count: records.filter((r) => r.open).length,
        },
        {
          value: "metadata",
          label: m.CatalogReference.availabilityMetadata,
          count: records.filter((r) => !r.open).length,
        },
      ],
    },
    {
      key: "region",
      title: m.Search.region,
      all: m.CatalogReference.allRegions,
      options: [
        ...new Map(
          records.map((r) => [
            r.region,
            {
              value: r.region,
              label: r.geography,
              count: records.filter((other) => other.region === r.region).length,
            },
          ]),
        ).values(),
      ],
    },
    {
      key: "year",
      title: m.Search.year,
      all: m.CatalogReference.allYears,
      options: [...new Set(records.flatMap((r) => (r.year ? [r.year] : [])))]
        .sort()
        .reverse()
        .map((year) => ({
          value: year,
          label: year,
          count: records.filter((r) => r.year === year).length,
        })),
    },
  ];
  return (
    <div className="cr-filter-controls">
      <div className="cr-filter-heading">
        <h2>
          <SlidersHorizontalIcon aria-hidden="true" />
          {m.Search.facets}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFilter("region", "");
            onFilter("year", "");
            onFilter("access", "");
          }}
        >
          {m.Common.clear}
        </Button>
      </div>
      {groups.map((group) => (
        <fieldset key={group.key} className="cr-filter-group">
          <legend>{group.title}</legend>
          {[{ value: "", label: group.all, count: records.length }, ...group.options].map(
            (option) => (
              <label
                key={option.value}
                className="cr-filter-option"
                data-selected={filters[group.key] === option.value || undefined}
              >
                <input
                  type="radio"
                  name={`reference-filter-${group.key}`}
                  checked={filters[group.key] === option.value}
                  onChange={() => onFilter(group.key, option.value)}
                />
                <span>{option.label}</span>
                <span className="cr-count">{option.count}</span>
              </label>
            ),
          )}
        </fieldset>
      ))}
    </div>
  );
}

/** Connected search-page design reference using deterministic fixtures, not a public search adapter.
 * @import import { SearchReference } from '../catalog-reference/search-page';
 */
export function SearchReference(props: SearchReferenceProps) {
  const { labels: m, matches, query, draft, filters, selected, saved } = props;
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  return (
    <SearchModes
      labels={{
        mode: m.Search.searchMode,
        keyword: m.Search.keywordMode,
        description: m.Search.descriptionMode,
      }}
      description={
        <HybridSearchPanel
          initialKind="process"
          initialFilters={{}}
          labels={m.Hybrid}
          locale={props.locale}
          resultLabels={resultLabels(props.locale)}
          siteOrigin="https://portal.example"
        />
      }
      keyword={
        <>
          <section className="cr-search-heading" aria-labelledby="cr-search-title">
            <div className="cr-title-line">
              <div>
                <h1 id="cr-search-title">{m.CatalogReference.catalog}</h1>
              </div>
            </div>
            <search aria-label={m.Search.title}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  props.onSearch();
                }}
                className="cr-search-form"
              >
                <CatalogSearchInput
                  submitLabel={m.Common.search}
                  clearLabel={m.Common.clear}
                  onClear={() => props.onDraft("")}
                  aria-label={m.Search.label}
                  value={draft}
                  placeholder={m.Search.placeholder}
                  onChange={(event) => props.onDraft(event.target.value)}
                />
              </form>
            </search>
          </section>
          <CatalogSearchLayout>
            <section className="cr-results" aria-labelledby="cr-results-heading">
              <CatalogResultsToolbar
                titleId="cr-results-heading"
                title={
                  <>
                    {query ? `“${query}”` : m.CatalogReference.catalog}
                    <span>
                      {m.CatalogReference.resultCount.replace("{count}", String(matches.length))}
                    </span>
                  </>
                }
                actions={
                  <>
                    <div className="catalog-filter-trigger">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" aria-label={m.Search.facets}>
                            <SlidersHorizontalIcon aria-hidden="true" />
                            {m.CatalogReference.filter}
                            {activeFilters.length > 0 && (
                              <span className="cr-count">{activeFilters.length}</span>
                            )}
                          </Button>
                        </SheetTrigger>
                        <SheetContent
                          side="left"
                          className="cr-surface"
                          closeLabel={m.Common.close}
                        >
                          <SheetHeader>
                            <SheetTitle>{m.Search.facets}</SheetTitle>
                            <SheetDescription>{m.Search.description}</SheetDescription>
                          </SheetHeader>
                          <div className="cr-filter-sheet">
                            <FilterControls {...props} />
                            <SheetClose asChild>
                              <Button>{m.CatalogReference.applyFilters}</Button>
                            </SheetClose>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={m.CatalogReference.sort}
                      aria-pressed={props.newest}
                      onClick={props.onSort}
                    >
                      {props.newest
                        ? m.CatalogReference.yearDescending
                        : m.CatalogReference.relevance}
                      <ChevronDownIcon aria-hidden="true" />
                    </Button>
                  </>
                }
              />
              {activeFilters.length > 0 && (
                <div className="cr-active-filters">
                  {activeFilters.map(([key, value]) => {
                    const label =
                      key === "region"
                        ? (props.records.find((r) => r.region === value)?.geography ?? value)
                        : key === "access"
                          ? value === "open"
                            ? m.CatalogReference.availabilityExchanges
                            : m.CatalogReference.availabilityMetadata
                          : value;
                    return (
                      <Button
                        key={key}
                        variant="secondary"
                        size="sm"
                        onClick={() => props.onFilter(key as keyof ReferenceFilters, "")}
                      >
                        {label}
                        <XIcon aria-hidden="true" />
                      </Button>
                    );
                  })}
                </div>
              )}
              {matches.length ? (
                <CatalogResultList>
                  {matches.slice(0, props.visibleCount).map((record) => (
                    <CatalogResultRow
                      key={record.ref}
                      selected={selected.includes(record.ref)}
                      selection={
                        <>
                          {" "}
                          <label className="cr-record-select">
                            <input
                              type="checkbox"
                              checked={selected.includes(record.ref)}
                              disabled={selected.length >= 4 && !selected.includes(record.ref)}
                              aria-label={`${m.CatalogReference.select}: ${record.name}`}
                              onChange={() => props.onSelect(record.ref)}
                            />
                            <span className="sr-only">{m.CatalogReference.select}</span>
                          </label>
                        </>
                      }
                      title={
                        <>
                          {" "}
                          <a
                            href={`#catalog-record-${record.ref}`}
                            data-record-ref={record.ref}
                            onClick={(event) => {
                              event.preventDefault();
                              props.onOpen(record.ref);
                            }}
                          >
                            {record.name}
                          </a>
                        </>
                      }
                      tags={
                        <>
                          {" "}
                          <DatasetVersionTag
                            version={record.ref.split("@")[1]!}
                            label={m.Search.version}
                          />
                          <PublicContentTag
                            content={record.open ? "exchanges" : "metadata"}
                            labels={m.CatalogReference}
                            compact
                          />
                        </>
                      }
                      action={
                        <div className="catalog-result-actions">
                          <CatalogCopyIdentity reference={record.ref} />
                          <CitationCopy
                            iconOnly
                            showText={false}
                            citation={referenceCitation(record, props.locale)}
                            copyLabel={m.Detail.copyCitation}
                            copiedLabel={m.Detail.citationCopied}
                            failureLabel={m.Detail.copyFailed}
                          />{" "}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${saved.includes(record.ref) ? m.CatalogReference.unsave : m.Detail.collect}: ${record.name}`}
                            aria-pressed={saved.includes(record.ref)}
                            onClick={() => props.onSave(record.ref)}
                          >
                            {saved.includes(record.ref) ? (
                              <CheckIcon aria-hidden="true" />
                            ) : (
                              <BookmarkIcon aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      }
                    >
                      <Metadata record={record} labels={m} />
                      <CatalogResultSummary text={record.description} query={query} />
                    </CatalogResultRow>
                  ))}
                </CatalogResultList>
              ) : (
                <NoResults labels={m} onReset={props.onReset} />
              )}
              {matches.length > 0 && (
                <ResultsContinuation
                  state={props.visibleCount >= matches.length ? "complete" : props.pageState}
                  summary={
                    props.visibleCount >= matches.length
                      ? m.CatalogReference.recordsShown.replace("{count}", String(matches.length))
                      : m.CatalogReference.recordsProgress
                          .replace("{shown}", String(props.visibleCount))
                          .replace("{total}", String(matches.length))
                  }
                  labels={{ ...m.Hybrid, retry: m.Common.retry }}
                  onLoadMore={props.onLoadMore}
                />
              )}
            </section>
          </CatalogSearchLayout>
        </>
      }
    />
  );
}
