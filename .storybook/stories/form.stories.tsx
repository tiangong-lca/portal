import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FormControls } from "../form-controls";
import { Input } from "../../src/components/ui/input";
import { Textarea } from "../../src/components/ui/textarea";
import { Field, FieldLabel, FieldDescription, FieldError } from "../../src/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "../../src/components/ui/input-group";
import { dictionaries, storyLocale, mobileGlobals } from "../fixtures";

const meta = {
  title: "Primitives/Form controls",
  component: FormControls,
  subcomponents: {
    Input,
    Textarea,
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
  },
  args: { state: "default", locale: "zh-CN" },
  argTypes: {
    state: { control: "select", options: ["default", "invalid", "disabled"] },
    locale: { control: false },
  },
  render: (args, { globals }) => <FormControls {...args} locale={storyLocale(globals)} />,
} satisfies Meta<typeof FormControls>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const input = canvas.getByRole("textbox", { name: m.Search.label });
    await userEvent.click(input);
    await userEvent.type(input, "electricity");
    await expect(input).toHaveValue("electricity");
    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("option", { name: m.Common.flow }),
    );
    await expect(canvas.getByRole("combobox")).toHaveTextContent(m.Common.flow);
  },
};
export const Invalid: Story = { args: { state: "invalid" } };
export const Disabled: Story = {
  args: { state: "disabled" },
};
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const Dark: Story = { globals: { theme: "dark" } };

export const AddonFocus: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const note = canvas.getByRole("textbox", { name: m.Collections.note });
    const search = canvas.getByRole("textbox", { name: m.Common.search });
    await userEvent.click(canvas.getByText(m.Common.localOnly));
    await expect(note).toHaveFocus();
    const addon = search
      .closest('[data-slot="input-group"]')!
      .querySelector('[data-slot="input-group-addon"]')!;
    await userEvent.click(addon);
    await expect(search).toHaveFocus();
    const button = canvas.getByRole("button", { name: m.Search.submit });
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};
export const Compact: Story = {
  args: { controlSize: "sm" },
  play: async ({ canvasElement }) => {
    for (const group of canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-group"]')) {
      await expect(group.scrollHeight).toBeLessThanOrEqual(
        group.getBoundingClientRect().height + 1,
      );
    }
  },
};
export const DisabledAddonFocus: Story = {
  args: { state: "disabled" },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(canvas.getByText(m.Common.localOnly));
    await expect(canvas.getByRole("textbox", { name: m.Collections.note })).not.toHaveFocus();
    await expect(canvas.getByRole("button", { name: m.Search.submit })).toBeDisabled();
  },
};
export const DarkDisabled: Story = { ...DisabledAddonFocus, globals: { theme: "dark" } };
export const DarkInvalid: Story = { ...Invalid, globals: { theme: "dark" } };
