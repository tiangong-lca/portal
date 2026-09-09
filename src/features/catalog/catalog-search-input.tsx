"use client";

import { useState, useRef } from "react";
import type { ComponentProps } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { SearchModeControl } from "./search-modes";
import "./search-workspace.css";

/** Shared real search input for the public route and interactive design reference.
 * @import import { CatalogSearchInput } from "@/features/catalog/catalog-search-input";
 */
export function CatalogSearchInput({
  submitLabel,
  onClear,
  clearLabel,
  ...input
}: ComponentProps<typeof InputGroupInput> & {
  submitLabel: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  const [draft, setDraft] = useState(input.defaultValue ?? "");
  const value = input.value ?? draft;
  const field = useRef<HTMLInputElement>(null);
  return (
    <InputGroup className="catalog-query-control">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        {...input}
        ref={field}
        defaultValue={undefined}
        value={value}
        onChange={(event) => {
          setDraft(event.target.value);
          input.onChange?.(event);
        }}
      />
      <InputGroupAddon align="inline-end">
        {clearLabel && value && (
          <Button
            className="catalog-query-clear"
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={clearLabel}
            onClick={() => {
              setDraft("");
              onClear?.();
              field.current?.focus();
            }}
          >
            <XIcon aria-hidden="true" />
          </Button>
        )}
        <SearchModeControl />
        <Button type="submit">{submitLabel}</Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
