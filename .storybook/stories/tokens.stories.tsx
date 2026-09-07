import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PortalTokens } from "../portal-tokens";

const meta = {
  title: "Foundations/Portal tokens",
  component: PortalTokens,
  parameters: {
    docs: {
      description: {
        component:
          "Production globals.css and generated brand tokens. Use the theme and locale toolbar to review real component states; this inventory does not mark existing UI as design-approved.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const SemanticColors: Story = {};
export const Dark: Story = {
  ...SemanticColors,
  globals: { theme: "dark" },
};
