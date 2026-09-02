import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import catalogFixture from "../fixtures/portal/catalog-v1.json";
import enMessages from "../../src/i18n/messages/en.json";
import type {
  getPublicFacets,
  searchPublicFlows,
  searchPublicProcesses,
} from "@/server/data/catalog";
import { publicFacetsSchema, publicSearchPageSchema } from "@/server/contracts/portal";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const catalogMocks = vi.hoisted(() => ({
  searchPublicProcesses: vi.fn<typeof searchPublicProcesses>(),
  searchPublicFlows: vi.fn<typeof searchPublicFlows>(),
  getPublicFacets: vi.fn<typeof getPublicFacets>(),
}));

const getTranslations = vi.hoisted(() =>
  vi.fn<(options: { locale?: string; namespace: string }) => Promise<Translator>>(),
);

vi.mock("@/server/data/catalog", () => catalogMocks);
vi.mock("next-intl/server", () => ({
  getTranslations,
  setRequestLocale: vi.fn<(locale: string) => void>(),
}));
vi.mock("@/features/catalog/hybrid-search-panel", () => ({
  HybridSearchPanel: () => <div data-testid="hybrid-panel-stub" />,
}));

import SearchPage from "@/app/[locale]/search/page";
import { PortalDataError } from "@/server/data/supabase-rpc";

const searchDictionary = enMessages.Search;

function translator(namespace: string) {
  return (key: string, values?: Record<string, string | number>) => {
    const table = (enMessages as Record<string, Record<string, string>>)[namespace] ?? {};
    const template = table[key] ?? key;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/gu, (_match, name: string) =>
      String(values[name] ?? `{${name}}`),
    );
  };
}

type SearchPageParams = Record<string, string | string[] | undefined>;

function getSidebar() {
  return screen.getByRole("complementary", { name: "Refine results" });
}

async function renderSearchPage(searchParams: SearchPageParams) {
  const element = await SearchPage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve(searchParams),
  });
  return render(element);
}

describe("Search page sidebar state (Portal #46)", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getTranslations.mockImplementation(async ({ namespace }: { namespace: string }) =>
      translator(namespace),
    );
  });

  it("empty query queries no backend and shows the initial prompt instead of the unavailable text", async () => {
    await renderSearchPage({});

    expect(catalogMocks.searchPublicProcesses).not.toHaveBeenCalled();
    expect(catalogMocks.searchPublicFlows).not.toHaveBeenCalled();
    expect(catalogMocks.getPublicFacets).not.toHaveBeenCalled();
    const sidebar = getSidebar();
    expect(within(sidebar).getByText(searchDictionary.initialDescription)).toBeInTheDocument();
    expect(
      within(sidebar).queryByText(searchDictionary.unavailableDescription),
    ).not.toBeInTheDocument();
    expect(within(sidebar).queryByText(searchDictionary.description)).not.toBeInTheDocument();
  });

  it("a real backend failure on a submitted query still reports the unavailable state", async () => {
    catalogMocks.searchPublicProcesses.mockRejectedValue(
      new PortalDataError("upstream_unavailable"),
    );
    catalogMocks.getPublicFacets.mockRejectedValue(new PortalDataError("upstream_unavailable"));

    await renderSearchPage({ v: "1", kind: "process", q: "electricity" });

    expect(catalogMocks.searchPublicProcesses).toHaveBeenCalledTimes(1);
    expect(catalogMocks.searchPublicFlows).not.toHaveBeenCalled();
    expect(catalogMocks.getPublicFacets).toHaveBeenCalledTimes(1);
    const sidebar = getSidebar();
    expect(within(sidebar).getByText(searchDictionary.unavailableDescription)).toBeInTheDocument();
    expect(
      within(screen.getByRole("alert")).getByText(searchDictionary.unavailableDescription),
    ).toBeInTheDocument();
  });

  it("a successful query keeps facets and the facet description", async () => {
    catalogMocks.searchPublicProcesses.mockResolvedValue(
      publicSearchPageSchema.parse(catalogFixture.search),
    );
    catalogMocks.getPublicFacets.mockResolvedValue(
      publicFacetsSchema.parse({ ...catalogFixture.facets, kind: "process" }),
    );

    await renderSearchPage({ v: "1", kind: "process", q: "electricity" });

    const sidebar = getSidebar();
    expect(within(sidebar).getByText(searchDictionary.description)).toBeInTheDocument();
    expect(
      within(sidebar).queryByText(searchDictionary.unavailableDescription),
    ).not.toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Process (1)" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
