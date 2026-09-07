import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, waitFor, within } from "storybook/test";
import { CatalogReference } from "../catalog-reference/catalog-reference";
import { SearchReference } from "../catalog-reference/search-page";
import { DetailReference } from "../catalog-reference/detail-page";
import { Availability } from "../catalog-reference/shared";
import { referenceCitation, referenceDatasets } from "../catalog-reference/data";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";
import { localeNames } from "../../src/i18n/routing";

const meta = {
  title: "Design references/Catalog pages",
  component: CatalogReference,
  subcomponents: { SearchReference, DetailReference, Availability },
  tags: ["!autodocs"],
  args: { locale: "zh-CN" },
  parameters: {
    pageLayout: true,
    docs: {
      description: {
        component:
          "Interactive search and dataset-detail design proposal. All records, match snippets, counts and licenses are synthetic fixtures. Search/filter/order, exact-version selection, in-preview shortlist, record navigation and citation interactions work locally. No public route imports this proposal; no API, ranking model or persistence is exercised. Visual acceptance is pending human design review.",
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
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
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
    available.focus();
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(r.exchangesHelp);
    await userEvent.tab();
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
