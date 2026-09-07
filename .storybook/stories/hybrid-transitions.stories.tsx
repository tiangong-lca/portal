import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import { HybridSearchPanel } from "../../src/features/catalog/hybrid-search-panel";
import { CompareSelectionProvider } from "../../src/features/compare/selection";
import type { PortalLocale } from "../../src/i18n/routing";
import {
  dictionaries,
  mobileGlobals,
  refs,
  resultLabels,
  sampleNames,
  selectionLabels,
  storyLocale,
} from "../fixtures";
import catalog from "../../tests/fixtures/portal/catalog-v1.json";
import { hybridVersionPage } from "../../tests/fixtures/portal/hybrid-v2";

type Pending = {
  source: "lexical" | "hybrid";
  query: string;
  cursor: string | null;
  resolve: (response: Response) => void;
};
let pending: Pending[] = [];
const handlers = (["lexical", "hybrid"] as const).map((source) =>
  http.post(
    source === "lexical" ? "*/internal/hybrid/lexical" : "*/internal/hybrid",
    async ({ request }) => {
      const queue = pending;
      const body = (await request.json()) as { query: string; cursor: string | null };
      return new Promise<Response>((resolve) => queue.push({ source, ...body, resolve }));
    },
  ),
);
async function respond(
  source: Pending["source"],
  query: string,
  body: unknown,
  cursor: string | null = null,
  status = 200,
) {
  await waitFor(() =>
    expect(
      pending.some(
        (request) =>
          request.source === source && request.query === query && request.cursor === cursor,
      ),
    ).toBe(true),
  );
  pending
    .find(
      (request) =>
        request.source === source && request.query === query && request.cursor === cursor,
    )!
    .resolve(HttpResponse.json(body as Record<string, unknown>, { status }));
}
function lexicalPage(locale: PortalLocale, nextCursor: string | null = null) {
  const item = structuredClone(catalog.search.items[0]!);
  item.names = [{ language: locale, value: sampleNames[locale][0]! }];
  item.key.id = refs[0].split("@")[0]!;
  return {
    schemaVersion: "portal.hybrid-bff.v2",
    mode: "lexical",
    kind: "process",
    queryFingerprint: "a".repeat(64),
    items: [item],
    interpretation: null,
    fallbackReason: null,
    nextCursor,
  };
}
function refinedPage(
  locale: PortalLocale,
  nextCursor: string | null = null,
  name = sampleNames[locale][1]!,
) {
  const page = hybridVersionPage();
  page.items[0]!.names = [{ language: locale, value: name }];
  page.items[0]!.key.id = refs[0].split("@")[0]!;
  for (const group of page.versionGroups) {
    group.key = page.items[0]!.key;
    for (const match of group.matches) match.key.id = group.key.id;
  }
  return {
    ...page,
    schemaVersion: "portal.hybrid-bff.v2",
    mode: "hybrid",
    fallbackReason: null,
    nextCursor,
  };
}

const meta = {
  component: HybridSearchPanel,
  subcomponents: { CompareSelectionProvider },
  title: "Catalog/Progressive search",
  tags: ["!autodocs"],
  parameters: { msw: handlers },
  beforeEach() {
    pending = [];
    const queue = pending;
    return () => {
      for (const request of queue) request.resolve(HttpResponse.json({}, { status: 503 }));
    };
  },
  render: (_, { globals }) => {
    const locale = storyLocale(globals);
    return (
      <CompareSelectionProvider locale={locale} labels={selectionLabels(locale)}>
        <HybridSearchPanel
          initialFilters={{ geography: "cn" }}
          initialKind="process"
          labels={dictionaries[locale].Hybrid}
          locale={locale}
          resultLabels={resultLabels(locale)}
          siteOrigin="https://portal.example"
        />
      </CompareSelectionProvider>
    );
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<Omit<typeof meta, "component">>;
const query = "Storybook synthetic electricity request";

export const EarlyResults: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Hybrid;
    await userEvent.type(canvas.getByRole("textbox", { name: m.queryLabel }), query);
    await userEvent.click(canvas.getByRole("button", { name: m.submit }));
    await respond("lexical", query, lexicalPage(locale));
    await expect(await canvas.findByRole("link", { name: sampleNames[locale][0] })).toBeVisible();
    await expect(canvas.getByRole("status")).toHaveTextContent(m.optimizing);
    await expect(canvas.getByRole("button", { name: m.submit })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  },
};
export const UpdateReady: Story = {
  play: async (context) => {
    await EarlyResults.play?.(context);
    const { canvas, userEvent, globals } = context;
    const locale = storyLocale(globals);
    const checkbox = canvas.getByRole("checkbox", {
      name: new RegExp(dictionaries[locale].Search.selectForCompare),
    });
    await userEvent.click(checkbox);
    const currentRow = canvas.getByRole("link", { name: sampleNames[locale][0] });
    await respond("hybrid", query, refinedPage(locale));
    await expect(
      await canvas.findByRole("button", { name: dictionaries[locale].Hybrid.showUpdated }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: sampleNames[locale][0] })).toBe(currentRow);
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toHaveFocus();
    await expect(
      canvas.queryByRole("link", { name: sampleNames[locale][1] }),
    ).not.toBeInTheDocument();
  },
};
export const ApplyUpdate: Story = {
  play: async (context) => {
    await UpdateReady.play?.(context);
    const { canvas, userEvent, globals } = context;
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    await userEvent.click(canvas.getByRole("button", { name: m.Hybrid.showUpdated }));
    await expect(await canvas.findByRole("link", { name: sampleNames[locale][1] })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: m.Hybrid.resultsTitle })).toHaveFocus();
    await expect(
      canvas.queryByRole("link", { name: sampleNames[locale][0] }),
    ).not.toBeInTheDocument();
    const versions = canvas.getByRole("button", { name: new RegExp(m.Search.matchingVersions) });
    await userEvent.click(versions);
    await expect(canvas.getByRole("checkbox", { name: /00.99.999/ })).toHaveAttribute(
      "value",
      `${refs[0].split("@")[0]}@00.99.999`,
    );
    await expect(window.location.href).not.toContain(encodeURIComponent(query));
  },
};
export const NewQueryCancelsPrevious: Story = {
  play: async (context) => {
    const transport = spyOn(window, "fetch");
    try {
      await EarlyResults.play?.(context);
      const { canvas, userEvent, globals } = context;
      const locale = storyLocale(globals);
      const m = dictionaries[locale].Hybrid;
      const oldSignals = transport.mock.calls.map(([, init]) => init?.signal);
      const input = canvas.getByRole("textbox", { name: m.queryLabel });
      await userEvent.clear(input);
      await userEvent.type(input, `${query} B`);
      await userEvent.click(canvas.getByRole("button", { name: m.submit }));
      await expect(oldSignals.every((signal) => signal?.aborted)).toBe(true);
      await respond("hybrid", `${query} B`, refinedPage(locale));
      await expect(await canvas.findByRole("link", { name: sampleNames[locale][1] })).toBeVisible();
      await respond("hybrid", query, refinedPage(locale, null, "Stale synthetic result"));
      await respond("lexical", `${query} B`, lexicalPage(locale));
      await expect(canvas.queryByText("Stale synthetic result")).not.toBeInTheDocument();
      await expect(canvas.getByRole("link", { name: sampleNames[locale][1] })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: m.showUpdated })).not.toBeInTheDocument();
    } finally {
      transport.mockRestore();
    }
  },
};
export const MatchingFailure: Story = {
  play: async (context) => {
    await EarlyResults.play?.(context);
    const { canvas, globals } = context;
    const locale = storyLocale(globals);
    await respond("hybrid", query, {}, null, 503);
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent(
        dictionaries[locale].Hybrid.fallbackTitle,
      ),
    );
    await expect(canvas.getByRole("link", { name: sampleNames[locale][0] })).toBeVisible();
  },
};
export const PaginationFailure: Story = {
  play: async ({ canvas, userEvent, globals, parameters }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Hybrid;
    await userEvent.type(canvas.getByRole("textbox", { name: m.queryLabel }), query);
    await userEvent.click(canvas.getByRole("button", { name: m.submit }));
    await respond("hybrid", query, refinedPage(locale, "fixture_page_2"));
    await respond("lexical", query, lexicalPage(locale));
    const original = await canvas.findByRole("link", { name: sampleNames[locale][1] });
    await userEvent.click(canvas.getByRole("button", { name: m.loadMore }));
    await expect(canvas.getByRole("button", { name: m.loadingMore })).toBeDisabled();
    await respond(
      "hybrid",
      query,
      parameters.expired ? { code: "hybrid_cursor_expired" } : {},
      "fixture_page_2",
      parameters.expired ? 409 : 503,
    );
    await expect(
      await canvas.findByText(parameters.expired ? m.cursorExpired : m.pageError),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: sampleNames[locale][1] })).toBe(original);
    await expect(
      canvas.getByRole("button", { name: parameters.expired ? m.restart : m.loadMore }),
    ).toBeEnabled();
  },
};
export const ExpiredCursor: Story = { ...PaginationFailure, parameters: { expired: true } };
export const CancelQuerySharing: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Hybrid;
    const clipboard = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const before = window.location.href;
    try {
      await userEvent.type(canvas.getByRole("textbox", { name: m.queryLabel }), query);
      await userEvent.click(canvas.getByRole("button", { name: m.shareQuery }));
      await expect(canvas.getByRole("heading", { name: m.sharePreview })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: m.shareCancel }));
      await expect(canvas.queryByRole("heading", { name: m.sharePreview })).not.toBeInTheDocument();
      await expect(clipboard).not.toHaveBeenCalled();
      await expect(pending).toHaveLength(0);
      await expect(window.location.href).toBe(before);
      await expect(canvas.getByRole("textbox", { name: m.queryLabel })).toHaveValue(query);
    } finally {
      clipboard.mockRestore();
    }
  },
};
export const MobileGermanUpdate: Story = {
  ...ApplyUpdate,
  globals: { ...mobileGlobals, locale: "de" },
};
export const DarkFrenchFailure: Story = {
  ...PaginationFailure,
  globals: { ...mobileGlobals, locale: "fr", theme: "dark" },
};
