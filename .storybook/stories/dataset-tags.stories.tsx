import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { DatasetVersionTag, PublicContentTag } from "../../src/features/catalog/dataset-tags";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Catalog/Dataset tags",
  component: PublicContentTag,
  subcomponents: { DatasetVersionTag },
  args: { content: "exchanges", compact: true, labels: dictionaries.en.CatalogReference },
  parameters: {
    docs: {
      description: {
        component:
          "Shared catalog identity and public-content tags. Exact versions are static text; icon explanations support hover, focus and touch. These components are currently adopted by the page reference only. Their styles require semantic Portal tokens, not reference-page CSS or fixture types.",
      },
    },
  },
  render: (args, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <div className="flex flex-wrap items-center gap-4 p-6">
        <DatasetVersionTag version="01.01.002" label={m.Search.version} />
        <PublicContentTag {...args} labels={m.CatalogReference} />
      </div>
    );
  },
} satisfies Meta<typeof PublicContentTag>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Exchanges: Story = {};
export const Metadata: Story = { args: { content: "metadata" } };
export const TextLabel: Story = { args: { compact: false } };
export const Dark: Story = { globals: { theme: "dark", locale: "fr" } };
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const KeyboardExplanation: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].CatalogReference;
    const button = canvas.getByRole("button", {
      name: `${m.publicContent}: ${m.availabilityExchanges}`,
    });
    button.focus();
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.findByRole("tooltip")).resolves.toHaveTextContent(m.exchangesHelp);
    await userEvent.keyboard("{Escape}");
    await expect(button).toHaveFocus();
    await expect(canvas.getByText("v01.01.002", { exact: false })).toHaveTextContent("v01.01.002");
  },
};
