import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { SearchResults } from "../../src/features/catalog/search-results";
import { CompareSelectionProvider } from "../../src/features/compare/selection";
import {
  catalogItems,
  dictionaries,
  mobileGlobals,
  resultLabels,
  selectionLabels,
  storyLocale,
} from "../fixtures";

const meta = {
  title: "Catalog/Search results",
  component: SearchResults,
  tags: ["!autodocs"],
  argTypes: { items: { control: false }, labels: { control: false }, locale: { control: false } },
  args: {
    items: catalogItems("zh-CN"),
    labels: resultLabels("zh-CN"),
    locale: "zh-CN",
    siteOrigin: "https://portal.example",
    selectable: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Actual SearchResults cards and action groups. Mixed button heights and existing selection copy remain visible for design review.",
      },
    },
  },
  render: (args, { globals, parameters }) => {
    const locale = storyLocale(globals);
    const items = parameters.empty ? [] : catalogItems(locale);
    if (parameters.versions && items[0])
      items[0].matchingVersions = [
        {
          ref: items[0].ref.replace("01.00.000", "02.00.000"),
          version: "02.00.000",
          name: items[0].name,
        },
      ];
    if (parameters.missing && items[0]) delete items[0].functionalUnit;
    return (
      <CompareSelectionProvider key={locale} labels={selectionLabels(locale)} locale={locale}>
        <SearchResults {...args} items={items} labels={resultLabels(locale)} locale={locale} />
      </CompareSelectionProvider>
    );
  },
} satisfies Meta<typeof SearchResults>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ProcessAndFlow: Story = {};
export const Empty: Story = { parameters: { empty: true } };
export const MissingMetadata: Story = { parameters: { missing: true } };
export const MatchingVersions: Story = {
  parameters: { versions: true },
  play: async ({ canvas, userEvent, globals }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: new RegExp(dictionaries[storyLocale(globals)].Search.matchingVersions),
      }),
    );
    await expect(canvas.getByText("02.00.000", { exact: false })).toBeVisible();
  },
};
export const SelectForComparison: Story = {
  args: { selectable: true },
  play: async ({ canvas, userEvent, globals }) => {
    const checkboxes = canvas.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]!);
    await userEvent.click(checkboxes[1]!);
    await expect(
      canvas.getByRole("link", { name: dictionaries[storyLocale(globals)].Compare.openComparison }),
    ).toHaveAttribute("href", expect.stringContaining("ids="));
  },
};
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const DarkFrench: Story = { globals: { theme: "dark", locale: "fr" } };
