import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  BookmarkIcon,
  CheckIcon,
  GitCompareArrowsIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { BrandLogo } from "../../src/components/brand/brand-logo";
import { Button } from "../../src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../src/components/ui/sheet";
import { isPortalLocale, localeNames, locales, type PortalLocale } from "../../src/i18n/routing";
import { dictionaries } from "../fixtures";
import { referenceCitation, referenceDatasets } from "./data";
import { SearchReference, type ReferenceFilters } from "./search-page";
import { DetailReference } from "./detail-page";
import { Metadata, ReferenceFooter } from "./shared";
import "@fontsource-variable/source-sans-3/wght.css";
import "@fontsource-variable/noto-sans-sc/wght.css";
import "./reference.css";

type CatalogReferenceProps = {
  locale: PortalLocale;
  theme?: "light" | "dark";
  initialView?: "search" | "detail";
  missingMetadata?: boolean;
  initialQuery?: string;
  initialSelection?: number[];
  initialPageState?: "ready" | "loading" | "error" | "complete";
  /** Deterministic fixture request seam; no public API is called. */
  requestPage?: () => Promise<void>;
};

const pageSize = 6;
const readyPage = () => Promise.resolve();

const clearFilters: ReferenceFilters = { region: "", year: "", access: "" };
const recordHash = "#catalog-record-";

/** Interactive design proposal for complete catalog pages. Uses synthetic, in-memory fixtures only;
 * it is intentionally not imported by public routes and does not call the catalog service.
 * @import import { CatalogReference } from '../catalog-reference/catalog-reference';
 */
export function CatalogReference({
  locale: initialLocale,
  theme = "light",
  initialView = "search",
  missingMetadata = false,
  initialQuery,
  initialSelection = [],
  initialPageState = "ready",
  requestPage = readyPage,
}: CatalogReferenceProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [dark, setDark] = useState(theme === "dark");
  const m = dictionaries[locale];
  const records = referenceDatasets(locale);
  const [draft, setDraft] = useState(initialQuery ?? m.CatalogReference.queryExample);
  const [query, setQuery] = useState(draft);
  const [filters, setFilters] = useState<ReferenceFilters>(clearFilters);
  const [newest, setNewest] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    initialPageState === "complete" ? records.length : pageSize,
  );
  const [pageState, setPageState] = useState<"ready" | "loading" | "error">(
    initialPageState === "complete" ? "ready" : initialPageState,
  );
  const pageRequest = useRef(0);
  const pagePending = useRef(false);
  const nextResultFocus = useRef<string | null>(null);
  useEffect(
    () => () => {
      pageRequest.current += 1;
    },
    [],
  );
  useEffect(() => {
    const ref = nextResultFocus.current;
    if (!ref) return;
    nextResultFocus.current = null;
    const link = [
      ...(mainRef.current?.querySelectorAll<HTMLAnchorElement>("[data-record-ref]") ?? []),
    ].find((item) => item.dataset.recordRef === ref);
    link?.focus({ preventScroll: true });
  }, [visibleCount]);
  function resetPagination() {
    pageRequest.current += 1;
    pagePending.current = false;
    nextResultFocus.current = null;
    setVisibleCount(pageSize);
    setPageState("ready");
  }
  async function loadMore() {
    if (pagePending.current || visibleCount >= matches.length) return;
    pagePending.current = true;
    const request = ++pageRequest.current;
    setPageState("loading");
    try {
      await requestPage();
      if (request !== pageRequest.current) return;
      nextResultFocus.current = currentRef ? null : (matches[visibleCount]?.ref ?? null);
      setVisibleCount((count) => count + pageSize);
      setPageState("ready");
    } catch {
      if (request === pageRequest.current) setPageState("error");
    } finally {
      if (request === pageRequest.current) pagePending.current = false;
    }
  }
  const [currentRef, setCurrentRef] = useState<string | null>(
    initialView === "detail" ? records[missingMetadata ? 7 : 0]!.ref : null,
  );
  const [selected, setSelected] = useState<string[]>(
    initialSelection.slice(0, 4).map((index) => records[index]!.ref),
  );
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const resultScroll = useRef(0);
  const previousRef = useRef<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const record = records.find((item) => item.ref === currentRef);

  useEffect(() => {
    const element = document.documentElement;
    const previousDark = element.classList.contains("dark");
    const previousTheme = element.dataset.theme;
    element.classList.toggle("dark", dark);
    element.dataset.theme = dark ? "dark" : "light";
    return () => {
      element.classList.toggle("dark", previousDark);
      element.dataset.theme = previousTheme;
    };
  }, [dark]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [locale]);
  useEffect(() => {
    const onBack = (event: PopStateEvent) => {
      if (event.state && "catalogReference" in event.state) {
        setCurrentRef(event.state.catalogReference);
      }
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  useEffect(() => {
    // Native section anchors also create history entries. Remember their owning page
    // so browser Back traverses sections without losing the open dataset.
    const rememberPage = () => {
      window.history.replaceState({ ...window.history.state, catalogReference: currentRef }, "");
    };
    rememberPage();
    window.addEventListener("hashchange", rememberPage);
    return () => window.removeEventListener("hashchange", rememberPage);
  }, [currentRef]);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setCopyStatus("");
    if (currentRef) {
      window.scrollTo({ top: 0 });
      mainRef.current?.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: resultScroll.current });
      const link = [
        ...(mainRef.current?.querySelectorAll<HTMLAnchorElement>("[data-record-ref]") ?? []),
      ].find((item) => item.dataset.recordRef === previousRef.current);
      link?.focus({ preventScroll: true });
    }
  }, [currentRef]);

  function openRecord(ref: string) {
    if (!record) resultScroll.current = window.scrollY;
    previousRef.current = ref;
    window.history.pushState(
      { catalogReference: ref },
      "",
      `${window.location.pathname}${window.location.search}${recordHash}${encodeURIComponent(ref)}`,
    );
    setCurrentRef(ref);
    setShortlistOpen(false);
  }
  function backToResults() {
    window.history.pushState(
      { catalogReference: null },
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    setCurrentRef(null);
    setMenuOpen(false);
  }
  function toggleSelection(ref: string) {
    setSelected((previous) =>
      previous.includes(ref)
        ? previous.filter((item) => item !== ref)
        : previous.length < 4
          ? [...previous, ref]
          : previous,
    );
  }
  function toggleSave(ref: string) {
    const exists = saved.includes(ref);
    setSaved((previous) => (exists ? previous.filter((item) => item !== ref) : [...previous, ref]));
    setNotice(exists ? m.CatalogReference.removed : m.CatalogReference.saved);
  }
  function resetSearch() {
    resetPagination();
    setFilters(clearFilters);
    setDraft(m.CatalogReference.queryExample);
    setQuery(m.CatalogReference.queryExample);
  }
  const queryTerms = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  // Search the complete synthetic collection in all four authored languages. This is not a ranking model.
  const queryMatches = records.filter((item, index) => {
    const text = locales
      .flatMap((language) => {
        const candidate = referenceDatasets(language)[index]!;
        return [candidate.name, candidate.product, candidate.description];
      })
      .concat(item.ref, item.region, item.geography)
      .join(" ")
      .toLocaleLowerCase(locale);
    return queryTerms.every((term) => text.includes(term));
  });
  const matches = queryMatches.filter(
    (item) =>
      (!filters.region || item.region === filters.region) &&
      (!filters.year || item.year === filters.year) &&
      (!filters.access || item.open === (filters.access === "open")),
  );
  if (newest) matches.sort((a, b) => (b.year ?? "").localeCompare(a.year ?? ""));
  const selectedRecords = records.filter((item) => selected.includes(item.ref));
  const preferenceControls = (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={dark ? m.Common.themeLight : m.Common.themeDark}
        onClick={() => setDark(!dark)}
      >
        {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
      </Button>
      <Select
        value={locale}
        onValueChange={(value) => {
          if (isPortalLocale(value)) {
            setLocale(value);
            setNotice("");
            setCopyStatus("");
          }
        }}
      >
        <SelectTrigger aria-label={m.Common.language} className="cr-language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="cr-surface" aria-label={m.Common.language} position="popper">
          <SelectGroup>
            {locales.map((value) => (
              <SelectItem key={value} value={value}>
                {localeNames[value]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="catalog-reference" data-view={record ? "detail" : "search"}>
      <a className="cr-skip" href="#cr-main">
        {m.Common.skipToContent}
      </a>
      <header className="cr-header">
        <div className="cr-header-inner">
          <button className="cr-brand" onClick={backToResults} aria-label={m.Common.brandName}>
            <BrandLogo locale={locale} />
            <span>
              <span>{m.Common.productFamily}</span>
              <strong>{m.Common.productName}</strong>
            </span>
          </button>
          <nav className="cr-primary-nav" aria-label={m.Common.brandName}>
            <button aria-current="page" onClick={backToResults}>
              {m.CatalogReference.catalog}
            </button>
            <a
              href={`https://portal.tiangong.earth/${locale}/methodology`}
              target="_blank"
              rel="noreferrer"
            >
              {m.Common.methodology}
            </a>
          </nav>
          <div className="cr-header-tools">
            <Sheet open={shortlistOpen} onOpenChange={setShortlistOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="cr-shortlist-button"
                  aria-label={`${m.Common.collections} ${saved.length}`}
                >
                  <BookmarkIcon aria-hidden="true" />
                  <span>{m.Common.collections}</span>
                  <span className="cr-count">{saved.length}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="cr-surface cr-panel" closeLabel={m.Common.close}>
                <SheetHeader>
                  <SheetTitle>{m.Common.collections}</SheetTitle>
                  <SheetDescription>{m.CatalogReference.sessionOnly}</SheetDescription>
                </SheetHeader>
                <div className="cr-panel-body">
                  {saved.length ? (
                    records
                      .filter((item) => saved.includes(item.ref))
                      .map((item) => (
                        <article key={item.ref} className="cr-saved-item">
                          <a
                            href={`${recordHash}${item.ref}`}
                            onClick={(event) => {
                              event.preventDefault();
                              openRecord(item.ref);
                            }}
                          >
                            {item.name}
                          </a>
                          <Metadata record={item} labels={m} />
                          <Button variant="ghost" size="sm" onClick={() => toggleSave(item.ref)}>
                            <XIcon aria-hidden="true" />
                            {m.CatalogReference.unsave}
                          </Button>
                        </article>
                      ))
                  ) : (
                    <p>{m.CatalogReference.shortlistEmpty}</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <div className="cr-preferences">{preferenceControls}</div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cr-menu-trigger"
                  aria-label={m.CatalogReference.menu}
                >
                  <MenuIcon aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent className="cr-surface cr-panel" closeLabel={m.Common.close}>
                <SheetHeader>
                  <SheetTitle>{m.CatalogReference.menu}</SheetTitle>
                  <SheetDescription>{m.CatalogReference.menuDescription}</SheetDescription>
                </SheetHeader>
                <div className="cr-menu-content">
                  <Button variant="outline" onClick={backToResults}>
                    {m.CatalogReference.catalog}
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`https://portal.tiangong.earth/${locale}/methodology`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {m.Common.methodology}
                      <ArrowUpRightIcon aria-hidden="true" />
                    </a>
                  </Button>
                  <div className="cr-menu-preferences">{preferenceControls}</div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main id="cr-main" ref={mainRef} tabIndex={-1} className="cr-main">
        {record ? (
          <DetailReference
            record={record}
            labels={m}
            locale={locale}
            selected={selected.includes(record.ref)}
            selectionFull={selected.length >= 4}
            saved={saved.includes(record.ref)}
            copyStatus={copyStatus}
            onBack={backToResults}
            onSelect={() => toggleSelection(record.ref)}
            onSave={() => toggleSave(record.ref)}
            onCopy={async () => {
              try {
                await navigator.clipboard.writeText(referenceCitation(record, locale));
                setCopyStatus(m.Detail.citationCopied);
              } catch {
                setCopyStatus(m.Detail.copyFailed);
              }
            }}
          />
        ) : (
          <SearchReference
            labels={m}
            records={queryMatches}
            matches={matches}
            visibleCount={visibleCount}
            pageState={pageState}
            onLoadMore={() => void loadMore()}
            draft={draft}
            query={query}
            filters={filters}
            selected={selected}
            saved={saved}
            newest={newest}
            onDraft={setDraft}
            onSearch={() => {
              resetPagination();
              setQuery(draft);
              setNotice("");
            }}
            onFilter={(key, value) => {
              resetPagination();
              setFilters((previous) => ({ ...previous, [key]: value }));
            }}
            onReset={resetSearch}
            onSort={() => {
              resetPagination();
              setNewest(!newest);
            }}
            onSelect={toggleSelection}
            onSave={toggleSave}
            onOpen={openRecord}
          />
        )}
        <ReferenceFooter locale={locale} labels={m} />
      </main>
      {notice && (
        <output className="cr-notice">
          <CheckIcon aria-hidden="true" />
          {notice}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={m.Common.close}
            onClick={() => setNotice("")}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </output>
      )}
      {selected.length > 0 && (
        <section className="cr-selection" aria-label={m.Search.selection}>
          <div className="cr-selection-inner">
            <div className="cr-selection-count">
              <GitCompareArrowsIcon aria-hidden="true" />
              <strong>
                {m.CatalogReference.selectedCount.replace("{count}", String(selected.length))}
              </strong>
            </div>
            <div className="cr-selection-names">
              {selectedRecords.map((item) => (
                <span key={item.ref}>
                  {item.name}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${m.Compare.removeSelection}: ${item.name}`}
                    onClick={() => toggleSelection(item.ref)}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </span>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              {m.Common.clear}
            </Button>
            <Sheet open={comparisonOpen} onOpenChange={setComparisonOpen}>
              <SheetTrigger asChild>
                <Button disabled={selected.length < 2}>
                  {m.CatalogReference.compare}
                  <ArrowUpRightIcon aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent className="cr-surface cr-comparison-panel" closeLabel={m.Common.close}>
                <SheetHeader>
                  <SheetTitle>{m.CatalogReference.compare}</SheetTitle>
                  <SheetDescription>{m.CatalogReference.comparisonNotice}</SheetDescription>
                </SheetHeader>
                <div className="cr-comparison-grid">
                  {selectedRecords.map((item) => (
                    <article key={item.ref}>
                      <h3>{item.name}</h3>
                      <Metadata record={item} labels={m} expanded />
                      <p>{item.technology ?? m.Common.notProvided}</p>
                      <code>{item.ref}</code>
                    </article>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </section>
      )}
    </div>
  );
}
