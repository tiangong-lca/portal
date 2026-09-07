"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** @import import { FieldGroup } from "@/components/ui/field"; */
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex w-full flex-col gap-5", className)}
      data-slot="field-group"
      {...props}
    />
  );
}

/** @import import { Field } from "@/components/ui/field"; */
function Field({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn("flex w-full flex-col gap-2 border-0 p-0", className)}
      data-slot="field"
      {...props}
    />
  );
}

/** @import import { FieldLabel } from "@/components/ui/field"; */
function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn("w-fit", className)} data-slot="field-label" {...props} />;
}

/** @import import { FieldDescription } from "@/components/ui/field"; */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

/** @import import { FieldError } from "@/components/ui/field"; */
function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-destructive text-sm font-medium", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel };
