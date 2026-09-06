import { useId } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SearchIcon } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../src/components/ui/field";
import { Input } from "../../src/components/ui/input";
import { Textarea } from "../../src/components/ui/textarea";
import { Label } from "../../src/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "../../src/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import type { PortalLocale } from "../../src/i18n/routing";
import { dictionaries, storyLocale, mobileGlobals } from "../fixtures";

function FormControls({
  locale,
  state,
  controlSize = "default",
}: {
  locale: PortalLocale;
  controlSize?: "default" | "sm";
  state: "default" | "invalid" | "disabled";
}) {
  const id = useId();
  const m = dictionaries[locale];
  const disabled = state === "disabled";
  const invalid = state === "invalid";
  return (
    <FieldGroup className="max-w-xl">
      <Field>
        <FieldLabel htmlFor={`${id}-query`}>{m.Search.label}</FieldLabel>
        <Input
          controlSize={controlSize}
          id={`${id}-query`}
          placeholder={m.Search.placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
        />
        {invalid ? (
          <FieldError id={`${id}-help`}>{m.Collections.invalidRef}</FieldError>
        ) : (
          <FieldDescription id={`${id}-help`}>{m.Search.privacy}</FieldDescription>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-description`}>{m.Hybrid.queryLabel}</FieldLabel>
        <Textarea
          id={`${id}-description`}
          placeholder={m.Hybrid.queryPlaceholder}
          disabled={disabled}
          aria-invalid={invalid}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-search`}>{m.Common.search}</FieldLabel>
        <InputGroup controlSize={controlSize}>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${id}-search`}
            placeholder={m.Search.placeholder}
            disabled={disabled}
            aria-invalid={invalid}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size={controlSize === "sm" ? "xs" : "sm"} disabled={disabled}>
              {m.Search.submit}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-note`}>{m.Collections.note}</FieldLabel>
        <InputGroup controlSize={controlSize}>
          <InputGroupTextarea id={`${id}-note`} disabled={disabled} />
          <InputGroupAddon align="block-end">
            <InputGroupText>{m.Common.localOnly}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <Label htmlFor={`${id}-kind`}>{m.Search.objectType}</Label>
        <Select defaultValue="process" disabled={disabled}>
          <SelectTrigger size={controlSize} id={`${id}-kind`} aria-invalid={invalid}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="process">{m.Common.process}</SelectItem>
            <SelectItem value="flow">{m.Common.flow}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}

const meta = {
  title: "Primitives/Form controls",
  component: FormControls,
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
