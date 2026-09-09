import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { MethodologyOverview } from "@/features/catalog/methodology-overview";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";
const meta = {
  title: "Catalog/Data guide",
  component: MethodologyOverview,
  args: { labels: dictionaries["zh-CN"].Methodology },
  parameters: { pageLayout: true },
  tags: ["!autodocs"],
  render: (_, { globals }) => (
    <MethodologyOverview labels={dictionaries[storyLocale(globals)].Methodology} />
  ),
} satisfies Meta<typeof MethodologyOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {
  play: async ({ canvas, globals }) => {
    const m = dictionaries[storyLocale(globals)].Methodology;
    const link = canvas.getByRole("link", { name: m.provenance });
    await expect(link).toHaveAttribute("href", "#provenance");
    await expect(canvas.getByRole("heading", { name: m.provenance })).toBeVisible();
  },
};
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const DarkFrench: Story = { globals: { theme: "dark", locale: "fr" } };
