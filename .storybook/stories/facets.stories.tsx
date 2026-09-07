import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { FacetsPanel } from "../../src/features/catalog/facets-panel";
import { ResponsiveFacets } from "../../src/features/catalog/responsive-facets";
import { SearchResults } from "../../src/features/catalog/search-results";
import { catalogItems, dictionaries, mobileGlobals, resultLabels, storyLocale } from "../fixtures";
import { facetSearch, populatedFacets } from "../composition-fixtures";

const meta = {
  title: "Catalog/Responsive facets",
  tags: ["!autodocs"],
  loaders: [
    async ({ globals, parameters }) => ({
      facets: await FacetsPanel({
        locale: storyLocale(globals),
        parsedSearch: facetSearch,
        facets:
          parameters.empty || parameters.unavailable ? null : populatedFacets(storyLocale(globals)),
        dataUnavailable: parameters.unavailable,
      }),
    }),
  ],
  render: (_, { globals, loaded }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    return (
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <ResponsiveFacets
          labels={{
            title: m.Search.facets,
            description: m.Search.filtersDescription,
            close: m.Common.close,
          }}
        >
          {loaded.facets}
        </ResponsiveFacets>
        <section className="min-w-0" aria-label={m.Search.allResultsTitle}>
          <SearchResults
            locale={locale}
            items={catalogItems(locale)}
            labels={resultLabels(locale)}
            siteOrigin="https://portal.example"
          />
        </section>
      </div>
    );
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = { globals: { viewport: { value: "desktop", isRotated: false } } };
export const Initial: Story = { parameters: { empty: true } };
export const Unavailable: Story = { parameters: { unavailable: true } };
export const MobileGerman: Story = {
  globals: { ...mobileGlobals, locale: "de" },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const trigger = canvas.getByRole("button", { name: m.Search.facets });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", { name: m.Search.facets });
    const scope = within(dialog);
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const more = scope.getByText(m.Search.moreFilters.replace("{count}", "8"));
    await userEvent.click(more);
    await waitFor(() => expect(more.closest("details")).toHaveAttribute("open"));
    const target = scope.getByRole("link", { name: /\(BR\)/ });
    const url = new URL(target.getAttribute("href")!, window.location.origin);
    await expect(url.searchParams.get("q")).toBe("electricity");
    await expect(url.searchParams.get("source")).toBe("storybook");
    await expect(url.searchParams.get("geo")).toBe("BR");
    await expect(url.searchParams.has("cursor")).toBe(false);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await userEvent.click(
      (await body.findByRole("dialog")).querySelector<HTMLAnchorElement>("a[href]")!,
    );
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};
export const DarkFrench: Story = {
  ...MobileGerman,
  globals: { ...mobileGlobals, locale: "fr", theme: "dark" },
};
