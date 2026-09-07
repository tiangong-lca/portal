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
  subcomponents: { CompareSelectionProvider },
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
          "Actual SearchResults cards use shared comfortable action sizes and a two-column action group on narrow screens. Long labels wrap without truncating the action.",
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
export const ProcessAndFlow: Story = {
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('[data-slot="action-group"]')!;
    const controls = [...group.querySelectorAll<HTMLElement>('[data-slot="button"]')];
    const bounds = group.getBoundingClientRect();
    for (const control of controls) {
      const box = control.getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(44);
      await expect(box.right).toBeLessThanOrEqual(bounds.right + 1);
      const sameRow = controls.filter(
        (other) => Math.abs(other.getBoundingClientRect().top - box.top) < 1,
      );
      for (const other of sameRow)
        await expect(
          Math.abs(other.getBoundingClientRect().height - box.height),
        ).toBeLessThanOrEqual(1);
    }
  },
};
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
export const MobileGerman: Story = {
  ...ProcessAndFlow,
  globals: { ...mobileGlobals, locale: "de" },
};
export const DarkFrench: Story = { globals: { theme: "dark", locale: "fr" } };
