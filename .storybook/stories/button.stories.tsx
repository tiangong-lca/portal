import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { Button } from "../../src/components/ui/button";
import { dictionaries, storyLocale } from "../fixtures";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { onClick: fn(), variant: "default", size: "default" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
  render: (args, { globals }) => (
    <Button {...args}>{args.children ?? dictionaries[storyLocale(globals)].Common.search}</Button>
  ),
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button")).toHaveFocus();
  },
};
export const Loading: Story = {
  render: (args, { globals }) => (
    <Button {...args} aria-busy disabled>
      <LoaderCircleIcon className="animate-spin" />
      {dictionaries[storyLocale(globals)].Hybrid.running}
    </Button>
  ),
};
export const LongLabel: Story = {
  render: (args, { globals }) => (
    <Button {...args}>{dictionaries[storyLocale(globals)].Compare.continueSelecting}</Button>
  ),
};
export const Variants: Story = {
  render: (args, { globals }) => (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <Button {...args} key={variant} variant={variant}>
            {variant} · {dictionaries[storyLocale(globals)].Common.search}
          </Button>
        ),
      )}
    </div>
  ),
};
export const Sizes: Story = {
  render: (args, { globals }) => (
    <div className="flex flex-wrap items-center gap-4">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <Button {...args} key={size} size={size}>
          {size} · {dictionaries[storyLocale(globals)].Common.search}
        </Button>
      ))}
      <Button {...args} aria-label={dictionaries[storyLocale(globals)].Collections.add} size="icon">
        <PlusIcon />
      </Button>
    </div>
  ),
};
export const Dark: Story = { ...Variants, globals: { theme: "dark" } };
