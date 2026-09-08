import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, spyOn, waitFor, within } from "storybook/test";
import { ReferenceComparison, ReferenceShortlist } from "../catalog-reference/panels";
import { CatalogReference } from "../catalog-reference/catalog-reference";
import { ResultsContinuation } from "../../src/features/catalog/results-continuation";
import { SearchReference } from "../catalog-reference/search-page";
import { DetailReference } from "../catalog-reference/detail-page";
import { DatasetVersionTag, PublicContentTag } from "../../src/features/catalog/dataset-tags";
import { referenceCitation, referenceDatasets } from "../catalog-reference/data";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";
import { localeNames } from "../../src/i18n/routing";

const meta = {
  title: "Design references/Catalog pages",
  component: CatalogReference,
  subcomponents: {
    SearchReference,
    DetailReference,
    DatasetVersionTag,
    PublicContentTag,
    ResultsContinuation,
    ReferenceComparison,
    ReferenceShortlist,
  },
  tags: ["!autodocs"],
  args: { locale: "zh-CN", requestPage: fn<() => Promise<void>>().mockResolvedValue() },
  parameters: {
    pageLayout: true,
    docs: {
      description: {
        component:
          "Interactive search and dataset-detail design proposal. Records, match snippets, counts and licenses are synthetic fixtures; source names are not supplied. The search header contains the query and submit action, and example citations use only the supplied record name, year and exact identity. In results, the version badge and public-content icon tag follow the title as one wrapping group, above applicability metadata and the match snippet. Standalone versions share the body typeface and tabular digits across results and detail; full technical identities retain monospace. Search/filter/order, exact-version selection, in-preview shortlist, record navigation and citation interactions work locally. No public route imports this proposal; no API, ranking model or persistence is exercised. Visual acceptance is pending human design review.",
      },
    },
  },
  render: (args, { globals }) => (
    <CatalogReference
      {...args}
      key={`${storyLocale(globals)}-${globals.theme}`}
      locale={storyLocale(globals)}
      theme={globals.theme === "dark" ? "dark" : "light"}
    />
  ),
} satisfies Meta<typeof CatalogReference>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {};
export const Detail: Story = { args: { initialView: "detail" } };
export const SearchEnglish: Story = { globals: { locale: "en" } };
export const DetailFrench: Story = { ...Detail, globals: { locale: "fr" } };
export const SearchDark: Story = { globals: { theme: "dark" } };
export const DetailDark: Story = { ...Detail, globals: { theme: "dark" } };
export const SearchMobile: Story = { globals: mobileGlobals };
export const DetailMobileGerman: Story = { ...Detail, globals: { ...mobileGlobals, locale: "de" } };
export const MissingMetadata: Story = { args: { initialView: "detail", missingMetadata: true } };
export const EmptySearch: Story = { args: { initialQuery: "no-such-synthetic-dataset" } };
export const FourSelected: Story = { args: { initialSelection: [0, 1, 2, 3] } };
export const FourSelectedMobile: Story = {
  ...FourSelected,
  globals: { ...mobileGlobals, locale: "fr" },
};

export const SearchToDetailAndBack: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    const item = referenceDatasets(locale)[0]!;
    const checkbox = canvas.getByRole("checkbox", {
      name: `${m.CatalogReference.select}: ${item.name}`,
    });
    await userEvent.click(checkbox);
    await userEvent.click(canvas.getByRole("link", { name: item.name }));
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(item.name);
    await expect(
      canvas.getByRole("region", { name: m.CatalogReference.applicability }),
    ).toHaveTextContent("3.6 MJ");
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.back }));
    await expect(
      canvas.getByRole("checkbox", { name: `${m.CatalogReference.select}: ${item.name}` }),
    ).toBeChecked();
    await expect(canvas.getByRole("textbox", { name: m.Search.label })).toHaveValue(
      m.CatalogReference.queryExample,
    );
    await expect(canvas.getByRole("link", { name: item.name })).toHaveFocus();
  },
};
export const FiltersAndEmptyRecovery: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(
      canvas.getByRole("radio", { name: new RegExp(m.CatalogReference.availabilityMetadata) }),
    );
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(3);
    const input = canvas.getByRole("textbox", { name: m.Search.label });
    await userEvent.clear(input);
    await userEvent.type(input, "no-such-synthetic-dataset");
    await userEvent.click(canvas.getByRole("button", { name: m.Common.search }));
    await expect(canvas.getByText(m.Search.emptyTitle)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.resetSearch }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6);
  },
};
export const MobileFilterKeyboard: Story = {
  globals: { ...mobileGlobals, locale: "de" },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const trigger = canvas.getByRole("button", { name: m.Search.facets });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("dialog", { name: m.Search.facets })).toBeVisible());
    await userEvent.click(
      body.getByRole("radio", { name: new RegExp(m.CatalogReference.availabilityMetadata) }),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(3);
    const menu = canvas.getByRole("button", { name: m.CatalogReference.menu });
    await userEvent.click(menu);
    await waitFor(() =>
      expect(body.getByRole("dialog", { name: m.CatalogReference.menu })).toBeVisible(),
    );
    await userEvent.click(body.getByRole("button", { name: m.Common.themeDark }));
    await expect(canvasElement.ownerDocument.documentElement).toHaveAttribute("data-theme", "dark");
    await userEvent.click(body.getByRole("combobox", { name: m.Common.language }));
    await userEvent.click(body.getByRole("option", { name: localeNames.fr }));
    await waitFor(() =>
      expect(
        body.getByRole("dialog", { name: dictionaries.fr.CatalogReference.menu }),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(canvas.getByRole("textbox", { name: dictionaries.fr.Search.label })).toHaveValue(
      m.CatalogReference.queryExample,
    );
  },
};
export const PublicContentHelp: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const r = m.CatalogReference;
    const body = within(canvasElement.ownerDocument.body);
    const available = canvas.getAllByRole("button", {
      name: `${r.publicContent}: ${r.availabilityExchanges}`,
    })[0]!;
    const metadata = canvas.getAllByRole("button", {
      name: `${r.publicContent}: ${r.availabilityMetadata}`,
    })[0]!;
    await userEvent.hover(available);
    const tooltip = await body.findByRole("tooltip");
    await expect(tooltip).toHaveTextContent(r.exchangesHelp);
    await userEvent.hover(tooltip);
    await expect(tooltip).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.hover(canvas.getByRole("textbox", { name: m.Search.label }));
    const firstRecord = referenceDatasets(storyLocale(globals))[0]!;
    canvas.getByRole("link", { name: firstRecord.name }).focus();
    await userEvent.tab();
    await expect(available).toHaveFocus();
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(r.exchangesHelp);
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: `${m.Detail.collect}: ${firstRecord.name}` }),
    ).toHaveFocus();
    await waitFor(() => expect(body.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.click(metadata);
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(r.metadataHelp);
    await userEvent.keyboard("{Escape}");
    await expect(metadata).toHaveFocus();
    await waitFor(() => expect(body.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.keyboard("{Enter}");
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(r.metadataHelp);
    await userEvent.click(canvas.getByRole("textbox", { name: m.Search.label }));
    await waitFor(() => expect(body.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.click(available);
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(r.exchangesHelp);
  },
};
export const ShortlistAndSelectionLimit: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    const item = referenceDatasets(locale)[0]!;
    await userEvent.click(
      canvas.getByRole("button", { name: `${m.Detail.collect}: ${item.name}` }),
    );
    await expect(
      canvas.getByRole("button", { name: `${m.CatalogReference.unsave}: ${item.name}` }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: new RegExp(`^${m.Common.collections}`) }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: m.Common.collections })).toHaveTextContent(
      item.name,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    const boxes = canvas.getAllByRole("checkbox");
    for (const box of boxes.slice(0, 4)) await userEvent.click(box);
    await expect(boxes[4]).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.compare }));
    await expect(body.getByRole("dialog", { name: m.CatalogReference.compare })).toHaveTextContent(
      m.CatalogReference.comparisonNotice,
    );
  },
};
export const DetailEvidenceAndCitation: Story = {
  ...Detail,
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(
      canvas.getByText(m.CatalogReference.exactIdentity, { selector: "summary" }),
    );
    await expect(
      canvas
        .getByText(m.CatalogReference.exactIdentity, { selector: "summary" })
        .closest("details"),
    ).toHaveAttribute("open");
    const clipboard = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.click(canvas.getByRole("button", { name: m.Detail.copyCitation }));
      await expect(canvas.findByText(m.Detail.citationCopied)).resolves.toBeVisible();
      await expect(clipboard).toHaveBeenCalledWith(
        referenceCitation(referenceDatasets(storyLocale(globals))[0]!, storyLocale(globals)),
      );
    } finally {
      clipboard.mockRestore();
    }
    await expect(canvas.getByText(m.Detail.lciaUnavailable)).toBeVisible();
    await expect(canvas.getByText(m.CatalogReference.noReview)).toBeVisible();
  },
};
export const CitationPermissionDenied: Story = {
  ...Detail,
  play: async ({ canvas, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    const clipboard = spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("Clipboard denied"),
    );
    try {
      await userEvent.click(canvas.getByRole("button", { name: m.Detail.copyCitation }));
      await expect(canvas.findByText(m.Detail.copyFailed)).resolves.toBeVisible();
      await expect(
        canvas.getByText(referenceCitation(referenceDatasets(locale)[0]!, locale)),
      ).toBeVisible();
    } finally {
      clipboard.mockRestore();
    }
  },
};

export const PaginationLoading: Story = { args: { initialPageState: "loading" } };
export const PaginationError: Story = { args: { initialPageState: "error" } };
export const PaginationComplete: Story = { args: { initialPageState: "complete" } };
export const PaginationMobileError: Story = {
  ...PaginationError,
  globals: { ...mobileGlobals, locale: "de" },
};
export const PaginationDark: Story = {
  ...PaginationError,
  globals: { theme: "dark", locale: "fr" },
};
export const LoadMoreAndReturn: Story = {
  play: async ({ args, canvas, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    const records = referenceDatasets(locale);
    const page = Promise.withResolvers<void>();
    args.requestPage!.mockImplementationOnce(() => page.promise);
    await userEvent.click(canvas.getAllByRole("checkbox")[0]!);
    await userEvent.click(canvas.getByRole("button", { name: m.Hybrid.loadMore }));
    await expect(canvas.getByRole("button", { name: m.Hybrid.loadingMore })).toBeDisabled();
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6);
    page.resolve();
    await waitFor(() => expect(canvas.getAllByRole("checkbox")).toHaveLength(8));
    await expect(canvas.getAllByRole("checkbox")[0]).toBeChecked();
    const next = canvas.getByRole("link", { name: records[6]!.name });
    await expect(next).toHaveFocus();
    await userEvent.click(next);
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.back }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
    await expect(canvas.getByRole("link", { name: records[6]!.name })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.sort }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6);
    await expect(
      canvas.getByRole("checkbox", { name: `${m.CatalogReference.select}: ${records[0]!.name}` }),
    ).toBeChecked();
  },
};
export const PaginationRetry: Story = {
  play: async ({ args, canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    args.requestPage!.mockRejectedValueOnce(new Error("Fixture page unavailable"));
    await userEvent.click(canvas.getByRole("button", { name: m.Hybrid.loadMore }));
    await expect(canvas.findByRole("alert")).resolves.toHaveTextContent(m.Hybrid.pageError);
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6);
    await userEvent.click(canvas.getByRole("button", { name: m.Common.retry }));
    await waitFor(() => expect(canvas.getAllByRole("checkbox")).toHaveLength(8));
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};
export const NewQueryCancelsPage: Story = {
  play: async ({ args, canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const page = Promise.withResolvers<void>();
    args.requestPage!.mockImplementationOnce(() => page.promise);
    await userEvent.click(canvas.getByRole("button", { name: m.Hybrid.loadMore }));
    const input = canvas.getByRole("textbox", { name: m.Search.label });
    await userEvent.clear(input);
    await userEvent.type(input, "no-such-synthetic-dataset");
    await userEvent.click(canvas.getByRole("button", { name: m.Common.search }));
    page.resolve();
    await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
    await userEvent.click(canvas.getByRole("button", { name: m.CatalogReference.resetSearch }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(6);
    await expect(canvas.getByRole("button", { name: m.Hybrid.loadMore })).toBeEnabled();
  },
};

export const ShortlistEmpty: Story = { args: { initialPanel: "shortlist" } };
export const ShortlistPopulated: Story = {
  args: { initialPanel: "shortlist", initialSaved: [0, 1, 7] },
};
export const ShortlistMobileGerman: Story = {
  ...ShortlistPopulated,
  globals: { ...mobileGlobals, locale: "de" },
};
export const ShortlistManyDark: Story = {
  args: { initialPanel: "shortlist", initialSaved: [0, 1, 2, 3, 4, 5, 6, 7] },
  globals: { theme: "dark", locale: "fr" },
};
export const CompareTwo: Story = { args: { initialPanel: "comparison", initialSelection: [0, 1] } };
export const CompareFour: Story = {
  args: { initialPanel: "comparison", initialSelection: [0, 1, 6, 7] },
};
export const CompareFourMobile: Story = {
  ...CompareFour,
  globals: { ...mobileGlobals, locale: "de" },
};
export const CompareFourDark: Story = { ...CompareFour, globals: { theme: "dark", locale: "fr" } };
export const ShortlistRemoval: Story = {
  ...ShortlistPopulated,
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog", { name: m.Common.collections }));
    for (const button of dialog.getAllByRole("button", {
      name: new RegExp(`^${m.CatalogReference.unsave}:`),
    }))
      await userEvent.click(button);
    await expect(dialog.getByText(m.CatalogReference.shortlistEmpty)).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: m.CatalogReference.back }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: `${m.Common.collections} 0` })).toBeVisible();
  },
};
export const CompareExactIdentityAndOpen: Story = {
  ...CompareTwo,
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog", { name: m.CatalogReference.compare }));
    await expect(dialog.getByRole("heading", { name: m.CatalogReference.compare })).toHaveFocus();
    const summary = dialog.getByText(m.CatalogReference.exactIdentity, { selector: "summary" });
    await expect(summary.closest("details")).not.toHaveAttribute("open");
    await userEvent.click(summary);
    await expect(summary.closest("details")).toHaveTextContent(referenceDatasets(locale)[0]!.ref);
    await userEvent.click(
      dialog.getAllByRole("link", { name: referenceDatasets(locale)[0]!.name })[0]!,
    );
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      referenceDatasets(locale)[0]!.name,
    );
  },
};
