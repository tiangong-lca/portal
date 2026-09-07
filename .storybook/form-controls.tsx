import { useId } from "react";
import { SearchIcon } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../src/components/ui/field";
import { Input } from "../src/components/ui/input";
import { Textarea } from "../src/components/ui/textarea";
import { Label } from "../src/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "../src/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/ui/select";
import type { PortalLocale } from "../src/i18n/routing";
import { dictionaries } from "./fixtures";

/** Form composition with localized labels and normal, invalid, disabled and compact states.
 * @import import { FormControls } from "../form-controls";
 */
export function FormControls({
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
