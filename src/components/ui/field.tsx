"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex w-full flex-col gap-5", className)}
      data-slot="field-group"
      {...props}
    />
  );
}

function Field({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn("flex w-full flex-col gap-2 border-0 p-0", className)}
      data-slot="field"
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn("w-fit", className)} data-slot="field-label" {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldGroup, FieldLabel };
