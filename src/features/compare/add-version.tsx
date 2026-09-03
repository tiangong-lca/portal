"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isExactDatasetRef } from "@/features/catalog/exact-ref";
import { compareSelectionHref } from "@/features/compare/selection";
import type { PortalLocale } from "@/i18n/routing";

export function AddCompareVersion({
  ids,
  locale,
  labels,
}: {
  ids: string[];
  locale: PortalLocale;
  labels: { title: string; hint: string; invalid: string; add: string };
}) {
  const [invalid, setInvalid] = useState(false);
  const router = useRouter();
  if (ids.length >= 4) return null;
  return (
    <form
      className="flex max-w-3xl flex-col gap-2"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("ids");
        const ref = typeof value === "string" ? value.trim() : "";
        if (!isExactDatasetRef(ref)) {
          setInvalid(true);
          return;
        }
        setInvalid(false);
        router.push(
          compareSelectionHref(
            locale,
            [...new Set([...ids, ref])].map((value) => ({ ref: value, name: value })),
          ),
        );
      }}
    >
      <input name="v" type="hidden" value="1" />
      <Field>
        <FieldLabel htmlFor="add-compare-version">{labels.title}</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-describedby="add-compare-hint"
            aria-invalid={invalid}
            className="min-h-11 min-w-0"
            id="add-compare-version"
            maxLength={46}
            name="ids"
            placeholder="00000000-0000-0000-0000-000000000000@01.00.000"
            required
          />
          <Button className="h-auto min-h-11 whitespace-normal" type="submit" variant="outline">
            {labels.add}
          </Button>
        </div>
        <FieldDescription id="add-compare-hint">
          {invalid ? labels.invalid : labels.hint}
        </FieldDescription>
      </Field>
      {ids.map((ref) => (
        <input key={ref} name="ids" type="hidden" value={ref} />
      ))}
    </form>
  );
}
