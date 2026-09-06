import { useId } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SearchIcon } from "lucide-react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../../src/components/ui/field";
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
}: {
  locale: PortalLocale;
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
          id={`${id}-query`}
          placeholder={m.Search.placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
        />
        <FieldDescription id={`${id}-help`}>
          {invalid ? m.Collections.invalidRef : m.Search.privacy}
        </FieldDescription>
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
        <InputGroup>
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
            <InputGroupButton disabled={disabled}>{m.Search.submit}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-note`}>{m.Collections.note}</FieldLabel>
        <InputGroup>
          <InputGroupTextarea id={`${id}-note`} disabled={disabled} />
          <InputGroupAddon align="block-end">
            <InputGroupText>{m.Common.localOnly}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <Label htmlFor={`${id}-kind`}>{m.Search.objectType}</Label>
        <Select defaultValue="process" disabled={disabled}>
          <SelectTrigger id={`${id}-kind`} aria-invalid={invalid}>
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
  tags: ["a11y-pending"],
  parameters: {
    a11y: { test: "todo" },
    docs: {
      description: {
        story:
          "Known disabled InputGroup description contrast failure (1.86:1), tracked in [Portal #55](https://github.com/tiangong-lca/portal/issues/55). The state remains visible for design review.",
      },
    },
  },
};
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const Dark: Story = { globals: { theme: "dark" } };
