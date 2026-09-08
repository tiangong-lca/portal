import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../src/components/ui/input-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../src/components/ui/sheet";
import type { ReferenceDataset } from "./data";
import { Availability, Metadata, NoResults, type ReferenceLabels } from "./shared";

function MatchText({ text, query }: { text: string; query: string }) {
  const token = query.trim().split(/\s+/)[0];
  const at = token ? text.toLowerCase().indexOf(token.toLowerCase()) : -1;
  return at < 0 || !token ? (
    text
  ) : (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + token.length)}</mark>
      {text.slice(at + token.length)}
    </>
  );
}

export type ReferenceFilters = { region: string; year: string; access: string };
export type SearchReferenceProps = {
  labels: ReferenceLabels;
  records: ReferenceDataset[];
  matches: ReferenceDataset[];
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
            <InputGroup className="cr-query">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={m.Search.label}
                value={draft}
                placeholder={m.Search.placeholder}
                onChange={(event) => props.onDraft(event.target.value)}
              />
              {draft && (
                <InputGroupAddon align="inline-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={m.Common.clear}
                    onClick={() => props.onDraft("")}
                    type="button"
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </InputGroupAddon>
              )}
            </InputGroup>
            <Button type="submit">{m.Common.search}</Button>
          </form>
        </search>
      </section>
      <div className="cr-search-layout">
        <aside className="cr-desktop-filters" aria-label={m.Search.facets}>
          <FilterControls {...props} />
        </aside>
        <section className="cr-results" aria-labelledby="cr-results-heading">
          <div className="cr-results-toolbar">
            <div>
              <h2 id="cr-results-heading">
                {query ? `“${query}”` : m.CatalogReference.catalog}
                <span>
                  {m.CatalogReference.resultCount.replace("{count}", String(matches.length))}
                </span>
              </h2>
            </div>
            <div className="cr-results-actions">
              <div className="cr-filter-mobile">
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
                  <SheetContent side="left" className="cr-surface" closeLabel={m.Common.close}>
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
                {props.newest ? m.CatalogReference.yearDescending : m.CatalogReference.relevance}
                <ChevronDownIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
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
            <ol className="cr-result-list">
              {matches.map((record) => (
                <li
                  key={record.ref}
                  className="cr-result"
                  data-selected={selected.includes(record.ref) || undefined}
                >
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
                  <article>
                    <div className="cr-record-top">
                      <div className="cr-record-identity">
                        <h3>
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
                        </h3>
                        <span className="cr-record-tags">
                          <Badge variant="outline" className="cr-version">
                            <span className="sr-only">{m.Search.version}: </span>v
                            {record.ref.split("@")[1]}
                          </Badge>
                          <Availability record={record} labels={m} compact />
                        </span>
                      </div>
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
                    <Metadata record={record} labels={m} />
                    <p className="cr-match">
                      <MatchText text={record.description} query={query} />
                    </p>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <NoResults labels={m} onReset={props.onReset} />
          )}
          <output className="cr-results-end">
            {m.CatalogReference.recordsShown.replace("{count}", String(matches.length))}
          </output>
        </section>
      </div>
    </>
  );
}
