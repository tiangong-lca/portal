import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import { dictionaries, storyLocale } from "../fixtures";

/** Single-value selection with a labelled trigger and keyboard-accessible options. */
const meta = {
  title: "Primitives/Select",
  component: Select,
  subcomponents: { SelectTrigger, SelectContent, SelectItem, SelectValue },
  args: { defaultValue: "process", onValueChange: fn() },
  render: (args, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <Select {...args}>
        <SelectTrigger aria-label={m.Search.objectType}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="process">{m.Common.process}</SelectItem>
          <SelectItem value="flow">{m.Common.flow}</SelectItem>
        </SelectContent>
      </Select>
    );
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled selection emits the selected value and returns focus to the trigger. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals, args }) => {
    const m = dictionaries[storyLocale(globals)];
    const trigger = canvas.getByRole("combobox", { name: m.Search.objectType });
    await userEvent.click(trigger);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("option", { name: m.Common.flow }),
    );
    await expect(trigger).toHaveTextContent(m.Common.flow);
    await expect(args.onValueChange).toHaveBeenCalledWith("flow");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** The entire selection flow works without a pointer. */
export const KeyboardSelection: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals, args }) => {
    const m = dictionaries[storyLocale(globals)];
    const trigger = canvas.getByRole("combobox", { name: m.Search.objectType });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("option", { selected: true })).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(trigger).toHaveTextContent(m.Common.flow);
    await expect(args.onValueChange).toHaveBeenCalledWith("flow");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("combobox");
    await expect(trigger).toBeDisabled();
    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

/** Keep the popup open so the strict accessibility check covers the modal state. */
export const Open: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(canvas.getByRole("combobox", { name: m.Search.objectType }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("listbox")).toBeVisible());
    await expect(body.getAllByRole("option")).toHaveLength(2);
  },
};
